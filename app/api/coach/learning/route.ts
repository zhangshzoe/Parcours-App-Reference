import {z} from 'zod';
import {savedLesson,lessonAttemptView} from '@/lib/coach/lesson-journey';
import type {LessonRow as Attempt} from '@/lib/coach/lesson-journey';
import {env} from 'cloudflare:workers';
import {aiCapabilities} from '@/lib/coach/ai';
import {dailyPlan} from '@/lib/coach/planner';
import {context,reply,readBody,failure,ownProfile,CoachError} from '@/lib/coach/server';
import {coachLessons,getCoachLesson,publicLesson} from '@/lib/coach/catalog';
import {reviewSchedule} from '@/lib/coach/learning';
import type {CoachGoal} from '@/lib/coach/types';
export const dynamic='force-dynamic';
type Review={id:string;profile_id:string;source_key:string;kind:string;payload:string;stage:number;due_at:number;revision:number};
const uuid=z.string().uuid();
const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('start'),profileId:uuid,lessonId:z.string(),attemptId:uuid}),
 z.object({action:z.literal('save'),profileId:uuid,attemptId:uuid,revision:z.number().int().nonnegative(),answer:z.number().int().min(0).max(2).nullable(),writing:z.string().max(6000)}),
 z.object({action:z.literal('complete'),profileId:uuid,attemptId:uuid,revision:z.number().int().nonnegative(),answer:z.number().int().min(0).max(2),writing:z.string().trim().max(6000)}),
 z.object({action:z.literal('plan'),profileId:uuid,replan:z.boolean().optional()}),
 z.object({action:z.literal('bookmark'),profileId:uuid,lessonId:z.string(),phraseIndex:z.number().int().min(0).max(100)}),
 z.object({action:z.literal('review'),profileId:uuid,itemId:uuid,revision:z.number().int().nonnegative(),grade:z.enum(['again','hard','easy']),eventId:uuid,response:z.string().trim().min(1).max(3000).optional()}),
]);
const viewAttempt=lessonAttemptView;
export async function GET(request:Request){try{
 const {db,user}=await context(request),id=uuid.parse(new URL(request.url).searchParams.get('profileId'));
 const p=await ownProfile(db,user.userId,id),goal=JSON.parse(p.goal) as CoachGoal;
 const results=await db.batch([
  db.prepare('SELECT * FROM coach_attempts WHERE profile_id = ? ORDER BY created_at DESC').bind(p.id),
  db.prepare('SELECT * FROM coach_review_items WHERE profile_id = ? ORDER BY due_at, id').bind(p.id),
  db.prepare('SELECT count(*) AS count FROM coach_review_events WHERE profile_id = ?').bind(p.id),
 ]);
  return reply({lessons:coachLessons.filter(l=>l.language===p.language&&l.level===goal.level).map(publicLesson),attempts:(results[0].results as Attempt[]).map(viewAttempt),reviews:(results[1].results as Review[]).map(r=>({...r,payload:JSON.parse(r.payload)})),reviewCount:(results[2].results[0] as {count:number}).count,serverTime:Date.now()});
}catch(e){return failure(e)}}
export async function POST(request:Request){try{
 const {db,user}=await context(request),input=actionSchema.parse(await readBody(request)),p=await ownProfile(db,user.userId,input.profileId),goal=JSON.parse(p.goal) as CoachGoal,now=Date.now();
 if(input.action==='plan')return reply(await dailyPlan(db,p,goal,aiCapabilities(env).configured,now,input.replan));
 if(input.action==='start'||input.action==='bookmark'){
  const l=getCoachLesson(input.lessonId);if(!l||l.language!==p.language||l.level!==goal.level)throw new CoachError(404,'当前语言与等级下找不到此课程。');
  if(input.action==='bookmark'){
   const phrase=l.phrases[input.phraseIndex];if(!phrase)throw new CoachError(404,'表达不存在。');
   await db.prepare('INSERT INTO coach_review_items (id,profile_id,source_key,kind,payload,stage,due_at,revision,created_at) VALUES (?,?,?,?,?,0,?,0,?) ON CONFLICT(profile_id,source_key) DO NOTHING').bind(crypto.randomUUID(),p.id,`${l.id}:v${l.version}:phrase:${input.phraseIndex}`,'expression',JSON.stringify({...phrase,lessonTitle:l.title,language:l.language}),now,now).run();
   return reply({ok:true});
  }
  await db.prepare('INSERT INTO coach_attempts (id,profile_id,lesson_id,content_version,status,writing,revision,created_at,snapshot) VALUES (?,?,?,?,?,?,0,?,?) ON CONFLICT(id) DO NOTHING').bind(input.attemptId,p.id,l.id,l.version,'in_progress','',now,JSON.stringify(l)).run();
  const a=await db.prepare('SELECT * FROM coach_attempts WHERE id = ? AND profile_id = ?').bind(input.attemptId,p.id).first<Attempt>();
  if(!a||a.lesson_id!==l.id)throw new CoachError(409,'该练习请求不可复用，请重新开始。');return reply({attempt:viewAttempt(a)});
 }
 if(input.action==='save'||input.action==='complete'){
  const a=await db.prepare('SELECT * FROM coach_attempts WHERE id = ? AND profile_id = ?').bind(input.attemptId,p.id).first<Attempt>();if(!a)throw new CoachError(404,'练习不存在。');
  if(a.status==='complete'){if(input.action==='complete'&&a.answer===input.answer&&a.writing===input.writing)return reply({attempt:viewAttempt(a)});throw new CoachError(409,'此练习已完成，请开始新的练习。')}
  const l=savedLesson(a);if(l.language!==p.language)throw new CoachError(409,'课程版本已变化，请先返回课程。');
  const complete=input.action==='complete';
  if(complete&&input.writing.trim().split(/\s+/).filter(Boolean).length<l.writing.minimumWords)throw new CoachError(400,`请写至少 ${l.writing.minimumWords} 个词，再提交文字练习。`);
  const result=complete?JSON.stringify({score:Number(input.answer===l.question.answer),outOf:1,answer:l.question.answer,why:l.question.why,writingFeedback:'写作已保存，尚未获得语言质量评估。',evidence:'一项阅读理解与一份文字输出；不代表听说能力或等级认证。'}):null;
  const update=await db.prepare('UPDATE coach_attempts SET answer = ?, writing = ?, revision = revision + 1, status = ?, result = ?, completed_at = ? WHERE id = ? AND profile_id = ? AND revision = ? AND status = ?').bind(input.answer,input.writing,complete?'complete':'in_progress',result,complete?now:null,a.id,p.id,input.revision,'in_progress').run();
  const saved=await db.prepare('SELECT * FROM coach_attempts WHERE id = ? AND profile_id = ?').bind(a.id,p.id).first<Attempt>();
  if(!update.meta.changes&&!(saved!.answer===input.answer&&saved!.writing===input.writing&&saved!.status===(complete?'complete':'in_progress')))throw new CoachError(409,'草稿已在其他页面更新，请返回课程重新读取。');
  return reply({attempt:viewAttempt(saved!)});
 }
 if(input.action==='review'){
  const existing=await db.prepare('SELECT * FROM coach_review_events WHERE id = ? AND profile_id = ?').bind(input.eventId,p.id).first<{item_id:string;grade:string;response:string|null;next_due_at:number;previous_revision:number}>();
  if(existing){if(existing.item_id!==input.itemId||existing.grade!==input.grade||existing.previous_revision!==input.revision||existing.response!==(input.response??null))throw new CoachError(409,'同一复习请求不能改变内容。');return reply({ok:true,dueAt:existing.next_due_at})}
  const item=await db.prepare('SELECT * FROM coach_review_items WHERE id = ? AND profile_id = ?').bind(input.itemId,p.id).first<Review>();if(!item)throw new CoachError(404,'复习项不存在。');
  const transferPrompt=(JSON.parse(item.payload) as {transferPrompt?:string|null}).transferPrompt;
  if(transferPrompt&&!input.response)throw new CoachError(400,'请先在新情境中写出回答，再自评复习结果。');
  if(!transferPrompt&&input.response!==undefined)throw new CoachError(400,'此复习项没有新的情境题。');
  const next=reviewSchedule(item.stage,input.grade,now);
  await db.batch([
   db.prepare('INSERT INTO coach_review_events (id,profile_id,item_id,grade,response,transfer_prompt,previous_revision,next_stage,next_due_at,occurred_at) SELECT ?,profile_id,id,?,?,?,?,?,?,? FROM coach_review_items WHERE id = ? AND profile_id = ? AND revision = ? ON CONFLICT(id) DO NOTHING').bind(input.eventId,input.grade,input.response??null,transferPrompt??null,input.revision,next.stage,next.dueAt,now,item.id,p.id,input.revision),
   db.prepare('UPDATE coach_review_items SET stage = ?,due_at = ?,revision = revision + 1 WHERE id = ? AND profile_id = ? AND revision = ? AND EXISTS (SELECT 1 FROM coach_review_events WHERE id = ? AND item_id = ? AND profile_id = ? AND previous_revision = ?)').bind(next.stage,next.dueAt,item.id,p.id,input.revision,input.eventId,item.id,p.id,input.revision),
  ]);
  const event=await db.prepare('SELECT next_due_at FROM coach_review_events WHERE id = ? AND profile_id = ? AND item_id = ? AND grade = ? AND previous_revision = ?').bind(input.eventId,p.id,item.id,input.grade,input.revision).first<{next_due_at:number}>();
  if(!event)throw new CoachError(409,'此表达已在另一页面复习，请重新读取。');return reply({ok:true,dueAt:event.next_due_at});
 }
 return reply({error:'未知操作。'},400);
}catch(e){return failure(e)}}
