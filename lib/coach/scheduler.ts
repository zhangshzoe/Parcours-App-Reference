import type {CoachGoal} from './types';
import type {PlanTask} from './learning';
export type Skill='reading'|'writing'|'listening'|'speaking';
export const skillNames:Record<Skill,string>={reading:'阅读',writing:'写作',listening:'听力',speaking:'口语'};
export type Candidate=PlanTask&{skills:Skill[];resumeAt?:number;interest?:boolean;repeated?:boolean};
export type SkillSignal={samples:number;wrong:number;recent:number};
export type Signals=Record<Skill,SkillSignal>;
export const emptySignals=():Signals=>Object.fromEntries(Object.keys(skillNames).map(k=>[k,{samples:0,wrong:0,recent:0}])) as Signals;
export function dailySchedule(goal:CoachGoal,candidates:Candidate[],due:string[],signals:Signals,date:string,budget:number=goal.dailyMinutes):PlanTask[]{
 const chosen:Candidate[]=[];let remaining=Math.max(0,budget);
 const reviewMinutes=Math.min(due.length,Math.floor(goal.dailyMinutes*.3),remaining);
 remaining-=reviewMinutes;
 const pool=candidates.filter(c=>Number.isFinite(c.minutes)&&c.minutes>0&&c.minutes<=remaining);
 const used=new Set<string>();
 const add=(c:Candidate,reason:string)=>{chosen.push({...c,reason});used.add(c.id);remaining-=c.minutes};
 const resume=pool.filter(c=>c.resumeAt).sort((a,b)=>b.resumeAt!-a.resumeAt!||a.id.localeCompare(b.id))[0];
 if(resume)add(resume,'继续已保存的练习；预计用时已计入今天预算。');
 const rotation=Math.floor(Date.parse(date+'T12:00:00Z')/86400000),skills:Skill[]=['listening','reading','speaking','writing'];
 const preferred=skills[((rotation%4)+4)%4];
 const base:Record<CoachGoal['mode'],Record<PlanTask['type'],number>>={
  exam:{'lesson-practice':35,review:0,lesson:12,listening:35,speaking:35,exam:45},
  speaking:{'lesson-practice':60,review:0,lesson:8,listening:55,speaking:60,exam:0},
  balanced:{'lesson-practice':35,review:0,lesson:32,listening:32,speaking:32,exam:32},
 };
 const score=(c:Candidate)=>base[goal.mode][c.type]+(c.interest?4:0)+(c.repeated?-5:0)+Math.max(...c.skills.map(skill=>
  (signals[skill].recent===0?60:Math.max(0,8-signals[skill].recent*2))+
  (signals[skill].samples>=3&&signals[skill].wrong/signals[skill].samples>=.4?25:0)+
  (skill===preferred?8:0)-chosen.filter(t=>t.skills.includes(skill)).length*35));
 while(true){
  const next=pool.filter(c=>!used.has(c.id)&&c.minutes<=remaining).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
  if(!next)break;
  const weak=next.skills.find(s=>signals[s].samples>=3&&signals[s].wrong/signals[s].samples>=.4);
  const unseen=next.skills.find(s=>signals[s].recent===0);
  let reason=weak?'最近首次作答中，'+skillNames[weak]+'有 '+signals[weak].wrong+'/'+signals[weak].samples+' 题需要巩固；仅为练习线索，不判定能力等级。':
   unseen?'近 7 天没有'+skillNames[unseen]+'完成记录，安排一次补充练习；不表示这项能力较弱。':
   goal.mode==='speaking'?'按听说目标优先安排精听与交流，保留文字支撑。':goal.mode==='exam'?'按考证目标安排专项及听说训练；不是完整模拟考试。':'按兼顾目标轮换课程、听说与专项练习。';
  if(next.repeated)reason+=' 这是已接触材料，不作为独立能力提升证据。';
  add(next,reason);
 }
 const output:PlanTask[]=chosen.map(({resumeAt,interest,repeated,...task})=>task);
 if(reviewMinutes)output.splice(resume?1:0,0,{id:'review',type:'review',itemIds:due.slice(0,reviewMinutes),title:'复习到期表达',minutes:reviewMinutes,reason:'每条预留约 1 分钟，复习最多占每日预算 30%；其余到期表达可自行继续。'});
 return output;
}
