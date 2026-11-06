import {CoachError} from './server';
import type {ExamRow} from './exams';
import type {ExamAnswers,ExamPaper} from './exam-types';
import type {DialogueFeedback} from './ai';
export const EXAM_FEEDBACK_RULE_VERSION='exam-text-review-v2';
export type ExamStoredFeedback=DialogueFeedback&{ruleVersion?:string};
export type ExamRecording={id:string;attempt_id:string;item_id:string;original_transcript:string;accepted_text:string|null;recording_ms:number;consent_version:string;created_at:number;confirmed_at:number|null};
export type ExamFeedback={itemId:string;body:ExamStoredFeedback;recordingId:string|null;evidenceBasis:'text-only';createdAt:number};
export type ExamRetry={id:string;attempt_id:string;item_id:string;skill:'writing'|'speaking';original_transcript:string|null;accepted_text:string|null;recording_ms:number|null;consent_version:string|null;body:ExamStoredFeedback|null;model:string|null;created_at:number;confirmed_at:number|null;feedback_at:number|null};
export type ExamResponseView={audioReceipt?:import('./audio-submission').AudioReceipt;retryReceipt?:import('./audio-submission').AudioReceipt;recordings:ExamRecording[];feedback:ExamFeedback[];retries:ExamRetry[];running:{operation:string;itemId:string}[]};
export async function examResponses(db:D1Database,row:ExamRow):Promise<ExamResponseView>{
 await db.prepare("UPDATE coach_exam_response_calls SET status='failed',error_code='interrupted',finished_at=? WHERE attempt_id=? AND status='running' AND created_at<?").bind(Date.now(),row.id,Date.now()-90000).run();
 const [recordings,feedback,retries,running]=await db.batch([
  db.prepare('SELECT * FROM coach_exam_recordings WHERE attempt_id=? ORDER BY created_at,id').bind(row.id),
  db.prepare('SELECT * FROM coach_exam_feedback WHERE attempt_id=?').bind(row.id),
  db.prepare('SELECT * FROM coach_exam_retries WHERE attempt_id=? ORDER BY created_at,id').bind(row.id),
  db.prepare("SELECT operation,item_id AS itemId FROM coach_exam_response_calls WHERE attempt_id=? AND status='running'").bind(row.id)
 ]);
 return {recordings:recordings.results as ExamRecording[],feedback:(feedback.results as {item_id:string;body:string;recording_id:string|null;created_at:number}[]).map(f=>({itemId:String(f.item_id),body:JSON.parse(String(f.body)),recordingId:f.recording_id?String(f.recording_id):null,evidenceBasis:'text-only',createdAt:Number(f.created_at)})),retries:(retries.results as (Omit<ExamRetry,'body'>&{body:string|null})[]).map(r=>({...r,body:r.body?JSON.parse(r.body):null})),running:running.results as ExamResponseView['running']};
}
export async function validateExamSpeaking(db:D1Database,row:ExamRow,paper:ExamPaper,answers:ExamAnswers){
 for(const item of paper.items)if(item.skill==='speaking'&&answers[item.id]!==undefined){
  const recording=await db.prepare('SELECT id FROM coach_exam_recordings WHERE id=? AND attempt_id=? AND item_id=? AND confirmed_at IS NOT NULL AND accepted_text IS NOT NULL').bind(answers[item.id],row.id,item.id).first();
  if(!recording)throw new CoachError(409,'口语答案必须选择本题已确认转写的录音，不能用文字替代录音。');
 }
}
