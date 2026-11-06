import {sealingExposures} from './exam-exposure';
import {examSkillEvidence} from './exam-report';
import {CoachError} from './server';
import type {ExamAnswers,ExamAttempt,ExamPaper,ExamResult,ExamStudyHelp,PublicExamPaper} from './exam-types';

export type ExamRow={id:string;profile_id:string;paper_id:string;snapshot:string;answers:string;exposed_item_ids:string;mode:ExamAttempt['mode'];help:string;status:ExamAttempt['status'];revision:number;started_at:number;deadline_at:number;submitted_at:number|null;result:string|null};
export function publicPaper(p:ExamPaper):PublicExamPaper{
 return {...p,items:p.items.map(({answer,explanation,rubric,audio,...item})=>{void answer;void explanation;void rubric;return {...item,...(audio?{audio:{key:audio.key}}:{})}})};
}
export function examView(row:ExamRow):ExamAttempt{return {id:row.id,paper:publicPaper(JSON.parse(row.snapshot)),mode:row.mode??'timed',studyHelp:JSON.parse(row.help??'{}') as ExamStudyHelp,status:row.status,answers:JSON.parse(row.answers),revision:row.revision,startedAt:row.started_at,deadlineAt:row.deadline_at,submittedAt:row.submitted_at,result:row.result?JSON.parse(row.result):null,exposedItemIds:JSON.parse(row.exposed_item_ids)}}
export function validateAnswers(paper:ExamPaper,answers:ExamAnswers){
 for(const [id,value] of Object.entries(answers)){
  const item=paper.items.find(i=>i.id===id);
  if(!item)throw new CoachError(400,'答案中包含不属于这份训练的题目。');
  if((item.skill==='reading'||item.skill==='listening')&&(!Number.isInteger(value)||typeof value!=='number'||value<0||value>=(item.options?.length??0)))throw new CoachError(400,'请选择有效选项。');
  if(item.skill==='speaking'&&(typeof value!=='string'||! /^[0-9a-f-]{36}$/i.test(value)))throw new CoachError(400,'口语答案须关联本题录音。');
  if(item.skill==='writing'&&(typeof value!=='string'||value.length>6000))throw new CoachError(400,'写作内容格式不正确或过长。');
 }
 return Object.fromEntries(Object.entries(answers).sort(([a],[b])=>a.localeCompare(b)));
}
export function scoreExam(paper:ExamPaper,answers:ExamAnswers,exposedItemIds:string[]):ExamResult{
 const items:ExamResult['items']=paper.items.map(item=>{
  const value=answers[item.id],answered=(item.skill==='reading'||item.skill==='listening')?typeof value==='number':typeof value==='string'&&Boolean(value.trim());
  return {id:item.id,skill:item.skill,answered,knowledge:item.knowledge,repeated:exposedItemIds.includes(item.id),...(item.audio?{transcript:item.audio.text,translation:item.audio.translation}:{}),...((item.skill==='reading'||item.skill==='listening')?{correct:answered&&value===item.answer,answer:item.answer,explanation:item.explanation}:{rubric:item.rubric,wordCount:item.skill==='writing'&&typeof value==='string'&&value.trim()?value.trim().split(/\s+/u).length:0})};
 });
 return {skillEvidence:examSkillEvidence(items),objective:{correct:items.filter(i=>(i.skill==='reading'||i.skill==='listening')&&i.correct).length,total:items.filter(i=>(i.skill==='reading'||i.skill==='listening')).length,answered:items.filter(i=>(i.skill==='reading'||i.skill==='listening')&&i.answered).length},writing:{provided:items.filter(i=>i.skill==='writing'&&i.answered).length,total:items.filter(i=>i.skill==='writing').length,status:'not-assessed'},speaking:{provided:items.filter(i=>i.skill==='speaking'&&i.answered).length,total:items.filter(i=>i.skill==='speaking').length,status:'not-assessed'},items,notice:'本次仅记录已保存的练习表现；写作与口语未提供分数。考后可另行请求 AI 文字参考反馈，不评估发音、不属于官方成绩，不能认证等级或预测通过率。'};
}
export async function ownExam(db:D1Database,profileId:string,id:string){
 const row=await db.prepare('SELECT * FROM coach_exam_attempts WHERE id = ? AND profile_id = ?').bind(id,profileId).first<ExamRow>();
 if(!row)throw new CoachError(404,'找不到此训练记录。');return row;
}
// Use the saved answers, never a late request payload. The conditional update prevents
// an expiry read from overwriting a concurrent accepted save or submission.
export async function expireExam(db:D1Database,row:ExamRow,now:number):Promise<ExamRow>{
 if(row.status!=='active'||row.mode==='study'||row.deadline_at>now)return row;
 const exposed=await sealingExposures(db,row,JSON.parse(row.snapshot));
 const result=scoreExam(JSON.parse(row.snapshot),JSON.parse(row.answers),exposed);
 await db.prepare("UPDATE coach_exam_attempts SET status = 'expired', submitted_at = deadline_at, result = ?, exposed_item_ids = ?, revision = revision + 1 WHERE id = ? AND profile_id = ? AND status = 'active' AND revision = ? AND deadline_at <= ?").bind(JSON.stringify(result),JSON.stringify(exposed),row.id,row.profile_id,row.revision,now).run();
 const current=await ownExam(db,row.profile_id,row.id);
 // A pre-deadline write may have won the revision race. Finalize its saved revision.
 return current.status==='active'?expireExam(db,current,now):current;
}
export async function commandHash(action:string,revision:number,answers:ExamAnswers){
 const bytes=new TextEncoder().encode(JSON.stringify({action,revision,answers}));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
}
