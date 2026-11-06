import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {aiConfig,aiCapabilities,createAIService,AIServiceError} from '@/lib/coach/ai';
import {assessmentDefinition} from '@/lib/coach/assessment-catalog';
import {ownAssessment,assessmentView,expireAssessmentCalls,validateAssessmentAnswers,gradeAssessment,emptyAssessmentAnswers,type AssessmentRow} from '@/lib/coach/assessment';
import type {AssessmentDefinition} from '@/lib/coach/assessment-types';
import {fingerprint,DAILY_CALL_LIMIT} from '@/lib/coach/conversations';
import {sharedUsage,sharedUsageSQL} from '@/lib/coach/usage';

async function session(db:D1Database,row:AssessmentRow){await expireAssessmentCalls(db,row.id);const running=await db.prepare("SELECT id FROM coach_assessment_calls WHERE attempt_id=? AND status='running' LIMIT 1").bind(row.id).first();return {attempt:await assessmentView(db,row),capabilities:aiCapabilities(env),processing:Boolean(running)}}
export async function GET(request:Request){try{
 const {db,user}=await context(request),url=new URL(request.url),p=await ownProfile(db,user.userId,url.searchParams.get('profileId')??''),id=url.searchParams.get('attemptId');
 if(id)return reply(await session(db,await ownAssessment(db,p.id,id)));
 const rows=await db.prepare('SELECT id,status,created_at,repeated FROM coach_assessment_attempts WHERE profile_id=? ORDER BY created_at DESC,id DESC LIMIT 30').bind(p.id).all<{id:string;status:AssessmentRow['status'];created_at:number;repeated:number}>();
 return reply({attempts:rows.results.map(r=>({id:r.id,status:r.status,createdAt:r.created_at,repeated:Boolean(r.repeated)})),capabilities:aiCapabilities(env)});
}catch(e){return failure(e)}}
const uuid=z.string().uuid(),base={profileId:uuid,attemptId:uuid};
const schema=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('start'),skip:z.boolean().default(false)}).strict(),
 z.object({...base,action:z.literal('audio'),questionId:z.string().max(40),commandId:uuid}).strict(),
 z.object({...base,action:z.literal('played'),callId:uuid}).strict(),
 z.object({...base,action:z.enum(['save','submit']),commandId:uuid,revision:z.number().int().nonnegative(),answers:z.object({choices:z.record(z.number().int()),selfRatings:z.object({speaking:z.number().int().min(0).max(2).nullable(),writing:z.number().int().min(0).max(2).nullable()}).strict()}).strict()}).strict(),
]);
export async function POST(request:Request){let call:{db:D1Database;id:string}|null=null;try{
 const {db,user}=await context(request),input=schema.parse(await readBody(request)),p=await ownProfile(db,user.userId,input.profileId),now=Date.now();
 if(input.action==='start'){
  const old=await db.prepare('SELECT * FROM coach_assessment_attempts WHERE id=?').bind(input.attemptId).first<AssessmentRow>();
  if(old){if(old.profile_id!==p.id||input.skip!==(old.status==='skipped'))throw new CoachError(409,'此开始请求已被使用。');return reply(await session(db,old))}
  const d=assessmentDefinition(p.language);
  await db.prepare("INSERT INTO coach_assessment_attempts (id,profile_id,snapshot,status,answers,repeated,created_at,submitted_at) SELECT ?,?,?,?,?,EXISTS(SELECT 1 FROM coach_assessment_attempts WHERE profile_id=? AND status!='skipped'),?,? WHERE (SELECT count(*) FROM coach_assessment_attempts WHERE profile_id=? AND created_at>=?)<10 ON CONFLICT(id) DO NOTHING").bind(input.attemptId,p.id,JSON.stringify(d),input.skip?'skipped':'active',JSON.stringify(emptyAssessmentAnswers()),p.id,now,input.skip?now:null,p.id,now-86400000).run();
  const row=await db.prepare('SELECT * FROM coach_assessment_attempts WHERE id=?').bind(input.attemptId).first<AssessmentRow>();
  if(!row)throw new CoachError(429,'今天开始的检查较多，请先继续已保存的检查。');
  if(row.profile_id!==p.id||input.skip!==(row.status==='skipped'))throw new CoachError(409,'此开始请求已被使用。');
  return reply(await session(db,row));
 }
 let row=await ownAssessment(db,p.id,input.attemptId);const d:AssessmentDefinition=JSON.parse(row.snapshot);
 if(input.action==='audio'){
  if(row.status==='skipped')throw new CoachError(409,'已跳过的检查不能生成音频。');
  const q=d.questions.find(q=>q.id===input.questionId&&q.skill==='listening');if(!q)throw new CoachError(404,'找不到此听力题。');
  const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'语音服务待配置；可以先完成阅读和自评，听力保持未评估。');
  await expireAssessmentCalls(db,row.id);
  const old=await db.prepare('SELECT id FROM coach_assessment_calls WHERE id=?').bind(input.commandId).first();if(old)throw new CoachError(409,'此生成请求已处理；请读取状态后再决定是否重新生成。');
  const reserved=await db.prepare(`INSERT INTO coach_assessment_calls (id,attempt_id,user_id,question_id,status,created_at) SELECT ?,?,?,?,'running',? WHERE NOT EXISTS(SELECT 1 FROM coach_assessment_calls WHERE attempt_id=? AND status='running') AND (${sharedUsageSQL})<? ON CONFLICT(id) DO NOTHING`).bind(input.commandId,row.id,user.userId,q.id,now,row.id,user.userId,new Date(now).setUTCHours(0,0,0,0),DAILY_CALL_LIMIT).run();
  if(!reserved.meta.changes){if(await sharedUsage(db,user.userId)>=DAILY_CALL_LIMIT)throw new CoachError(429,'今天的语音与 AI 共用额度已用完，可继续阅读和自评。');throw new CoachError(409,'音频仍在生成，请稍后读取状态。')}
  call={db,id:input.commandId};const audio=await createAIService(config).speak(q.text,d.language);
  const saved=await db.prepare("UPDATE coach_assessment_calls SET status='succeeded',request_id=?,model=?,voice=?,finished_at=? WHERE id=? AND status='running'").bind(audio.requestId,audio.model,config.voices[d.language],Date.now(),input.commandId).run();
  if(!saved.meta.changes)throw new CoachError(409,'此次生成已经中断，请读取最新状态。');
  return new Response(audio.audio.slice().buffer as ArrayBuffer,{headers:{'Content-Type':audio.mimeType,'Cache-Control':'private, no-store','Vary':'Cookie','X-Coach-Playback-Id':input.commandId,'X-Coach-Voice':'AI-generated'}});
 }
 if(input.action==='played'){
  const c=await db.prepare("SELECT id FROM coach_assessment_calls WHERE id=? AND attempt_id=? AND user_id=? AND status='succeeded'").bind(input.callId,row.id,user.userId).first();if(!c)throw new CoachError(400,'播放记录不属于本次已生成音频。');
  await db.prepare('UPDATE coach_assessment_calls SET played_at=COALESCE(played_at,?) WHERE id=?').bind(now,input.callId).run();return reply(await session(db,row));
 }
 const answers=validateAssessmentAnswers(d,input.answers),hash=await fingerprint({action:input.action,revision:input.revision,answers});
 const old=await db.prepare('SELECT attempt_id,fingerprint FROM coach_assessment_commands WHERE id=?').bind(input.commandId).first<{attempt_id:string;fingerprint:string}>();
 if(old){if(old.attempt_id!==row.id||old.fingerprint!==hash)throw new CoachError(409,'同一保存请求不能更换答案。');return reply(await session(db,row))}
 if(row.status!=='active')throw new CoachError(409,'此检查已结束，不能改写。');
 if(row.revision!==input.revision)throw new CoachError(409,'答案已在另一页面更新，请读取已保存版本。');
 const submitted=input.action==='submit';
 const view=await assessmentView(db,row);
 for(const q of d.questions)if(q.skill==='listening'&&answers.choices[q.id]!==undefined&&!view.playedQuestionIds.includes(q.id))throw new CoachError(409,'请先播放完对应听力音频，或将该题留空。');
 if(submitted&&!Object.keys(answers.choices).length&&answers.selfRatings.speaking===null&&answers.selfRatings.writing===null)throw new CoachError(400,'请至少完成一项，也可以返回后选择跳过检查。');
 const result=submitted?gradeAssessment(d,answers,Boolean(row.repeated)):null;
 await db.batch([
  db.prepare("INSERT INTO coach_assessment_commands (id,attempt_id,fingerprint,previous_revision,created_at) SELECT ?,id,?,?,? FROM coach_assessment_attempts WHERE id=? AND profile_id=? AND status='active' AND revision=? ON CONFLICT(id) DO NOTHING").bind(input.commandId,hash,input.revision,now,row.id,p.id,input.revision),
  db.prepare("UPDATE coach_assessment_attempts SET answers=?,status=?,result=?,submitted_at=?,revision=revision+1 WHERE id=? AND profile_id=? AND status='active' AND revision=? AND EXISTS(SELECT 1 FROM coach_assessment_commands WHERE id=? AND attempt_id=? AND fingerprint=? AND previous_revision=?)").bind(JSON.stringify(answers),submitted?'submitted':'active',result?JSON.stringify(result):null,submitted?now:null,row.id,p.id,input.revision,input.commandId,row.id,hash,input.revision),
 ]);
 const accepted=await db.prepare('SELECT attempt_id,fingerprint FROM coach_assessment_commands WHERE id=?').bind(input.commandId).first<{attempt_id:string;fingerprint:string}>();if(!accepted||accepted.attempt_id!==row.id||accepted.fingerprint!==hash)throw new CoachError(409,'答案未保存，请读取最新记录。');
 row=await ownAssessment(db,p.id,row.id);return reply(await session(db,row));
}catch(e){
 if(call)await call.db.prepare("UPDATE coach_assessment_calls SET status='failed',error_code=?,finished_at=? WHERE id=? AND status='running'").bind(e instanceof AIServiceError?e.code:'interrupted',Date.now(),call.id).run().catch(()=>{});
 if(e instanceof AIServiceError)return reply({error:e.message,code:e.code,retryable:e.retryable},e.code==='quota'?429:503);
 return failure(e);
}}
