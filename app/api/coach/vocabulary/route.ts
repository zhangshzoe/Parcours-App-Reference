import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {vocabularyEntries} from '@/lib/coach/vocabulary-catalog';
import {aiConfig,aiCapabilities,createAIService,AIServiceError} from '@/lib/coach/ai';
import {sharedUsage,sharedUsageSQL} from '@/lib/coach/usage';
import {DAILY_CALL_LIMIT} from '@/lib/coach/conversations';
const key=(id:string,version:number)=>`vocabulary:${id}:v${version}`;
export async function GET(request:Request){try{
 const {db,user}=await context(request),p=await ownProfile(db,user.userId,new URL(request.url).searchParams.get('profileId')??'');
 const entries=vocabularyEntries.filter(e=>e.language===p.language&&e.level===JSON.parse(p.goal).level);
 const saved=await db.prepare("SELECT source_key FROM coach_review_items WHERE profile_id = ? AND kind = 'vocabulary'").bind(p.id).all<{source_key:string}>();
 const keys=new Set(saved.results.map(r=>r.source_key));
 return reply({entries,savedIds:entries.filter(e=>keys.has(key(e.id,e.version))).map(e=>e.id),capabilities:aiCapabilities(env),usage:{used:await sharedUsage(db,user.userId),limit:DAILY_CALL_LIMIT}});
}catch(e){return failure(e)}}
const base={profileId:z.string().uuid(),entryId:z.string().max(100),version:z.number().int().positive()};
const schema=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('bookmark')}).strict(),
 z.object({...base,action:z.literal('audio'),part:z.enum(['target','example']),commandId:z.string().uuid()}).strict(),
]);
export async function POST(request:Request){let active:{db:D1Database;id:string}|null=null;try{
 const {db,user}=await context(request),input=schema.parse(await readBody(request)),p=await ownProfile(db,user.userId,input.profileId),now=Date.now();
 const entry=vocabularyEntries.find(e=>e.id===input.entryId&&e.version===input.version&&e.language===p.language&&e.level===JSON.parse(p.goal).level);
 if(!entry)throw new CoachError(404,'此词条不属于当前语言、等级或内容版本。');
 if(input.action==='bookmark'){
  await db.prepare("INSERT INTO coach_review_items (id,profile_id,source_key,kind,payload,stage,due_at,revision,created_at) VALUES (?,?,?,'vocabulary',?,0,?,0,?) ON CONFLICT(profile_id,source_key) DO NOTHING").bind(crypto.randomUUID(),p.id,key(entry.id,entry.version),JSON.stringify({target:entry.target,zh:entry.zh,lessonTitle:`${entry.level} 词汇 · ${entry.topic}`,language:entry.language,entrySnapshot:entry}),now,now).run();
  return reply({ok:true,entryId:entry.id});
 }
 const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'词条语音服务待配置，当前没有可播放的词条音频。');
 await db.prepare("UPDATE coach_vocabulary_calls SET status = 'failed',error_code = 'interrupted',finished_at = ? WHERE profile_id = ? AND status = 'running' AND created_at < ?").bind(now,p.id,now-90000).run();
 const old=await db.prepare('SELECT * FROM coach_vocabulary_calls WHERE id = ?').bind(input.commandId).first<{profile_id:string;entry_id:string;content_version:number;part:string;status:string}>();
 if(old){if(old.profile_id!==p.id||old.entry_id!==entry.id||old.content_version!==entry.version||old.part!==input.part)throw new CoachError(409,'同一音频请求不能更换词条或内容。');throw new CoachError(409,old.status==='running'?'音频仍在生成，请稍后重试。':'此请求已处理；音频不长期保存，如未取得，可再次点击重新生成。')}
 const reserved=await db.prepare(`INSERT INTO coach_vocabulary_calls (id,profile_id,user_id,entry_id,content_version,part,status,created_at) SELECT ?,?,?,?,?,?,'running',? WHERE NOT EXISTS (SELECT 1 FROM coach_vocabulary_calls WHERE profile_id = ? AND status = 'running') AND (${sharedUsageSQL}) < ? ON CONFLICT(id) DO NOTHING`).bind(input.commandId,p.id,user.userId,entry.id,entry.version,input.part,now,p.id,user.userId,new Date(now).setUTCHours(0,0,0,0),DAILY_CALL_LIMIT).run();
 if(!reserved.meta.changes){if(await sharedUsage(db,user.userId)>=DAILY_CALL_LIMIT)throw new CoachError(429,'今天的语音与 AI 共用额度已用完，仍可查看词条和复习。');throw new CoachError(409,'已有词条音频正在处理，请稍后重试。')}
 active={db,id:input.commandId};
 const result=await createAIService(config).speak(input.part==='target'?entry.target:entry.example,entry.language);
 const stored=await db.prepare("UPDATE coach_vocabulary_calls SET status = 'succeeded',request_id = ?,model = ?,voice = ?,finished_at = ? WHERE id = ? AND status = 'running'").bind(result.requestId,result.model,config.voices[entry.language],Date.now(),input.commandId).run();
 if(!stored.meta.changes)throw new CoachError(409,'音频请求已中断，请重新生成。');
 return new Response(result.audio.slice().buffer as ArrayBuffer,{headers:{'Content-Type':result.mimeType,'Cache-Control':'private, no-store','Vary':'Cookie','X-Coach-Voice':'AI-generated'}});
}catch(e){if(active)await active.db.prepare("UPDATE coach_vocabulary_calls SET status = 'failed',error_code = ?,finished_at = ? WHERE id = ? AND status = 'running'").bind(e instanceof AIServiceError?e.code:'interrupted',Date.now(),active.id).run().catch(()=>{});if(e instanceof AIServiceError)return reply({error:e.message,code:e.code,retryable:e.retryable},e.code==='quota'?429:503);return failure(e)}}
