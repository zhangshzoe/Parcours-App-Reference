import type {CoachGoal} from './types';
export type PlanTask={id:string;type:'lesson'|'lesson-practice'|'review'|'listening'|'speaking'|'exam';lessonId?:string;targetId?:string;attemptId?:string;itemIds?:string[];title:string;minutes:number;reason:string;status?:'ready'|'complete'|'unavailable';skills?:('reading'|'writing'|'listening'|'speaking')[]};
export function localDate(now:number,timezone:string){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(t=>parts.find(p=>p.type===t)?.value).join('-')}
export function reviewSchedule(stage:number,grade:'again'|'hard'|'easy',now:number){
 const days=[1,3,7,14,30];
 if(grade==='again')return {stage:0,dueAt:now+600000};
 if(grade==='hard')return {stage,dueAt:now+86400000};
 return {stage:Math.min(stage+1,5),dueAt:now+days[Math.min(stage,4)]*86400000};
}
export function makePlan(goal:CoachGoal,lessons:{id:string;title:string;minutes:number;topic:string}[],completed:Set<string>,unfinished:Set<string>,dueIds:string[]):PlanTask[]{
 const tasks:PlanTask[]=[];let budget=goal.dailyMinutes;
 if(dueIds.length){const minutes=Math.min(Math.max(1,Math.floor(budget*.3)),dueIds.length);tasks.push({id:'review',type:'review',itemIds:dueIds.slice(0,minutes),title:'复习到期表达',minutes,reason:'这些表达已到复习时间；本次只安排预算内的数量。'});budget-=minutes}
 const candidates=lessons.filter(l=>!completed.has(l.id)).sort((a,b)=>Number(unfinished.has(b.id))-Number(unfinished.has(a.id))||Number(goal.interests.includes(b.topic))-Number(goal.interests.includes(a.topic)));
 for(const l of candidates){if(l.minutes>budget)continue;tasks.push({id:l.id,type:'lesson',lessonId:l.id,title:l.title,minutes:l.minutes,reason:unfinished.has(l.id)?'先继续上次未完成的文字练习。':goal.interests.includes(l.topic)?'与您选择的兴趣场景匹配。':'建立当前等级的表达基础。'});budget-=l.minutes}
 return tasks;
}
