import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {ownExam,expireExam,type ExamRow} from '@/lib/coach/exams';
import {examAudioState} from '@/lib/coach/exam-audio';
import type {ExamPaper} from '@/lib/coach/exam-types';
import {aiConfig,createAIService,AIServiceError} from '@/lib/coach/ai';
import {sharedUsage,sharedUsageSQL} from '@/lib/coach/usage';
import {DAILY_CALL_LIMIT} from '@/lib/coach/conversations';
const base={profileId:z.string().uuid(),attemptId:z.string().uuid()};
const schema=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('audio'),audioKey:z.string().max(120),commandId:z.string().uuid()}).strict(),
 z.object({...base,action:z.literal('played'),callId:z.string().uuid()}).strict(),
]);
const clock="CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)";
export async function POST(request:Request){let active:{db:D1Database;id:string}|null=null;try{
 const {db,user}=await context(request),input=schema.parse(await readBody(request)),p=await ownProfile(db,user.userId,input.profileId),now=Date.now();
 const row=await expireExam(db,await ownExam(db,p.id,input.attemptId),now),paper:ExamPaper=JSON.parse(row.snapshot);
 if(row.status!=='active')throw new CoachError(409,'训练已提交或到时，考试音频不再开放。可在结果中查看原文，或进入精听重新练习。');
 if(input.action==='played'){
  const call=await db.prepare("SELECT id FROM coach_exam_audio_calls WHERE id=? AND attempt_id=? AND user_id=? AND status='succeeded'").bind(input.callId,row.id,user.userId).first();if(!call)throw new CoachError(400,'此播放记录不属于当前训练的已生成音频。');
  await db.prepare(`UPDATE coach_exam_audio_calls SET played_at=COALESCE(played_at,?) WHERE id=? AND EXISTS (SELECT 1 FROM coach_exam_attempts WHERE id=? AND profile_id=? AND status='active' AND deadline_at>${clock})`).bind(now,input.callId,row.id,p.id).run();
  const current=await db.prepare('SELECT played_at FROM coach_exam_audio_calls WHERE id=?').bind(input.callId).first<{played_at:number|null}>();if(!current?.played_at)throw new CoachError(409,'播放结束时训练已到时，不能补记听力证据。');
  return reply({audioState:await examAudioState(db,row)});
 }
 const audio=paper.items.find(i=>i.skill==='listening'&&i.audio?.key===input.audioKey)?.audio;
 if(!audio||!paper.audioPolicy)throw new CoachError(404,'此训练没有对应的听力材料。');
 const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'听力语音服务待配置。请稍后再开始听力专项；已保存答案会保留。');
 await examAudioState(db,row);
 const old=await db.prepare('SELECT id FROM coach_exam_audio_calls WHERE id=?').bind(input.commandId).first();if(old)throw new CoachError(409,'此音频请求已处理或正在处理；不会重复生成。请读取已保存的播放状态。');
 const reserved=await db.prepare(`INSERT INTO coach_exam_audio_calls(id,attempt_id,user_id,audio_key,status,created_at) SELECT ?,id,?,?,'running',? FROM coach_exam_attempts WHERE id=? AND profile_id=? AND status='active' AND deadline_at>${clock} AND NOT EXISTS (SELECT 1 FROM coach_exam_audio_calls WHERE attempt_id=? AND status='running') AND (SELECT count(*) FROM coach_exam_audio_calls WHERE attempt_id=? AND audio_key=? AND status IN ('running','succeeded'))<? AND (${sharedUsageSQL})<? ON CONFLICT(id) DO NOTHING`).bind(input.commandId,user.userId,input.audioKey,now,row.id,p.id,row.id,row.id,input.audioKey,paper.audioPolicy.maxRequests,user.userId,new Date(now).setUTCHours(0,0,0,0),DAILY_CALL_LIMIT).run();
 if(!reserved.meta.changes){if(await sharedUsage(db,user.userId)>=DAILY_CALL_LIMIT)throw new CoachError(429,'今天的语音与 AI 共用额度已用完。');throw new CoachError(409,'当前正在生成、次数已用完或训练已到时，请读取最新状态。')}
 active={db,id:input.commandId};const result=await createAIService(config).speak(audio.text,paper.language);
 const committed=await db.prepare(`UPDATE coach_exam_audio_calls SET status='succeeded',request_id=?,model=?,voice=?,finished_at=? WHERE id=? AND status='running' AND EXISTS (SELECT 1 FROM coach_exam_attempts WHERE id=? AND profile_id=? AND status='active' AND deadline_at>${clock})`).bind(result.requestId,result.model,config.voices[paper.language],Date.now(),input.commandId,row.id,p.id).run();
 if(!committed.meta.changes)throw new CoachError(409,'生成期间训练已到时或已提交，不能继续播放。');
 return new Response(result.audio.slice().buffer as ArrayBuffer,{headers:{'Content-Type':result.mimeType,'Cache-Control':'private, no-store','Vary':'Cookie','X-Coach-Voice':'AI-generated','X-Coach-Playback-Id':input.commandId}});
}catch(e){if(active)await active.db.prepare("UPDATE coach_exam_audio_calls SET status='failed',error_code=?,finished_at=? WHERE id=? AND status='running'").bind(e instanceof AIServiceError?e.code:'interrupted',Date.now(),active.id).run().catch(()=>{});if(e instanceof AIServiceError)return reply({error:e.message,code:e.code,retryable:e.retryable},e.code==='quota'?429:503);return failure(e)}}
