import {CoachError} from './server';
import type {AssessmentAnswers,AssessmentAttempt,AssessmentDefinition,AssessmentResult} from './assessment-types';
export type AssessmentRow={id:string;profile_id:string;snapshot:string;status:AssessmentAttempt['status'];answers:string;revision:number;repeated:number;result:string|null;created_at:number;submitted_at:number|null};
export const emptyAssessmentAnswers=():AssessmentAnswers=>({choices:{},selfRatings:{speaking:null,writing:null}});
export async function ownAssessment(db:D1Database,profileId:string,id:string){const row=await db.prepare('SELECT * FROM coach_assessment_attempts WHERE id = ? AND profile_id = ?').bind(id,profileId).first<AssessmentRow>();if(!row)throw new CoachError(404,'找不到此起点检查。');return row}
export function validateAssessmentAnswers(definition:AssessmentDefinition,answers:AssessmentAnswers){
 for(const [id,value] of Object.entries(answers.choices)){const q=definition.questions.find(q=>q.id===id);if(!q||!Number.isInteger(value)||value<0||value>=q.options.length)throw new CoachError(400,'答案不属于此检查。')}
 return answers;
}
export function gradeAssessment(d:AssessmentDefinition,a:AssessmentAnswers,repeated:boolean):AssessmentResult{
 const stats=(skill:'reading'|'listening')=>{const qs=d.questions.filter(q=>q.skill===skill),answered=qs.filter(q=>a.choices[q.id]!==undefined);return {total:qs.length,answered:answered.length,correct:answered.length?answered.filter(q=>a.choices[q.id]===q.answer).length:null}};
 const reading=stats('reading'),listening=stats('listening');
 const full=reading.answered===reading.total&&listening.answered===listening.total;
 const ready=(level:'A1'|'A2')=>d.questions.filter(q=>q.level===level&&q.skill==='reading'&&a.choices[q.id]===q.answer).length>=2&&d.questions.filter(q=>q.level===level&&q.skill==='listening').every(q=>a.choices[q.id]===q.answer);
 const suggestion=!full||repeated?'insufficient':ready('A1')&&ready('A2')?'try-a2':'consolidate-a1';
 const reason=repeated?'这次包含已见过的题目，可用于复习，不据此更新起点建议。':!full?'检查未覆盖全部听读题，只记录已回答的项目；未回答部分尚未评估。':suggestion==='try-a2'?'本组 A1、A2 样题中，各答对至少两道阅读题及一道听力题；可以尝试 A2 路线，再根据实际课程表现调整。':'本组样题中仍有基础理解需要巩固，建议先复习 A1，再按实际练习情况调整路线。';
 return {skills:{reading,listening},selfRatings:a.selfRatings,suggestion,reason,repeated,ruleVersion:'orientation-v1-unvalidated',items:d.questions.map(q=>({id:q.id,correct:a.choices[q.id]===undefined?null:a.choices[q.id]===q.answer,answer:q.answer,explanation:q.explanation,text:q.text,translation:q.translation,knowledge:q.knowledge})),notice:'仅供选择学习路线：6 道阅读、2 道听力样题，内容未人工审核，建议规则未经过教师校准。表达项目仅为自评；不是 CEFR 等级认证或考试成绩。播放记录来自浏览器回执，不证明有效听力时长。'};
}
export async function assessmentView(db:D1Database,row:AssessmentRow):Promise<AssessmentAttempt>{
 const d:AssessmentDefinition=JSON.parse(row.snapshot),played=await db.prepare("SELECT DISTINCT question_id FROM coach_assessment_calls WHERE attempt_id = ? AND status = 'succeeded' AND played_at IS NOT NULL").bind(row.id).all<{question_id:string}>();
 return {id:row.id,language:d.language,version:d.version,status:row.status,revision:row.revision,answers:JSON.parse(row.answers),repeated:Boolean(row.repeated),createdAt:row.created_at,submittedAt:row.submitted_at,result:row.result?JSON.parse(row.result):null,playedQuestionIds:played.results.map(r=>r.question_id),questions:d.questions.map(({answer,explanation,translation,...q})=>({...q,text:q.skill==='listening'&&row.status!=='submitted'?'':q.text}))};
}
export async function expireAssessmentCalls(db:D1Database,id:string){await db.prepare("UPDATE coach_assessment_calls SET status='failed',error_code='interrupted',finished_at=? WHERE attempt_id=? AND status='running' AND created_at<?").bind(Date.now(),id,Date.now()-90000).run()}
