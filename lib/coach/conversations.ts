import {sharedUsageSQL} from './usage';
import {CoachError} from './server';
import type {DialogueFeedback} from './ai';
import type {CoachLanguage,CoachLevel} from './types';
export type Conversation={id:string;profile_id:string;scenario_id:string|null;scenario_version:number;practice_type:'scenario'|'free'|'lesson';practice_topic:string|null;practice_snapshot:string|null;language:CoachLanguage;level:CoachLevel;mode:'guided'|'challenge'|'exam';status:'active'|'finished';summary:string|null;consent_version:string;created_at:number;ended_at:number|null};
export type Turn={id:string;conversation_id:string;sequence:number;input_kind:'audio'|'text';original_transcript:string;accepted_text:string|null;revision:number;state:'draft'|'ready'|'replied';recording_ms:number;feedback:string|null;created_at:number};
export type TurnView=Omit<Turn,'feedback'>&{feedback:DialogueFeedback|null};
export type ConversationView=Omit<Conversation,'summary'>&{summary:DialogueFeedback|null};
export const CONSENT_VERSION='coach-ai-processing-v1';
export const DAILY_CALL_LIMIT=60;
export async function ownConversation(db:D1Database,profileId:string,id:string){
 const c=await db.prepare('SELECT * FROM coach_conversations WHERE id = ? AND profile_id = ?').bind(id,profileId).first<Conversation>();
 if(!c)throw new CoachError(404,'找不到此语言的会话。');return c;
}
export async function conversationView(db:D1Database,c:Conversation){
 await expireCalls(db,c.id);
 const turns=await db.prepare('SELECT * FROM coach_turns WHERE conversation_id = ? ORDER BY sequence').bind(c.id).all<Turn>();
 const processing=await db.prepare("SELECT operation,created_at FROM coach_service_calls WHERE conversation_id = ? AND status = 'running'").bind(c.id).all<{operation:string;created_at:number}>();
 return {conversation:{...c,summary:c.summary?JSON.parse(c.summary):null} as ConversationView,turns:turns.results.map(t=>({...t,feedback:t.feedback?JSON.parse(t.feedback):null})) as TurnView[],processing:processing.results};
}
export async function fingerprint(value:unknown){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
export const idleClause="NOT EXISTS (SELECT 1 FROM coach_service_calls WHERE conversation_id = coach_conversations.id AND status = 'running')";
export async function expireCalls(db:D1Database,conversationId:string){
 await db.prepare("UPDATE coach_service_calls SET status = 'failed', error_code = 'interrupted', finished_at = ? WHERE conversation_id = ? AND status = 'running' AND created_at < ?").bind(Date.now(),conversationId,Date.now()-90000).run();
}
export async function reserveCall(db:D1Database,userId:string,c:Conversation,id:string,operation:string,hash:string,precondition='1=1',params:(string|number)[]=[]){
 await expireCalls(db,c.id);
 const existing=await db.prepare('SELECT * FROM coach_service_calls WHERE id = ?').bind(id).first<{user_id:string;conversation_id:string;operation:string;fingerprint:string;status:string}>();
 if(existing){
  if(existing.user_id!==userId||existing.conversation_id!==c.id||existing.operation!==operation||existing.fingerprint!==hash)throw new CoachError(409,'同一请求不能用于不同内容。');
  if(existing.status==='succeeded')return false;
  throw new CoachError(409,existing.status==='running'?'这次请求仍在处理中，请稍后重新读取。':'上次请求未完成，请保留输入并重新提交。');
 }
 const now=Date.now(),day=new Date(now).setUTCHours(0,0,0,0);
 const inserted=await db.prepare(`INSERT INTO coach_service_calls (id,user_id,conversation_id,operation,fingerprint,status,created_at) SELECT ?,?,id,?,?,'running',? FROM coach_conversations WHERE id = ? AND ${idleClause} AND (${precondition}) AND (${sharedUsageSQL}) < ? ON CONFLICT(id) DO NOTHING`).bind(id,userId,operation,hash,now,c.id,...params,userId,day,DAILY_CALL_LIMIT).run();
 if(!inserted.meta.changes){
  const used=await db.prepare(sharedUsageSQL).bind(userId,day).first<{n:number}>();
  if(used!.n>=DAILY_CALL_LIMIT)throw new CoachError(429,'今天的 AI 练习用量已达上限，请明天再来；已保存记录仍可查看。');
  throw new CoachError(409,'会话已更新或仍有请求在处理，请重新读取后再试。');
 }
 return true;
}
export const callGuard="EXISTS (SELECT 1 FROM coach_service_calls WHERE id = ? AND status = 'running')";
export const callSuccess=(db:D1Database,id:string,requestId:string|null,model:string)=>db.prepare("UPDATE coach_service_calls SET status = 'succeeded', request_id = ?, model = ?, finished_at = ? WHERE id = ? AND status = 'running'").bind(requestId,model,Date.now(),id);
