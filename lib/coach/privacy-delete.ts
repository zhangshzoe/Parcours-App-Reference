import {CoachError} from './server';
import {exportDefinitions,tableFilter,type ExportScope} from './privacy-export';
import {guardStatement,isRevisionFailure,DataRevisionError} from '@/lib/data-guard';

export const deletionPhrase=(scope:ExportScope)=>scope==='all'?'删除全部学习数据':scope==='fr-FR'?'删除法语学习数据':scope==='de-DE'?'删除德语学习数据':'删除英语听说数据';
const deletionOrder=[
 'english_review_events','english_reviews','english_calls','english_turns','english_sessions','english_profiles',
 'coach_exam_retries','coach_exam_feedback','coach_exam_response_calls','coach_exam_recordings','coach_exam_audio_calls','coach_exam_commands',
 'coach_exam_attempts','coach_attempts','coach_transcript_revisions','coach_turns','coach_service_calls','coach_conversations',
 'coach_listening_calls','coach_listening_commands','coach_listening_attempts','coach_assessment_calls','coach_assessment_commands','coach_assessment_attempts',
 'coach_vocabulary_calls','coach_review_events','coach_review_items','coach_plans','coach_goals','coach_profiles',
 'content_reports','study_activity','writing_drafts','reviews','assessments','lesson_progress','profiles',
];
function selected(scope:ExportScope){return exportDefinitions.filter(d=>d.group!=='privacy'&&(scope==='all'||d.group===(scope==='en-US'?'english':'coach')))}
export async function prepareDeletion(db:D1Database,userId:string,revision:number,scope:ExportScope){
 const definitions=selected(scope),token=crypto.randomUUID(),expiresAt=Date.now()+300000;
 const results=await db.batch([
  db.prepare('INSERT INTO app_data_controls(user_id,revision) VALUES(?,0) ON CONFLICT(user_id) DO NOTHING').bind(userId),
  db.prepare('INSERT INTO app_privacy_confirmations(user_id,token,scope,revision,expires_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET token=excluded.token,scope=excluded.scope,revision=excluded.revision,expires_at=excluded.expires_at').bind(userId,token,scope,revision,expiresAt),
  ...definitions.map(d=>{const filter=tableFilter(d,userId,scope);return db.prepare(`SELECT count(*) AS n FROM ${d.name} WHERE ${filter.where}`).bind(...filter.values)}),
 ]);
 const sections=definitions.map((d,i)=>({label:d.label,count:Number((results[i+2].results[0] as {n:number}).n)}));
 return {token,scope,revision,expiresAt,phrase:deletionPhrase(scope),totalRecords:sections.reduce((n,s)=>n+s.count,0),sections};
}
type DeletionInput={token:string;scope:ExportScope;revision:number;phrase:string};
type Control={revision:number;last_delete_id:string|null;last_scope:string|null;deleted_at:number|null};
export async function deleteLearningData(raw:D1Database,userId:string,input:DeletionInput){
 if(input.phrase!==deletionPhrase(input.scope))throw new CoachError(400,'确认文字与所选范围不一致。');
 const current=await raw.prepare('SELECT revision,last_delete_id,last_scope,deleted_at FROM app_data_controls WHERE user_id=?').bind(userId).first<Control>();
 if(current?.last_delete_id===input.token&&current.last_scope===input.scope&&current.revision===input.revision+1)return {deleted:true,scope:input.scope,completedAt:current.deleted_at,replayed:true};
 if((current?.revision??0)!==input.revision)throw new DataRevisionError();
 const confirmation=await raw.prepare('SELECT token,scope,revision,expires_at FROM app_privacy_confirmations WHERE user_id=?').bind(userId).first<{token:string;scope:string;revision:number;expires_at:number}>();
 if(!confirmation||confirmation.token!==input.token||confirmation.scope!==input.scope||confirmation.revision!==input.revision||confirmation.expires_at<=Date.now())throw new CoachError(409,'删除确认已失效，请重新选择范围并确认。');
 const definitions=new Map(selected(input.scope).map(d=>[d.name,d]));
 if([...definitions.keys()].some(name=>!deletionOrder.includes(name)))throw new Error('Unreviewed deletion coverage');
 const guardId=crypto.randomUUID(),tokenGuard=crypto.randomUUID(),now=Date.now();
 const statements=[
  guardStatement(raw,userId,input.revision,guardId),
  // Validate the token again inside the deletion transaction, including expiry at execution time.
  raw.prepare("INSERT INTO app_data_guards(id,expected_revision,actual_revision) VALUES(?,1,EXISTS(SELECT 1 FROM app_privacy_confirmations WHERE user_id=? AND token=? AND scope=? AND revision=? AND expires_at>CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)))").bind(tokenGuard,userId,input.token,input.scope,input.revision),
  raw.prepare('UPDATE app_data_controls SET revision=revision+1,last_delete_id=?,last_scope=?,deleted_at=? WHERE user_id=? AND revision=?').bind(input.token,input.scope,now,userId,input.revision),
  ...deletionOrder.filter(name=>definitions.has(name)).map(name=>{const d=definitions.get(name)!,filter=tableFilter(d,userId,input.scope);return raw.prepare(`DELETE FROM ${name} WHERE ${filter.where}`).bind(...filter.values)}),
  raw.prepare('DELETE FROM app_privacy_confirmations WHERE user_id=?').bind(userId),
  raw.prepare('DELETE FROM app_data_guards WHERE id IN (?,?)').bind(guardId,tokenGuard),
 ];
 try{await raw.batch(statements)}catch(error){
  if(isRevisionFailure(error)){
   const saved=await raw.prepare('SELECT revision,last_delete_id,last_scope,deleted_at FROM app_data_controls WHERE user_id=?').bind(userId).first<Control>();
   if(saved?.last_delete_id===input.token&&saved.last_scope===input.scope&&saved.revision===input.revision+1)return {deleted:true,scope:input.scope,completedAt:saved.deleted_at,replayed:true};
   throw new CoachError(409,'数据版本或删除确认已改变，请刷新页面后重新确认。');
  }
  throw error;
 }
 return {deleted:true,scope:input.scope,completedAt:now,replayed:false};
}
export async function deletionStatus(db:D1Database,userId:string,token:string){
 const row=await db.prepare('SELECT revision,last_delete_id,last_scope,deleted_at FROM app_data_controls WHERE user_id=?').bind(userId).first<Control>();
 return row?.last_delete_id===token?{deleted:true,scope:row.last_scope,completedAt:row.deleted_at}:{deleted:false,notice:'未找到此请求的完成回执。可重试相同请求；确认过期则重新确认。'};
}
