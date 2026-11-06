import {firstObjectiveSamples,listeningEvidenceId,type ObjectiveEvent} from './objective-evidence';
import {sharedUsageSQL} from './usage';
import {DAILY_CALL_LIMIT} from './conversations';
import {coachLessons} from './catalog';
import {listeningMaterials} from './listening-catalog';
import {coachScenarios} from './scenarios';
import {examPapers} from './exam-catalog';
import {localDate,type PlanTask} from './learning';
import {dailySchedule,emptySignals,type Candidate} from './scheduler';
import type {CoachGoal,CoachLanguage} from './types';
import type {ExamResult,ExamPaper} from './exam-types';
import type {ListeningResult,ListeningMaterial,ListeningAnswers} from './listening-types';
export const PLAN_RULE='evidence-v4';
type LessonRow={full_completed_at:number|null;id:string;lesson_id:string;status:string;created_at:number;completed_at:number|null;result:string|null};
type ListenRow={answers:string;id:string;material_id:string;status:string;created_at:number;submitted_at:number|null;result:string|null;snapshot:string};
type ExamRow={id:string;paper_id:string;status:string;created_at?:number;started_at:number;deadline_at:number;submitted_at:number|null;result:string|null;snapshot:string};
type SceneRow={id:string;scenario_id:string|null;level:string;status:string;created_at:number;ended_at:number|null;replies:number;audio_replies:number};
export async function planContext(db:D1Database,profile:{id:string;language:CoachLanguage},goal:CoachGoal,configured:boolean,now:number){
 const date=localDate(now,goal.timezone),week=now-7*86400000,fortnight=now-14*86400000;
 const rows=await db.batch([
  db.prepare('SELECT id,lesson_id,status,created_at,completed_at,full_completed_at,result FROM coach_attempts WHERE profile_id=? ORDER BY created_at').bind(profile.id),
  db.prepare('SELECT id,answers,material_id,status,created_at,submitted_at,result,snapshot FROM coach_listening_attempts WHERE profile_id=? ORDER BY created_at').bind(profile.id),
  db.prepare("SELECT id,paper_id,status,started_at,deadline_at,submitted_at,result,snapshot FROM coach_exam_attempts WHERE profile_id=? AND mode='timed' ORDER BY started_at").bind(profile.id),
  db.prepare("SELECT c.id,c.scenario_id,c.level,c.status,c.created_at,c.ended_at,(SELECT count(*) FROM coach_turns t WHERE t.conversation_id=c.id AND t.state='replied') replies,(SELECT count(*) FROM coach_turns t WHERE t.conversation_id=c.id AND t.state='replied' AND t.input_kind='audio') audio_replies FROM coach_conversations c WHERE c.profile_id=? ORDER BY c.created_at").bind(profile.id),
  db.prepare('SELECT id,due_at FROM coach_review_items WHERE profile_id=? ORDER BY due_at,id').bind(profile.id),
  db.prepare('SELECT item_id,max(occurred_at) occurred_at FROM coach_review_events WHERE profile_id=? GROUP BY item_id').bind(profile.id),
 ]);
 const lessons=coachLessons.filter(l=>l.language===profile.language&&l.level===goal.level);
 const attempts=(rows[0].results as LessonRow[]).filter(a=>lessons.some(l=>l.id===a.lesson_id));
 const listening=(rows[1].results as ListenRow[]).filter(a=>(JSON.parse(a.snapshot) as ListeningMaterial).level===goal.level);
 const exams=(rows[2].results as ExamRow[]).filter(a=>(JSON.parse(a.snapshot) as ExamPaper).level===goal.level);
 const scenes=(rows[3].results as SceneRow[]).filter(a=>a.level===goal.level),reviews=rows[4].results as {id:string;due_at:number}[];
 const reviewEvents=rows[5].results as {item_id:string;occurred_at:number}[];
 const signals=emptySignals(),events:ObjectiveEvent[]=[];
 const inWeek=(at:number|null)=>at!==null&&at>=week&&at<=now;
 // An empty submission can reveal the transcript, but does not complete the
 // planned understanding practice or provide evidence of recent answering.
 const hasListeningResponse=(a:ListenRow)=>{
  if(!a.result)return false;
  const answers=JSON.parse(a.answers) as ListeningAnswers,result=JSON.parse(a.result) as ListeningResult;
  return result.items.some(item=>Object.hasOwn(answers.choices,item.id))||Boolean(answers.dictation?.trim());
 };
 for(const a of attempts.filter(a=>a.status==='complete'&&a.result&&a.completed_at!==null)){
  if(inWeek(a.completed_at)){signals.reading.recent++;signals.writing.recent++}
  events.push({skill:'reading',id:'lesson:'+a.lesson_id,at:a.completed_at!,correct:JSON.parse(a.result!).score===1,repeated:false});
 }
 for(const a of listening.filter(a=>a.status==='submitted'&&a.result&&a.submitted_at!==null)){
  const result=JSON.parse(a.result!) as ListeningResult,answers=JSON.parse(a.answers) as ListeningAnswers;
  if(inWeek(a.submitted_at)&&hasListeningResponse(a))signals.listening.recent++;
  for(const item of result.items)if(Object.hasOwn(answers.choices,item.id))events.push({skill:'listening',id:listeningEvidenceId(a.material_id,item.id),at:a.submitted_at!,correct:item.correct,repeated:result.repeated});
 }
 for(const a of exams.filter(a=>a.status!=='active'&&a.result&&a.submitted_at!==null)){
  const result=JSON.parse(a.result!) as ExamResult;
  if(inWeek(a.submitted_at))for(const skill of new Set(result.items.filter(i=>i.answered).map(i=>i.skill)))signals[skill].recent++;
  for(const item of result.items)if((item.skill==='reading'||item.skill==='listening')&&item.answered)events.push({skill:item.skill,id:item.id,at:a.submitted_at!,correct:item.correct===true,repeated:item.repeated});
 }
 for(const event of firstObjectiveSamples(events,fortnight,now)){signals[event.skill].samples++;if(!event.correct)signals[event.skill].wrong++}
 for(const a of scenes.filter(a=>a.status==='finished'&&inWeek(a.ended_at)&&a.replies>0))signals[a.audio_replies?'speaking':'writing'].recent++;
 const today=(at:number|null)=>at!==null&&localDate(at,goal.timezone)===date;
 const candidates:Candidate[]=[];
 for(const l of lessons){if(attempts.some(a=>a.lesson_id===l.id&&a.status==='complete'))continue;
  const active=attempts.filter(a=>a.lesson_id===l.id&&a.status==='in_progress').at(-1);
  candidates.push({id:l.id,type:'lesson',lessonId:l.id,title:'文字 · '+l.title,minutes:l.minutes,reason:'',skills:['reading','writing'],interest:goal.interests.includes(l.topic),resumeAt:active?.created_at,attemptId:active?.id});
 }
 if(configured){
  for(const l of lessons){const pending=attempts.filter(a=>a.lesson_id===l.id&&a.status==='complete'&&!a.full_completed_at).at(-1);if(pending&&!attempts.some(a=>a.lesson_id===l.id&&a.full_completed_at))candidates.push({id:'lesson-practice:'+l.id,type:'lesson-practice',lessonId:l.id,attemptId:pending.id,title:'本课听说 · '+l.title,minutes:6,reason:'',skills:['listening','speaking'],resumeAt:pending.completed_at??pending.created_at,repeated:true})}

  for(const m of listeningMaterials.filter(m=>m.language===profile.language&&m.level===goal.level)){
   if(candidates.some(c=>c.type==='lesson-practice'&&c.lessonId===m.lessonId))continue;
   if(listening.some(a=>a.material_id===m.id&&a.status==='submitted'&&hasListeningResponse(a)&&today(a.submitted_at)))continue;
   const active=listening.filter(a=>a.material_id===m.id&&a.status==='active').at(-1);
   candidates.push({id:'listen:'+m.id,type:'listening',lessonId:m.lessonId,targetId:m.id,attemptId:active?.id,title:'精听 · '+m.title,minutes:6,reason:'',skills:['listening'],resumeAt:active?.created_at,repeated:listening.some(a=>a.material_id===m.id)||attempts.some(a=>a.lesson_id===m.lessonId)});
  }
  for(const s of coachScenarios.filter(s=>s.language===profile.language&&s.level===goal.level)){
   if(scenes.some(a=>a.scenario_id===s.id&&a.status==='finished'&&a.audio_replies>0&&today(a.ended_at)))continue;
   const active=scenes.filter(a=>a.scenario_id===s.id&&a.status==='active').at(-1);
   candidates.push({id:'scene:'+s.id,type:'speaking',targetId:s.id,attemptId:active?.id,title:'情景交流 · '+s.title,minutes:6,reason:'',skills:['speaking'],resumeAt:active?.created_at,repeated:scenes.some(a=>a.scenario_id===s.id)});
  }
 }
 for(const paper of examPapers.filter(p=>p.language===profile.language&&p.level===goal.level)){
  if(paper.items.some(i=>i.skill==='listening'||i.skill==='speaking')&&!configured)continue;
  if(exams.some(a=>a.paper_id===paper.id&&a.status!=='active'&&today(a.submitted_at)&&a.result&&(JSON.parse(a.result).objective.answered+JSON.parse(a.result).writing.provided+(JSON.parse(a.result).speaking?.provided??0))>0))continue;
  const active=exams.filter(a=>a.paper_id===paper.id&&a.status==='active'&&a.deadline_at>now).at(-1);
  // Combined papers are user-initiated checkpoints, never a default daily assignment.
  if(paper.kind==='integrated'&&!active)continue;
  candidates.push({id:'exam:'+paper.id,type:'exam',targetId:paper.id,attemptId:active?.id,title:paper.title,minutes:active?Math.max(1,Math.ceil((active.deadline_at-now)/60000)):paper.durationSeconds/60,reason:'',skills:[...new Set(paper.items.map(i=>i.skill))],resumeAt:active?.started_at,repeated:exams.some(a=>a.paper_id===paper.id)});
 }
 const status=(task:PlanTask,since:number):PlanTask['status']=>{
  if(task.type==='review')return task.itemIds?.every(id=>reviewEvents.some(r=>r.item_id===id&&r.occurred_at>=since))?'complete':'ready';
  if(task.type==='lesson-practice')return attempts.some(a=>a.id===task.attemptId&&a.full_completed_at)?'complete':configured?'ready':'unavailable';
  if(task.type==='lesson')return attempts.some(a=>a.lesson_id===task.lessonId&&a.status==='complete')?'complete':'ready';
  if(task.type==='listening'&&listening.some(a=>a.material_id===task.targetId&&a.status==='submitted'&&hasListeningResponse(a)&&a.submitted_at!>=since))return 'complete';
  if(task.type==='speaking'&&scenes.some(a=>a.scenario_id===task.targetId&&a.status==='finished'&&a.audio_replies>0&&a.ended_at!>=since))return 'complete';
  if(task.type==='exam'&&exams.some(a=>a.paper_id===task.targetId&&a.status!=='active'&&a.submitted_at!>=since&&a.result&&(JSON.parse(a.result).objective.answered+JSON.parse(a.result).writing.provided+(JSON.parse(a.result).speaking?.provided??0))>0))return 'complete';
  return !configured&&(task.type==='listening'||task.type==='speaking'||(task.type==='exam'&&examPapers.find(p=>p.id===task.targetId)?.items.some(i=>i.skill==='listening'||i.skill==='speaking')))?'unavailable':'ready';
 };
 const notes=[configured?'精听与情景交流已纳入计划；预计分钟数不是有效学习时长。':'语音服务待配置，今天先安排课程、复习和预算内的文字专项；听说覆盖尚不能完成。','依据近 7 天完成记录轮换技能；跨精听与考试去重后，仅用近 14 天至少 3 道首次客观作答提示巩固方向，不评估写作、发音或等级。','计时专项只有完整时限能放进预算时才安排；每日 10 分钟可先用微课练阅读与短表达。'];
 return {date,signals,notes,status,make:(budget:number)=>dailySchedule(goal,candidates,reviews.filter(r=>r.due_at<=now).map(r=>r.id),signals,date,budget)};
}
export async function dailyPlan(db:D1Database,p:{id:string;user_id:string;language:CoachLanguage;revision:number},goal:CoachGoal,configured:boolean,now:number,replan=false){
 const usage=configured?await db.prepare(sharedUsageSQL).bind(p.user_id,new Date(now).setUTCHours(0,0,0,0)).first<{n:number}>():null;
 const quotaFull=Boolean(usage&&usage.n>=DAILY_CALL_LIMIT);
 const ctx=await planContext(db,p,goal,configured&&!quotaFull,now);
 if(quotaFull)ctx.notes[0]='今日 AI 请求额度已用完；听说任务暂不可用，可重新安排文字与复习任务。额度按 UTC 日期重置。';
 let saved=await db.prepare('SELECT tasks,rule_version,created_at FROM coach_plans WHERE profile_id=? AND local_date=? AND goal_revision=?').bind(p.id,ctx.date,p.revision).first<{tasks:string;rule_version:string;created_at:number}>();
 if(!saved||saved.rule_version!==PLAN_RULE||replan){
  const old:PlanTask[]=saved?JSON.parse(saved.tasks):[];
  const complete=old.filter(t=>ctx.status(t,saved!.created_at)==='complete');
  const budget=Math.max(0,goal.dailyMinutes-complete.reduce((sum,t)=>sum+t.minutes,0));
  const tasks=[...complete,...ctx.make(budget).filter(t=>!complete.some(c=>c.id===t.id))];
  if(saved)await db.prepare('UPDATE coach_plans SET tasks=?,rule_version=? WHERE profile_id=? AND local_date=? AND goal_revision=? AND tasks=?').bind(JSON.stringify(tasks),PLAN_RULE,p.id,ctx.date,p.revision,saved.tasks).run();
  else await db.prepare('INSERT INTO coach_plans(id,profile_id,local_date,goal_revision,tasks,rule_version,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,local_date,goal_revision) DO NOTHING').bind(crypto.randomUUID(),p.id,ctx.date,p.revision,JSON.stringify(tasks),PLAN_RULE,now).run();
  saved=await db.prepare('SELECT tasks,rule_version,created_at FROM coach_plans WHERE profile_id=? AND local_date=? AND goal_revision=?').bind(p.id,ctx.date,p.revision).first();
 }
 return {tasks:(JSON.parse(saved!.tasks) as PlanTask[]).map(t=>({...t,status:ctx.status(t,saved!.created_at)})),date:ctx.date,ruleVersion:PLAN_RULE,goalMode:goal.mode,notes:ctx.notes,signals:ctx.signals};
}
