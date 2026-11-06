import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {aiConfig,aiCapabilities,createAIService,AIServiceError} from '@/lib/coach/ai';
import {withPronunciation} from '@/lib/coach/pronunciation';
import {listeningMaterials} from '@/lib/coach/listening-catalog';
import {publicListening,listeningView,ownListening,expireListeningCalls,listeningAnswers,scoreListening,type ListeningRow} from '@/lib/coach/listening';
import {fingerprint,DAILY_CALL_LIMIT} from '@/lib/coach/conversations';
import {sharedUsage,sharedUsageSQL} from '@/lib/coach/usage';
import type {ListeningMaterial} from '@/lib/coach/listening-types';

async function session(db:D1Database,row:ListeningRow){await expireListeningCalls(db,row.id);const running=await db.prepare("SELECT id FROM coach_listening_calls WHERE attempt_id = ? AND status = 'running' LIMIT 1").bind(row.id).first();return {attempt:listeningView(row),capabilities:aiCapabilities(env),processing:Boolean(running)}}
export async function GET(request:Request){try{
 const {db,user}=await context(request),url=new URL(request.url),p=await ownProfile(db,user.userId,url.searchParams.get('profileId')??''),id=url.searchParams.get('attemptId');
 if(id)return reply(await session(db,await ownListening(db,p.id,id)));
 const {results}=await db.prepare('SELECT * FROM coach_listening_attempts WHERE profile_id = ? ORDER BY created_at DESC LIMIT 100').bind(p.id).all<ListeningRow>();
 return reply({materials:listeningMaterials.filter(m=>m.language===p.language&&m.level===JSON.parse(p.goal).level).map(publicListening),attempts:results.map(r=>{const m:ListeningMaterial=JSON.parse(r.snapshot);return {id:r.id,materialId:r.material_id,title:m.title,level:m.level,status:r.status,startedAt:r.created_at}}),capabilities:aiCapabilities(env),usage:{used:await sharedUsage(db,user.userId),limit:DAILY_CALL_LIMIT}});
}catch(e){return failure(e)}}
const uuid=z.string().uuid(),base={profileId:uuid,attemptId:uuid};
const schema=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('start'),materialId:z.string().max(120)}).strict(),
 z.object({...base,action:z.literal('audio'),segmentId:z.string().min(1).max(40).nullable(),commandId:uuid}).strict(),
 z.object({...base,action:z.literal('played'),callId:uuid}).strict(),
 z.object({...base,action:z.enum(['save','submit']),commandId:uuid,revision:z.number().int().nonnegative(),answers:z.object({choices:z.record(z.number().int()),dictation:z.string().max(200)}).strict()}).strict(),
 z.object({...base,action:z.literal('bookmark'),segmentId:z.string().max(40)}).strict(),
]);
export async function POST(request:Request){let activeCall:{db:D1Database;id:string}|null=null;try{
 const {db,user}=await context(request),input=schema.parse(await readBody(request)),p=await ownProfile(db,user.userId,input.profileId),now=Date.now();
 if(input.action==='start'){
  const old=await db.prepare('SELECT * FROM coach_listening_attempts WHERE id = ?').bind(input.attemptId).first<ListeningRow>();
  if(old){if(old.profile_id!==p.id||old.material_id!==input.materialId)throw new CoachError(409,'同一开始请求不能更换练习。');return reply(await session(db,old))}
  const material=listeningMaterials.find(m=>m.id===input.materialId&&m.language===p.language&&m.level===JSON.parse(p.goal).level);
  if(!material)throw new CoachError(404,'此听力材料不属于当前语言和等级。');
  await db.prepare("INSERT INTO coach_listening_attempts (id,profile_id,material_id,snapshot,answers,repeated,created_at) SELECT ?,?,?,?,?,(EXISTS (SELECT 1 FROM coach_listening_attempts WHERE profile_id = ? AND material_id = ?) OR EXISTS (SELECT 1 FROM coach_attempts WHERE profile_id = ? AND lesson_id = ?) OR EXISTS (SELECT 1 FROM coach_exam_attempts e,json_each(e.snapshot,'$.items') j WHERE e.profile_id = ? AND json_extract(j.value,'$.audio.sourceMaterialId') = ?)),? WHERE (SELECT count(*) FROM coach_listening_attempts WHERE profile_id = ? AND created_at >= ?) < 30 ON CONFLICT(id) DO NOTHING").bind(input.attemptId,p.id,material.id,JSON.stringify(withPronunciation(material)),JSON.stringify({choices:{},dictation:''}),p.id,material.id,p.id,material.lessonId,p.id,material.id,now,p.id,now-86400000).run();
  const row=await db.prepare('SELECT * FROM coach_listening_attempts WHERE id = ?').bind(input.attemptId).first<ListeningRow>();
  if(!row)throw new CoachError(429,'今天开始的听力练习较多，请先继续已有练习。');
  if(row.profile_id!==p.id||row.material_id!==material.id)throw new CoachError(409,'此开始请求已被使用。');
  return reply(await session(db,row));
 }
 let row=await ownListening(db,p.id,input.attemptId);const m:ListeningMaterial=JSON.parse(row.snapshot);
 if(input.action==='audio'){
  if(input.segmentId&&row.status!=='submitted')throw new CoachError(409,'请先整段听并提交理解题，再逐句精听。');
  const segment=input.segmentId?m.segments.find(s=>s.id===input.segmentId):null;
  if(input.segmentId&&!segment)throw new CoachError(404,'找不到这句音频。');
  const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'语音服务待配置，当前不能生成真实听力音频。');
  await expireListeningCalls(db,row.id);
  const old=await db.prepare('SELECT * FROM coach_listening_calls WHERE id = ?').bind(input.commandId).first<{user_id:string;attempt_id:string;segment_id:string|null;status:string}>();
  if(old){if(old.user_id!==user.userId||old.attempt_id!==row.id||old.segment_id!==input.segmentId)throw new CoachError(409,'同一音频请求不能更换内容。');throw new CoachError(409,old.status==='running'?'音频仍在生成，请稍后读取状态。':'这次音频请求已经处理；如未取得音频，请重新点击生成。')}
  const reserved=await db.prepare(`INSERT INTO coach_listening_calls (id,attempt_id,user_id,segment_id,status,created_at) SELECT ?,?,?,?,'running',? WHERE NOT EXISTS (SELECT 1 FROM coach_listening_calls WHERE attempt_id = ? AND status = 'running') AND (${sharedUsageSQL}) < ? ON CONFLICT(id) DO NOTHING`).bind(input.commandId,row.id,user.userId,input.segmentId,now,row.id,user.userId,new Date(now).setUTCHours(0,0,0,0),DAILY_CALL_LIMIT).run();
  if(!reserved.meta.changes){if(await sharedUsage(db,user.userId)>=DAILY_CALL_LIMIT)throw new CoachError(429,'今天的语音与 AI 共用额度已用完，已保存内容仍可查看。');throw new CoachError(409,'音频仍在处理中，请稍后读取状态。')}
  activeCall={db,id:input.commandId};
  const result=await createAIService(config).speak(segment?.text??m.segments.map(s=>s.text).join(' '),m.language);
  const stored=await db.prepare("UPDATE coach_listening_calls SET status = 'succeeded',request_id = ?,model = ?,voice = ?,finished_at = ? WHERE id = ? AND status = 'running'").bind(result.requestId,result.model,config.voices[m.language],Date.now(),input.commandId).run();
  if(!stored.meta.changes)throw new CoachError(409,'这次音频生成已中断，请重新读取后再试。');
  return new Response(result.audio.slice().buffer as ArrayBuffer,{headers:{'Content-Type':result.mimeType,'Cache-Control':'private, no-store','Vary':'Cookie','X-Coach-Voice':'AI-generated','X-Coach-Playback-Id':input.commandId}});
 }
 if(input.action==='played'){
  const call=await db.prepare("SELECT id FROM coach_listening_calls WHERE id = ? AND attempt_id = ? AND user_id = ? AND segment_id IS NULL AND status = 'succeeded'").bind(input.callId,row.id,user.userId).first();
  if(!call)throw new CoachError(400,'此播放记录不对应已生成的整段音频。');
  await db.prepare('UPDATE coach_listening_attempts SET played_call_id = ?,played_at = ? WHERE id = ? AND profile_id = ? AND played_call_id IS NULL').bind(input.callId,now,row.id,p.id).run();
  return reply(await session(db,await ownListening(db,p.id,row.id)));
 }
 if(input.action==='bookmark'){
  if(row.status!=='submitted')throw new CoachError(409,'提交理解练习后可收藏句子。');
  const segment=m.segments.find(s=>s.id===input.segmentId);if(!segment)throw new CoachError(404,'找不到此句子。');
  await db.prepare("INSERT INTO coach_review_items (id,profile_id,source_key,kind,payload,stage,due_at,revision,created_at) VALUES (?,?,?,'sentence',?,0,?,0,?) ON CONFLICT(profile_id,source_key) DO UPDATE SET payload=CASE WHEN json_extract(coach_review_items.payload,'$.pronunciation') IS NULL AND json_extract(excluded.payload,'$.pronunciation') IS NOT NULL THEN json_set(coach_review_items.payload,'$.pronunciation',json_extract(excluded.payload,'$.pronunciation')) ELSE coach_review_items.payload END").bind(crypto.randomUUID(),p.id,`listening:${m.id}:v${m.version}:${segment.id}`,JSON.stringify({target:segment.text,zh:segment.zh,lessonTitle:m.title,language:m.language,pronunciation:m.pronunciation??null}),now,now).run();return reply({ok:true});
 }
 const answers=listeningAnswers(m,input.answers),hash=await fingerprint({action:input.action,revision:input.revision,answers});
 const old=await db.prepare('SELECT * FROM coach_listening_commands WHERE id = ?').bind(input.commandId).first<{attempt_id:string;fingerprint:string}>();
 if(old){if(old.attempt_id!==row.id||old.fingerprint!==hash)throw new CoachError(409,'同一保存请求不能更改内容。');return reply(await session(db,row))}
 if(row.status!=='active')throw new CoachError(409,'已经提交的练习不能改写答案。');
 if(row.revision!==input.revision)throw new CoachError(409,'答案已在另一页面更新，请读取已保存版本。');
 if(input.action==='submit'&&!row.played_call_id)throw new CoachError(409,'请先完成整段音频播放；无法播放时不能记为听力训练。');
 const submitted=input.action==='submit',result=submitted?scoreListening(m,answers,Boolean(row.repeated)):null;
 await db.batch([
  db.prepare("INSERT INTO coach_listening_commands (id,attempt_id,fingerprint,previous_revision,created_at) SELECT ?,id,?,?,? FROM coach_listening_attempts WHERE id = ? AND profile_id = ? AND status = 'active' AND revision = ? ON CONFLICT(id) DO NOTHING").bind(input.commandId,hash,input.revision,now,row.id,p.id,input.revision),
  db.prepare("UPDATE coach_listening_attempts SET answers = ?,status = ?,result = ?,submitted_at = ?,revision = revision + 1 WHERE id = ? AND profile_id = ? AND status = 'active' AND revision = ? AND EXISTS (SELECT 1 FROM coach_listening_commands WHERE id = ? AND attempt_id = ? AND fingerprint = ? AND previous_revision = ?)").bind(JSON.stringify(answers),submitted?'submitted':'active',result?JSON.stringify(result):null,submitted?now:null,row.id,p.id,input.revision,input.commandId,row.id,hash,input.revision),
 ]);
 const accepted=await db.prepare('SELECT attempt_id,fingerprint FROM coach_listening_commands WHERE id = ?').bind(input.commandId).first<{attempt_id:string;fingerprint:string}>();
 if(!accepted||accepted.attempt_id!==row.id||accepted.fingerprint!==hash)throw new CoachError(409,'答案未被保存，请读取最新记录。');
 row=await ownListening(db,p.id,row.id);return reply(await session(db,row));
}catch(e){
 if(activeCall)await activeCall.db.prepare("UPDATE coach_listening_calls SET status = 'failed',error_code = ?,finished_at = ? WHERE id = ? AND status = 'running'").bind(e instanceof AIServiceError?e.code:'interrupted',Date.now(),activeCall.id).run().catch(()=>{});
 if(e instanceof AIServiceError)return reply({error:e.message,code:e.code,retryable:e.retryable},e.code==='quota'?429:503);
 return failure(e);
}}
