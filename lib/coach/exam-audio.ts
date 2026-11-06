import {CoachError} from './server';
import type {ExamRow} from './exams';
import type {ExamAnswers,ExamPaper,ExamStudyHelp} from './exam-types';
export type ExamAudioState=Record<string,{requested:number;played:boolean;running:boolean}>;
export async function examAudioState(db:D1Database,row:ExamRow):Promise<ExamAudioState>{
 await db.prepare("UPDATE coach_exam_audio_calls SET status='failed',error_code='interrupted',finished_at=? WHERE attempt_id=? AND status='running' AND created_at<?").bind(Date.now(),row.id,Date.now()-90000).run();
 const {results}=await db.prepare('SELECT audio_key,status,played_at FROM coach_exam_audio_calls WHERE attempt_id=?').bind(row.id).all<{audio_key:string;status:string;played_at:number|null}>();
 const state:ExamAudioState={};for(const call of results){const s=state[call.audio_key]??={requested:0,played:false,running:false};if(call.status!=='failed')s.requested++;if(call.played_at!==null)s.played=true;if(call.status==='running')s.running=true}return state;
}
export async function validateExamListening(db:D1Database,row:ExamRow,paper:ExamPaper,answers:ExamAnswers){
 const state=await examAudioState(db,row);
 const help=row.mode==='study'?JSON.parse(row.help) as ExamStudyHelp:{};
 for(const item of paper.items)if(item.skill==='listening'&&answers[item.id]!==undefined&&!state[item.audio!.key]?.played&&!help[item.id]?.deviceVoice)throw new CoachError(409,'请先完成对应材料的音频播放，再保存这道听力答案。未播放的题目可以留空。');
}
