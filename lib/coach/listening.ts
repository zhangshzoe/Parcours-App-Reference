import {CoachError} from './server';
import type {ListeningMaterial,PublicListeningMaterial,ListeningAnswers,ListeningAttempt,ListeningResult} from './listening-types';
export type ListeningRow={id:string;profile_id:string;material_id:string;snapshot:string;status:'active'|'submitted';answers:string;revision:number;repeated:number;played_call_id:string|null;played_at:number|null;result:string|null;created_at:number;submitted_at:number|null};
export function publicListening(m:ListeningMaterial):PublicListeningMaterial{
 return {id:m.id,version:m.version,lessonId:m.lessonId,language:m.language,level:m.level,title:m.title,segmentCount:m.segments.length,questions:m.questions.map(({id,prompt,options,knowledge})=>({id,prompt,options,knowledge})),dictation:{prompt:m.dictation.prompt},source:m.source};
}
export function listeningView(row:ListeningRow):ListeningAttempt{
 const m:ListeningMaterial=JSON.parse(row.snapshot);
 return {id:row.id,material:publicListening(m),status:row.status,revision:row.revision,answers:JSON.parse(row.answers),played:Boolean(row.played_call_id),repeated:Boolean(row.repeated),startedAt:row.created_at,submittedAt:row.submitted_at,result:row.result?JSON.parse(row.result):null,transcript:row.status==='submitted'?{segments:m.segments,note:m.note,pronunciation:m.pronunciation??null}:null};
}
export async function ownListening(db:D1Database,profileId:string,id:string){const row=await db.prepare('SELECT * FROM coach_listening_attempts WHERE id = ? AND profile_id = ?').bind(id,profileId).first<ListeningRow>();if(!row)throw new CoachError(404,'找不到此语言的听力练习。');return row}
export async function expireListeningCalls(db:D1Database,id:string){await db.prepare("UPDATE coach_listening_calls SET status = 'failed',error_code = 'interrupted',finished_at = ? WHERE attempt_id = ? AND status = 'running' AND created_at < ?").bind(Date.now(),id,Date.now()-90000).run()}
export function listeningAnswers(m:ListeningMaterial,input:ListeningAnswers):ListeningAnswers{
 for(const [id,answer] of Object.entries(input.choices)){const q=m.questions.find(q=>q.id===id);if(!q||!Number.isInteger(answer)||answer<0||answer>=q.options.length)throw new CoachError(400,'请使用此练习中的有效选项。')}
 return {choices:Object.fromEntries(Object.entries(input.choices).sort(([a],[b])=>a.localeCompare(b))),dictation:input.dictation};
}
// Case, surrounding whitespace and punctuation are ignored for these isolated-word
// exercises. Diacritics, German umlauts and internal spelling remain significant.
export function normalizeDictation(value:string,language:string){return value.normalize('NFC').trim().replace(/^[.,!?;:«»“”"\s]+|[.,!?;:«»“”"\s]+$/gu,'').toLocaleLowerCase(language)}
export function scoreListening(m:ListeningMaterial,answers:ListeningAnswers,repeated:boolean):ListeningResult{
 const items=m.questions.map(q=>({id:q.id,answer:q.answer,correct:answers.choices[q.id]===q.answer,explanation:q.explanation,knowledge:q.knowledge}));
 const provided=Boolean(answers.dictation.trim());
 return {correct:items.filter(i=>i.correct).length,total:items.length,answered:Object.keys(answers.choices).length,items,
  dictation:{provided,correct:provided?m.dictation.accepted.some(a=>normalizeDictation(a,m.language)===normalizeDictation(answers.dictation,m.language)):null,accepted:m.dictation.accepted,explanation:m.dictation.explanation},
  evidence:'browser-reported-playback',repeated,notice:'记录的是浏览器报告的整段播放结束与本次作答。播放记录不能证明专注听懂，也不作为有效学习时长；本材料与微课复用，不据此认证等级。'};
}
