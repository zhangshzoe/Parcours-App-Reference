import {audioReceipt} from '@/lib/coach/audio-receipt';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {ownExam,expireExam} from '@/lib/coach/exams';
import {examResponses,EXAM_FEEDBACK_RULE_VERSION} from '@/lib/coach/exam-responses';
import {frenchTransferPrompt} from '@/lib/coach/review-transfer';
import type {ExamPaper} from '@/lib/coach/exam-types';
import {aiConfig,createAIService,AIServiceError} from '@/lib/coach/ai';
import {inspectWav,RecordingError} from '@/lib/coach/wav';
import {fingerprint,CONSENT_VERSION,DAILY_CALL_LIMIT} from '@/lib/coach/conversations';
import {sharedUsage,sharedUsageSQL} from '@/lib/coach/usage';
const uuid=z.string().uuid(),base={profileId:uuid,attemptId:uuid,itemId:z.string().max(150)};
const schema=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('audio'),recordingId:uuid,commandId:uuid,audio:z.string().min(60).max(2560100),consentVersion:z.literal(CONSENT_VERSION)}).strict(),
 z.object({...base,action:z.literal('confirm'),recordingId:uuid,text:z.string().trim().min(1).max(6000)}).strict(),
 z.object({...base,action:z.literal('feedback'),commandId:uuid,consentVersion:z.literal(CONSENT_VERSION)}).strict(),
 z.object({...base,action:z.literal('retry-text'),retryId:uuid,text:z.string().trim().min(1).max(6000)}).strict(),
 z.object({...base,action:z.literal('retry-audio'),retryId:uuid,commandId:uuid,audio:z.string().min(60).max(2560100),consentVersion:z.literal(CONSENT_VERSION)}).strict(),
 z.object({...base,action:z.literal('retry-confirm'),retryId:uuid,text:z.string().trim().min(1).max(6000)}).strict(),
 z.object({...base,action:z.literal('retry-feedback'),retryId:uuid,commandId:uuid,consentVersion:z.literal(CONSENT_VERSION)}).strict(),
 z.object({...base,action:z.literal('bookmark'),pointIndex:z.number().int().min(0).max(2)}).strict()
]);
const clock="CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)";
export async function GET(request:Request){try{const {db,user}=await context(request),url=new URL(request.url),p=await ownProfile(db,user.userId,uuid.parse(url.searchParams.get('profileId'))),row=await expireExam(db,await ownExam(db,p.id,uuid.parse(url.searchParams.get('attemptId'))),Date.now());const view=await examResponses(db,row),command=url.searchParams.get('audioCommandId'),retryCommand=url.searchParams.get('retryCommandId');const receipt=retryCommand?await db.prepare("SELECT status FROM coach_exam_response_calls WHERE id=? AND attempt_id=? AND operation IN ('retry-audio','retry-feedback')").bind(uuid.parse(retryCommand),row.id).first<{status:string}>():null;return reply({...view,...(command?{audioReceipt:await audioReceipt(db,'exam',row.id,user.userId,uuid.parse(command))}:{}),...(retryCommand?{retryReceipt:{commandId:retryCommand,status:receipt?.status??'not-found'}}:{})})}catch(e){return failure(e)}}
export async function POST(request:Request){let active:{db:D1Database;id:string}|null=null;try{
 const {db,user}=await context(request),input=schema.parse(await readBody(request,2700000)),p=await ownProfile(db,user.userId,input.profileId),now=Date.now();
 const row=await expireExam(db,await ownExam(db,p.id,input.attemptId),now),paper:ExamPaper=JSON.parse(row.snapshot),item=paper.items.find(i=>i.id===input.itemId);
 if(!item||!['writing','speaking'].includes(item.skill))throw new CoachError(404,'找不到这项表达任务。');
 const taskGoal=[item.prompt,...(item.passage?[`Task material: ${item.passage}`]:[]),...(item.oral?[`Target-language prompt: ${item.oral.targetPrompt}`]:[])].join('\n');
 const assessmentTasks=[...(item.oral?.tasks??[]).map(task=>`Required action: ${task}`),...(item.rubric??[]).map(criterion=>`Assessment criterion: ${criterion}`)];
 const snapshot=()=>examResponses(db,row),view=await snapshot();
 if(input.action==='bookmark'){
  if(row.status==='active')throw new CoachError(409,'提交训练后才能查看反馈。');
  const point=view.feedback.find(f=>f.itemId===item.id)?.body.points[input.pointIndex];
  if(!point?.suggestion||!['error','natural','task'].includes(point.kind))throw new CoachError(400,'此反馈没有可收藏的明确建议。');
  const savedAnswer=JSON.parse(row.answers)[item.id];
  const userAnswer=item.skill==='speaking'?view.recordings.find(r=>r.id===savedAnswer&&r.item_id===item.id)?.accepted_text:typeof savedAnswer==='string'?savedAnswer:null;
  await db.prepare('INSERT INTO coach_review_items(id,profile_id,source_key,kind,payload,stage,due_at,revision,created_at) VALUES(?,?,?,?,?,0,?,0,?) ON CONFLICT(profile_id,source_key) DO NOTHING').bind(crypto.randomUUID(),p.id,`exam-feedback:${row.id}:${item.id}:${input.pointIndex}`,point.kind==='task'?'knowledge':'expression',JSON.stringify({target:point.suggestion,zh:point.explanation,lessonTitle:paper.title+' · AI 参考反馈',language:paper.language,skill:item.skill,knowledge:item.knowledge,taskVersion:item.version,sourceAttemptId:row.id,sourceItemId:item.id,userAnswer:userAnswer??null,reviewFocus:point.kind==='task'?'task':undefined,transferPrompt:point.kind==='task'&&paper.language==='fr-FR'?frenchTransferPrompt(item.id):undefined}),now,now).run();return reply({ok:true});
 }
 if(input.action==='confirm'){
  if(item.skill!=='speaking')throw new CoachError(400,'这不是口语任务。');
  const recording=view.recordings.find(r=>r.id===input.recordingId&&r.item_id===item.id);if(!recording)throw new CoachError(404,'找不到本题录音转写。');
  if(recording.confirmed_at){if(recording.accepted_text!==input.text)throw new CoachError(409,'此转写已确认。需要修改时请重新录音，不能改写已确认版本。');return reply(await snapshot())}
  const saved=await db.prepare(`UPDATE coach_exam_recordings SET accepted_text=?,confirmed_at=? WHERE id=? AND attempt_id=? AND confirmed_at IS NULL AND EXISTS(SELECT 1 FROM coach_exam_attempts WHERE id=? AND status='active' AND deadline_at>${clock})`).bind(input.text,now,recording.id,row.id,row.id).run();
  if(!saved.meta.changes)throw new CoachError(409,'训练已封存或转写已确认，请重新读取。');return reply(await snapshot());
 }
 if(input.action.startsWith('retry-')){
  if(row.status==='active')throw new CoachError(409,'提交训练后才能重试表达任务。');
  if(!view.feedback.some(f=>f.itemId===item.id))throw new CoachError(409,'请先获取原回答的参考反馈，再保存重试。');
  if(input.action==='retry-text'){
   if(item.skill!=='writing')throw new CoachError(400,'写作重试只能用于写作任务。');
   const existing=view.retries.find(r=>r.id===input.retryId);
   if(existing){if(existing.item_id!==item.id||existing.skill!=='writing'||existing.accepted_text!==input.text)throw new CoachError(409,'同一重试编号不能改变内容。');return reply(view)}
   const result=await db.prepare("INSERT INTO coach_exam_retries(id,attempt_id,item_id,skill,accepted_text,created_at,confirmed_at) SELECT ?,id,?,'writing',?,?,? FROM coach_exam_attempts WHERE id=? AND status!='active' AND (SELECT count(*) FROM coach_exam_retries WHERE attempt_id=coach_exam_attempts.id AND item_id=?)<3 ON CONFLICT(id) DO NOTHING").bind(input.retryId,item.id,input.text,now,now,row.id,item.id).run();
   if(!result.meta.changes)throw new CoachError(409,'已保存三次重试或记录发生变化，请读取状态。');return reply(await snapshot());
  }
  if(input.action==='retry-confirm'){
   if(item.skill!=='speaking')throw new CoachError(400,'口语转写确认只能用于口语任务。');
   const retry=view.retries.find(r=>r.id===input.retryId&&r.item_id===item.id&&r.skill==='speaking');if(!retry)throw new CoachError(404,'找不到这次口语重试。');
   if(retry.confirmed_at){if(retry.accepted_text!==input.text)throw new CoachError(409,'这次转写已确认，不能改写。');return reply(view)}
   const updated=await db.prepare("UPDATE coach_exam_retries SET accepted_text=?,confirmed_at=? WHERE id=? AND attempt_id=? AND item_id=? AND skill='speaking' AND confirmed_at IS NULL AND body IS NULL").bind(input.text,now,retry.id,row.id,item.id).run();
   if(!updated.meta.changes)throw new CoachError(409,'确认状态已变化，请重新读取。');return reply(await snapshot());
  }
 }
 if(input.action==='retry-text'||input.action==='retry-confirm')throw new CoachError(400,'重试操作无效。');
 let bytes:Uint8Array|undefined,duration=0,acceptedText='',recordingId:string|null=null;
 if(input.action==='audio'||input.action==='retry-audio'){
  if(item.skill!=='speaking')throw new CoachError(400,'这不是口语任务。');
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio)||input.audio.length%4)throw new CoachError(400,'录音格式无效。');
  bytes=Uint8Array.from(atob(input.audio),c=>c.charCodeAt(0));duration=inspectWav(bytes).durationMs;
 }else if(input.action==='feedback'){
  if(row.status==='active')throw new CoachError(409,'训练提交或到时后才提供参考反馈，答题期间不纠错。');
  if(view.feedback.some(f=>f.itemId===item.id))return reply(view);
  const answer=JSON.parse(row.answers)[item.id];
  if(item.skill==='speaking'){const recording=view.recordings.find(r=>r.id===answer&&r.item_id===item.id&&r.confirmed_at);if(!recording)throw new CoachError(400,'本题没有已选定并保存的录音答案。');acceptedText=recording.accepted_text!;recordingId=recording.id}
  else{if(typeof answer!=='string'||!answer.trim())throw new CoachError(400,'本题没有已保存的文字答案。');acceptedText=answer}
 }else{
  const retry=view.retries.find(r=>r.id===input.retryId&&r.item_id===item.id&&r.skill===item.skill);
  if(!retry||!retry.confirmed_at||!retry.accepted_text)throw new CoachError(400,'请先保存并确认本次重试。');
  if(retry.body)return reply(view);
  acceptedText=retry.accepted_text;
 }
 const hash=await fingerprint(input),old=await db.prepare('SELECT * FROM coach_exam_response_calls WHERE id=?').bind(input.commandId).first<{attempt_id:string;fingerprint:string;status:string}>();
 if(old){if(old.attempt_id!==row.id||old.fingerprint!==hash)throw new CoachError(409,'同一请求不能改变内容。');if(old.status==='succeeded')return reply(await snapshot());throw new CoachError(409,old.status==='running'?'请求仍在处理中，请重新读取状态。':'上次请求已中断，请读取状态后重新提交。')}
 const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'语音与反馈服务待配置，已保存的答案仍可查看。');
 const condition=input.action==='audio'?`status='active' AND deadline_at>${clock} AND (SELECT count(*) FROM coach_exam_recordings WHERE attempt_id=coach_exam_attempts.id)<12 AND NOT EXISTS(SELECT 1 FROM coach_exam_recordings WHERE id=?)`:input.action==='retry-audio'?"status!='active' AND (SELECT count(*) FROM coach_exam_retries WHERE attempt_id=coach_exam_attempts.id AND item_id=?)<3 AND NOT EXISTS(SELECT 1 FROM coach_exam_retries WHERE id=?)":input.action==='feedback'?"status!='active' AND NOT EXISTS(SELECT 1 FROM coach_exam_feedback WHERE attempt_id=coach_exam_attempts.id AND item_id=?)":"status!='active' AND EXISTS(SELECT 1 FROM coach_exam_retries WHERE id=? AND attempt_id=coach_exam_attempts.id AND item_id=? AND confirmed_at IS NOT NULL AND body IS NULL)";
 const conditionArgs=input.action==='audio'?[input.recordingId]:input.action==='retry-audio'?[item.id,input.retryId]:input.action==='feedback'?[item.id]:[input.retryId,item.id];
 const reserved=await db.prepare(`INSERT INTO coach_exam_response_calls(id,attempt_id,user_id,item_id,operation,fingerprint,status,consent_version,created_at) SELECT ?,id,?,?,?,?,'running',?,? FROM coach_exam_attempts WHERE id=? AND (${condition}) AND NOT EXISTS(SELECT 1 FROM coach_exam_response_calls WHERE attempt_id=? AND status='running') AND (${sharedUsageSQL})<? ON CONFLICT(id) DO NOTHING`).bind(input.commandId,user.userId,item.id,input.action,hash,CONSENT_VERSION,now,row.id,...conditionArgs,row.id,user.userId,new Date(now).setUTCHours(0,0,0,0),DAILY_CALL_LIMIT).run();
 if(!reserved.meta.changes){if(await sharedUsage(db,user.userId)>=DAILY_CALL_LIMIT)throw new CoachError(429,'今日 AI 共用额度已用完。');throw new CoachError(409,'记录已变化、请求仍在处理、录音次数已达上限或考试已到时，请读取最新状态。')}
 active={db,id:input.commandId};const service=createAIService(config);
 if(input.action==='audio'||input.action==='retry-audio'){
  const result=await service.transcribe(new Blob([bytes!.slice().buffer as ArrayBuffer],{type:'audio/wav'}),paper.language);
  if(input.action==='retry-audio'){
   const changes=await db.batch([
    db.prepare("INSERT INTO coach_exam_retries(id,attempt_id,item_id,skill,original_transcript,recording_ms,consent_version,created_at) SELECT ?,id,?,'speaking',?,?,?,? FROM coach_exam_attempts WHERE id=? AND status!='active' AND (SELECT count(*) FROM coach_exam_retries WHERE attempt_id=coach_exam_attempts.id AND item_id=?)<3 AND EXISTS(SELECT 1 FROM coach_exam_response_calls WHERE id=? AND status='running')").bind(input.retryId,item.id,result.text,duration,CONSENT_VERSION,Date.now(),row.id,item.id,input.commandId),
    db.prepare("UPDATE coach_exam_response_calls SET status='succeeded',request_id=?,model=?,finished_at=? WHERE id=? AND status='running' AND EXISTS(SELECT 1 FROM coach_exam_retries WHERE id=? AND attempt_id=?)").bind(result.requestId,result.model,Date.now(),input.commandId,input.retryId,row.id)
   ]);if(!changes[0].meta.changes)throw new CoachError(409,'口语重试记录未保存，请读取状态。');
   return reply(await snapshot());
  }
  const changes=await db.batch([
   db.prepare(`INSERT INTO coach_exam_recordings(id,attempt_id,item_id,original_transcript,recording_ms,consent_version,created_at) SELECT ?,id,?,?,?,?,? FROM coach_exam_attempts WHERE id=? AND status='active' AND deadline_at>${clock} AND EXISTS(SELECT 1 FROM coach_exam_response_calls WHERE id=? AND status='running')`).bind(input.recordingId,item.id,result.text,duration,CONSENT_VERSION,Date.now(),row.id,input.commandId),
   db.prepare("UPDATE coach_exam_response_calls SET status='succeeded',request_id=?,model=?,finished_at=? WHERE id=? AND status='running' AND EXISTS(SELECT 1 FROM coach_exam_recordings WHERE id=? AND attempt_id=?)").bind(result.requestId,result.model,Date.now(),input.commandId,input.recordingId,row.id)
  ]);if(!changes[0].meta.changes)throw new CoachError(409,'转写期间考试已封存，未计入本次答案。');
 }else if(input.action==='feedback'){
  const result=await service.dialogue({phase:'review',language:paper.language,level:paper.level,mode:'exam',scenario:{role:'Post-task examiner giving a text-only reference review, no official grades.',goal:taskGoal,tasks:assessmentTasks},turns:[{role:'user',text:acceptedText}]});
  const changes=await db.batch([
   db.prepare("INSERT INTO coach_exam_feedback(id,attempt_id,item_id,recording_id,body,model,created_at) SELECT ?,?,?,?, ?,?,? WHERE EXISTS(SELECT 1 FROM coach_exam_response_calls WHERE id=? AND status='running') ON CONFLICT(attempt_id,item_id) DO NOTHING").bind(crypto.randomUUID(),row.id,item.id,recordingId,JSON.stringify({...result.feedback,ruleVersion:EXAM_FEEDBACK_RULE_VERSION}),result.model,Date.now(),input.commandId),
   db.prepare("UPDATE coach_exam_response_calls SET status='succeeded',request_id=?,model=?,finished_at=? WHERE id=? AND status='running' AND EXISTS(SELECT 1 FROM coach_exam_feedback WHERE attempt_id=? AND item_id=?)").bind(result.requestId,result.model,Date.now(),input.commandId,row.id,item.id)
  ]);if(!changes[0].meta.changes)throw new CoachError(409,'此反馈请求已中断，请读取已保存的结果。');
 }else{
  const original=JSON.parse(row.answers)[item.id];
  const originalText=item.skill==='speaking'?view.recordings.find(r=>r.id===original&&r.item_id===item.id)?.accepted_text:typeof original==='string'?original:null;
  const result=await service.dialogue({phase:'review',language:paper.language,level:paper.level,mode:'exam',scenario:{role:'Post-task examiner giving text-only retry feedback, no official grades. Compare the revision with the earlier answer but assess the latest answer and quote only from it.',goal:taskGoal+(originalText?'\nEarlier answer for comparison: '+originalText:''),tasks:assessmentTasks},turns:[{role:'user',text:acceptedText}]});
  const changes=await db.batch([
   db.prepare("UPDATE coach_exam_retries SET body=?,model=?,feedback_at=? WHERE id=? AND attempt_id=? AND item_id=? AND confirmed_at IS NOT NULL AND accepted_text=? AND body IS NULL AND EXISTS(SELECT 1 FROM coach_exam_response_calls WHERE id=? AND status='running')").bind(JSON.stringify({...result.feedback,ruleVersion:EXAM_FEEDBACK_RULE_VERSION}),result.model,Date.now(),input.retryId,row.id,item.id,acceptedText,input.commandId),
   db.prepare("UPDATE coach_exam_response_calls SET status='succeeded',request_id=?,model=?,finished_at=? WHERE id=? AND status='running' AND EXISTS(SELECT 1 FROM coach_exam_retries WHERE id=? AND attempt_id=? AND body IS NOT NULL)").bind(result.requestId,result.model,Date.now(),input.commandId,input.retryId,row.id)
  ]);if(!changes[0].meta.changes)throw new CoachError(409,'重试反馈未保存，请读取状态。');
 }
 return reply(await snapshot());
}catch(e){if(active)await active.db.prepare("UPDATE coach_exam_response_calls SET status='failed',error_code=?,finished_at=? WHERE id=? AND status='running'").bind(e instanceof AIServiceError?e.code:'interrupted',Date.now(),active.id).run().catch(()=>{});if(e instanceof RecordingError)return reply({error:e.message,code:'recording_invalid'},400);if(e instanceof AIServiceError)return reply({error:e.message,code:e.code,retryable:e.retryable},e.code==='quota'?429:e.code==='unintelligible'?422:503);return failure(e)}}
