import {audioReceipt} from '@/lib/coach/audio-receipt';
import {sharedUsageSQL} from '@/lib/coach/usage';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {aiConfig,aiCapabilities,createAIService,AIServiceError,type DialogueFeedback} from '@/lib/coach/ai';
import {coachScenarios,getScenario} from '@/lib/coach/scenarios';
import {freePractice,scenarioPractice,savedPractice} from '@/lib/coach/practice';
import {frenchTransferPrompt} from '@/lib/coach/review-transfer';
import {inspectWav,RecordingError} from '@/lib/coach/wav';
import {ownConversation,conversationView,reserveCall,fingerprint,expireCalls,idleClause,callGuard,callSuccess,CONSENT_VERSION,DAILY_CALL_LIMIT,type Turn} from '@/lib/coach/conversations';
export const dynamic='force-dynamic';
const uuid=z.string().uuid(),base={profileId:uuid,conversationId:uuid};
const actions=z.discriminatedUnion('action',[
 z.object({action:z.literal('create-free'),...base,topic:z.string().trim().min(2).max(100).refine(v=>!/[\u0000-\u001f\u007f]/.test(v)),mode:z.enum(['guided','challenge']),consentVersion:z.literal(CONSENT_VERSION)}).strict(),
 z.object({action:z.literal('create'),...base,scenarioId:z.string().max(80),mode:z.enum(['guided','challenge','exam']),consentVersion:z.literal(CONSENT_VERSION)}).strict(),
 z.object({action:z.literal('text'),...base,turnId:uuid,text:z.string().trim().min(1).max(3000)}).strict(),
 z.object({action:z.literal('audio'),...base,turnId:uuid,commandId:uuid,audio:z.string().min(60).max(2560100),consentVersion:z.literal(CONSENT_VERSION)}).strict(),
 z.object({action:z.literal('confirm'),...base,turnId:uuid,revision:z.number().int().nonnegative(),text:z.string().trim().min(1).max(3000)}).strict(),
 z.object({action:z.literal('respond'),...base,turnId:uuid,revision:z.number().int().nonnegative(),commandId:uuid}).strict(),
 z.object({action:z.literal('speak'),...base,turnId:uuid.nullable(),commandId:uuid}).strict(),
 z.object({action:z.literal('end'),...base}).strict(),
 z.object({action:z.literal('summary'),...base,commandId:uuid}).strict(),
 z.object({action:z.literal('bookmark'),...base,turnId:uuid.nullable(),pointIndex:z.number().int().min(0).max(2)}).strict(),
]);
export async function GET(request:Request){try{
 const {db,user}=await context(request),url=new URL(request.url),p=await ownProfile(db,user.userId,uuid.parse(url.searchParams.get('profileId'))),id=url.searchParams.get('conversationId');
 if(id){const c=await ownConversation(db,p.id,uuid.parse(id)),view=await conversationView(db,c),command=url.searchParams.get('audioCommandId');return reply({...view,scenario:savedPractice(c),capabilities:aiCapabilities(env),...(command?{audioReceipt:await audioReceipt(db,'conversation',c.id,user.userId,uuid.parse(command))}:{})})}
 const list=await db.prepare('SELECT id,scenario_id,practice_type,practice_topic,level,mode,status,created_at,ended_at FROM coach_conversations WHERE profile_id = ? ORDER BY created_at DESC LIMIT 50').bind(p.id).all();
 const used=await db.prepare(sharedUsageSQL).bind(user.userId,new Date().setUTCHours(0,0,0,0)).first<{n:number}>();
 return reply({scenarios:coachScenarios.filter(s=>s.language===p.language&&s.level===JSON.parse(p.goal).level),conversations:list.results,capabilities:aiCapabilities(env),usage:{used:used!.n,limit:DAILY_CALL_LIMIT,resetBasis:'UTC'}});
}catch(e){return failure(e)}}
export async function POST(request:Request){
 let activeCall:{db:D1Database;id:string}|null=null;
 try{
 const {db,user}=await context(request),input=actions.parse(await readBody(request,2700000)),p=await ownProfile(db,user.userId,input.profileId),now=Date.now();
 if(input.action==='create'||input.action==='create-free'){
  const level=JSON.parse(p.goal).level;
  const source=input.action==='create'?getScenario(input.scenarioId):null;
  const s=input.action==='create-free'?freePractice(p.language,level,input.topic):source?scenarioPractice(source):null;
  if(!s||s.language!==p.language||s.level!==level)throw new CoachError(404,'当前语言与等级找不到此练习。');
  await db.prepare("INSERT INTO coach_conversations (id,profile_id,scenario_id,scenario_version,practice_type,practice_topic,practice_snapshot,language,level,mode,status,consent_version,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,'active',?,? WHERE (SELECT count(*) FROM coach_conversations WHERE profile_id = ? AND created_at >= ?) < 100 ON CONFLICT(id) DO NOTHING").bind(input.conversationId,p.id,s.id,s.version,s.practiceType,s.topic,JSON.stringify(s),s.language,s.level,input.mode,CONSENT_VERSION,now,p.id,now-86400000).run();
  const c=await ownConversation(db,p.id,input.conversationId);
  if(c.scenario_id!==s.id||c.practice_type!==s.practiceType||c.practice_topic!==s.topic||c.mode!==input.mode)throw new CoachError(409,'同一会话请求不能更换话题、场景或模式。');
  return reply({...await conversationView(db,c),scenario:savedPractice(c),capabilities:aiCapabilities(env)});
 }
 const c=await ownConversation(db,p.id,input.conversationId),scenario=savedPractice(c);
 if(!scenario)throw new CoachError(409,'练习版本不可用，请返回练习列表。');
 await expireCalls(db,c.id);
 const snapshot=()=>conversationView(db,c).then(v=>({...v,scenario,capabilities:aiCapabilities(env)}));
 const turn=async(id:string)=>{const t=await db.prepare('SELECT * FROM coach_turns WHERE id = ? AND conversation_id = ?').bind(id,c.id).first<Turn>();if(!t)throw new CoachError(404,'找不到这轮练习。');return t};
 if(input.action==='bookmark'){
  const sourceTurn=input.turnId?await turn(input.turnId):null;
  const feedback:DialogueFeedback|null=sourceTurn?JSON.parse(sourceTurn.feedback||'null'):c.summary?JSON.parse(c.summary):null;
  const point=feedback?.points[input.pointIndex];if(!point?.suggestion||!['error','natural','task'].includes(point.kind))throw new CoachError(400,'此反馈没有可加入复习的明确建议。');
  await db.prepare('INSERT INTO coach_review_items (id,profile_id,source_key,kind,payload,stage,due_at,revision,created_at) VALUES (?,?,?,?,?,0,?,0,?) ON CONFLICT(profile_id,source_key) DO NOTHING').bind(crypto.randomUUID(),p.id,`conversation:${c.id}:${input.turnId||'summary'}:${input.pointIndex}`,point.kind==='task'?'knowledge':'expression',JSON.stringify({target:point.suggestion,zh:point.explanation,lessonTitle:scenario.title+' · AI 参考反馈',language:c.language,skill:'speaking',knowledge:scenario.tasks.join('；'),taskVersion:scenario.version,sourceAttemptId:c.id,sourceItemId:sourceTurn?.id??null,userAnswer:sourceTurn?.accepted_text??sourceTurn?.original_transcript??null,reviewFocus:point.kind==='task'?'task':undefined,transferPrompt:point.kind==='task'&&c.language==='fr-FR'?frenchTransferPrompt(scenario.id):undefined}),now,now).run();return reply({ok:true});
 }
 if(input.action==='end'){
  if(c.status==='active'){
   const changed=await db.prepare(`UPDATE coach_conversations SET status = 'finished', ended_at = ? WHERE id = ? AND status = 'active' AND ${idleClause}`).bind(now,c.id).run();
   if(!changed.meta.changes)throw new CoachError(409,'请求仍在处理中，请稍后结束会话。');c.status='finished';c.ended_at=now;
  }return reply(await snapshot());
 }
 if(input.action==='text'){
  const existing=await db.prepare('SELECT * FROM coach_turns WHERE id = ?').bind(input.turnId).first<Turn>();
  if(existing){if(existing.conversation_id!==c.id||existing.input_kind!=='text'||existing.original_transcript!==input.text)throw new CoachError(409,'同一轮请求不能改变文字。');return reply(await snapshot())}
  const result=await db.prepare(`INSERT INTO coach_turns (id,conversation_id,sequence,input_kind,original_transcript,recording_ms,revision,state,created_at) SELECT ?,id,(SELECT count(*) FROM coach_turns WHERE conversation_id = ?),'text',?,0,0,'draft',? FROM coach_conversations WHERE id = ? AND status = 'active' AND ${idleClause} AND (SELECT count(*) FROM coach_turns WHERE conversation_id = ?) < 12 AND NOT EXISTS (SELECT 1 FROM coach_turns WHERE conversation_id = ? AND state != 'replied') ON CONFLICT(id) DO NOTHING`).bind(input.turnId,c.id,input.text,now,c.id,c.id,c.id).run();
  if(!result.meta.changes)throw new CoachError(409,'请先完成上一轮；单次会话最多 12 轮。');return reply(await snapshot());
 }
 if(input.action==='confirm'){
  const t=await turn(input.turnId);
  if(t.accepted_text===input.text&&t.revision===input.revision+1&&t.state==='ready')return reply(await snapshot());
  const results=await db.batch([
   db.prepare(`UPDATE coach_turns SET accepted_text = ?,revision = revision + 1,state = 'ready' WHERE id = ? AND conversation_id = ? AND revision = ? AND state IN ('draft','ready') AND EXISTS (SELECT 1 FROM coach_conversations WHERE id = ? AND status = 'active' AND ${idleClause})`).bind(input.text,t.id,c.id,input.revision,c.id),
   db.prepare('INSERT INTO coach_transcript_revisions (id,turn_id,revision,body,created_at) SELECT ?,id,revision,accepted_text,? FROM coach_turns WHERE id = ? AND revision = ? AND accepted_text = ? ON CONFLICT(turn_id,revision) DO NOTHING').bind(crypto.randomUUID(),now,t.id,input.revision+1,input.text),
  ]);if(!results[0].meta.changes)throw new CoachError(409,'转写已更新或正在生成回复，请重新读取。');return reply(await snapshot());
 }
 const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'语音与对话服务尚未配置；已保存的练习可以继续查看。');
 const service=createAIService(config),hash=await fingerprint(input);
 let audioBytes:Uint8Array|undefined,durationMs=0,targetTurn:Turn|undefined;
 let precondition="status = 'active'",params:(string|number)[]=[];
 if(input.action==='audio'){
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio)||input.audio.length%4)throw new CoachError(400,'录音内容格式无效。');
  audioBytes=Uint8Array.from(atob(input.audio),ch=>ch.charCodeAt(0));durationMs=inspectWav(audioBytes).durationMs;
  const existing=await db.prepare('SELECT id FROM coach_turns WHERE id = ?').bind(input.turnId).first();
  if(existing){await turn(input.turnId);const call=await db.prepare("SELECT id FROM coach_service_calls WHERE id = ? AND conversation_id = ? AND fingerprint = ? AND status = 'succeeded'").bind(input.commandId,c.id,hash).first();if(call)return reply(await snapshot());throw new CoachError(409,'此录音轮次已使用，请重新录音。')}
  precondition+=" AND (SELECT count(*) FROM coach_turns WHERE conversation_id = ?) < 12 AND NOT EXISTS (SELECT 1 FROM coach_turns WHERE conversation_id = ? AND state != 'replied')";params=[c.id,c.id];
 }
 if(input.action==='respond'){
  targetTurn=await turn(input.turnId);if(targetTurn.state==='replied')return reply(await snapshot());
  precondition+=" AND EXISTS (SELECT 1 FROM coach_turns WHERE id = ? AND conversation_id = ? AND revision = ? AND state = 'ready')";params=[targetTurn.id,c.id,input.revision];
 }
 if(input.action==='speak'){precondition='1=1';if(input.turnId){targetTurn=await turn(input.turnId);if(!targetTurn.feedback)throw new CoachError(400,'这轮尚无 AI 回复。')}}
 if(input.action==='summary'){
  if(c.summary)return reply(await snapshot());
  precondition="status = 'finished' AND EXISTS (SELECT 1 FROM coach_turns WHERE conversation_id = ? AND state = 'replied')";params=[c.id];
 }
 const reserved=await reserveCall(db,user.userId,c,input.commandId,input.action,hash,precondition,params);
 if(!reserved){if(input.action==='speak')throw new CoachError(409,'这段音频未长期保存，请重新点击播放生成。');return reply(await snapshot())}
 activeCall={db,id:input.commandId};
 if(input.action==='audio'){
  const result=await service.transcribe(new Blob([audioBytes!.slice().buffer as ArrayBuffer],{type:'audio/wav'}),c.language);
  const results=await db.batch([
   db.prepare(`INSERT INTO coach_turns (id,conversation_id,sequence,input_kind,original_transcript,recording_ms,revision,state,created_at) SELECT ?,?,(SELECT count(*) FROM coach_turns WHERE conversation_id = ?),'audio',?,?,0,'draft',? WHERE ${callGuard}`).bind(input.turnId,c.id,c.id,result.text,durationMs,now,input.commandId),
   callSuccess(db,input.commandId,result.requestId,result.model),
  ]);if(!results[0].meta.changes)throw new CoachError(409,'此次处理已中断，请重新读取记录。');
 }else if(input.action==='speak'){
  const text=targetTurn?(JSON.parse(targetTurn.feedback!) as DialogueFeedback).reply:scenario.opening;
  const result=await service.speak(text,c.language),saved=await callSuccess(db,input.commandId,result.requestId,result.model).run();
  if(!saved.meta.changes)throw new CoachError(409,'此次播放请求已过期，请重试。');
  return new Response(result.audio.slice().buffer as ArrayBuffer,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'private, no-store','X-Coach-Voice':'AI-generated'}});
 }else{
  const turns=await db.prepare("SELECT * FROM coach_turns WHERE conversation_id = ? AND state IN ('ready','replied') ORDER BY sequence").bind(c.id).all<Turn>();
  const history=turns.results.flatMap(t=>[{role:'user' as const,text:t.accepted_text!},...(t.feedback?[{role:'assistant' as const,text:(JSON.parse(t.feedback) as DialogueFeedback).reply}]:[])]);
  const result=await service.dialogue({language:c.language,level:c.level,mode:c.mode,phase:input.action==='summary'?'review':'conversation',scenario:{role:scenario.role,goal:scenario.goal,tasks:scenario.tasks},turns:history});
  const mutation=input.action==='summary'?db.prepare(`UPDATE coach_conversations SET summary = ? WHERE id = ? AND ${callGuard}`).bind(JSON.stringify(result.feedback),c.id,input.commandId):db.prepare(`UPDATE coach_turns SET feedback = ?,state = 'replied' WHERE id = ? AND conversation_id = ? AND revision = ? AND ${callGuard}`).bind(JSON.stringify(result.feedback),targetTurn!.id,c.id,targetTurn!.revision,input.commandId);
  const results=await db.batch([mutation,callSuccess(db,input.commandId,result.requestId,result.model)]);if(!results[0].meta.changes)throw new CoachError(409,'会话已变化，请重新读取记录。');
  if(input.action==='summary')c.summary=JSON.stringify(result.feedback);
 }
 return reply(await snapshot());
 }catch(e){
  if(activeCall)await activeCall.db.prepare("UPDATE coach_service_calls SET status = 'failed',error_code = ?,finished_at = ? WHERE id = ? AND status = 'running'").bind(e instanceof AIServiceError?e.code:'interrupted',Date.now(),activeCall.id).run().catch(()=>{});
  if(e instanceof RecordingError)return reply({error:e.message,code:'recording_invalid'},400);
  if(e instanceof AIServiceError)return reply({error:e.message,code:e.code,retryable:e.retryable},e.code==='quota'?429:e.code==='invalid_input'||e.code==='unintelligible'?422:503);
  return failure(e);
 }
}
