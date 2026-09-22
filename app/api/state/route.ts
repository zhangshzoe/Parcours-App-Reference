import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getDatabase} from '@/db';
import {findLesson,allWords} from '@/lib/curriculum';
import {emptyState} from '@/lib/study-state';
import {levelGuide,countFrenchWords} from '@/lib/levels';
import {z} from 'zod';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){try{const user=await getChatGPTUser();if(!user)return reply(emptyState);const db=getDatabase();const results=await db.batch([
db.prepare('SELECT name, daily_goal FROM profiles WHERE user_id = ?').bind(user.userId),
db.prepare('SELECT lesson_id, score, completed_at FROM lesson_progress WHERE user_id = ? ORDER BY completed_at DESC').bind(user.userId),
db.prepare('SELECT word_id, due_at, interval_days, repetitions FROM reviews WHERE user_id = ? ORDER BY due_at').bind(user.userId),
db.prepare('SELECT lesson_id, seconds, created_at FROM study_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 500').bind(user.userId),
db.prepare('SELECT lesson_id, body FROM writing_drafts WHERE user_id = ?').bind(user.userId),
db.prepare('SELECT result FROM assessments WHERE user_id = ?').bind(user.userId)]);
const profile=results[0].results[0] as {name:string;daily_goal:number}|undefined;
return reply({user:{name:user.fullName||user.email.split('@')[0],email:user.email},profile:{name:profile?.name||'',dailyGoal:profile?.daily_goal||20},progress:results[1].results,reviews:results[2].results,activity:results[3].results,drafts:results[4].results,assessment:results[5].results[0]?JSON.parse(String((results[5].results[0] as {result:string}).result)):null});
}catch(error){console.error('Study state load failed',error);return reply({error:'学习记录暂时无法加载，请稍后重试。'},503)}}
export async function POST(request:Request){
const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'请求来源无效。'},403);
try{const user=await getChatGPTUser();if(!user)return reply({error:'请先登录，随后即可保存学习记录。'},401);
const raw=await request.text();if(raw.length>24000)return reply({error:'内容过长。'},413);
const body=JSON.parse(raw);const action=z.enum(['complete','bookmark','review','profile','draft','assessment','report']).parse(body.action);const db=getDatabase();const uid=user.userId;const now=Date.now();
if(action==='complete'){
 const input=z.object({lessonId:z.string(),answers:z.tuple([z.number().int().min(0).max(2),z.number().int().min(0).max(2)]),writing:z.string().min(15).max(6000),seconds:z.number().int().min(0).max(7200),attemptId:z.string().uuid()}).parse(body);
 const lesson=findLesson(input.lessonId);if(!lesson)return reply({error:'课程不存在。'},404);
 const minimum=levelGuide(lesson.level).completionWords;
 if(countFrenchWords(input.writing)<minimum)return reply({error:`本课请至少写 ${minimum} 个法语词，再完成写作任务。`},400);
 const score=Number(input.answers[0]===lesson.quiz.answer)+Number(input.answers[1]===lesson.grammar.answer);
 await db.batch([
 db.prepare('INSERT INTO lesson_progress (user_id, lesson_id, score, completed_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, lesson_id) DO UPDATE SET score = MAX(score, excluded.score)').bind(uid,lesson.id,score,now),
 db.prepare('INSERT INTO study_activity (user_id, attempt_id, lesson_id, seconds, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, attempt_id) DO NOTHING').bind(uid,input.attemptId,lesson.id,input.seconds,now),
 db.prepare('INSERT INTO writing_drafts (user_id, lesson_id, body, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, lesson_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at').bind(uid,lesson.id,input.writing,now),
 ...lesson.words.map(w=>db.prepare('INSERT INTO reviews (user_id, word_id, due_at, interval_days, repetitions) VALUES (?, ?, ?, 0, 0) ON CONFLICT(user_id, word_id) DO NOTHING').bind(uid,w.id,now))]);
 return reply({ok:true,score});
}
if(action==='bookmark'){const wordId=z.string().parse(body.wordId);if(!allWords.some(w=>w.id===wordId))return reply({error:'词条不存在。'},404);await db.prepare('INSERT INTO reviews (user_id, word_id, due_at, interval_days, repetitions) VALUES (?, ?, ?, 0, 0) ON CONFLICT(user_id, word_id) DO NOTHING').bind(uid,wordId,now).run();return reply({ok:true});}
if(action==='review'){const input=z.object({wordId:z.string(),grade:z.enum(['again','hard','easy'])}).parse(body);const row=await db.prepare('SELECT interval_days, repetitions FROM reviews WHERE user_id = ? AND word_id = ?').bind(uid,input.wordId).first<{interval_days:number;repetitions:number}>();if(!row)return reply({error:'请先收藏这个词条。'},404);const interval=input.grade==='again'?0:input.grade==='hard'?1:Math.min(30,Math.max(1,row.interval_days===0?1:row.interval_days*2+1));const due=now+(interval?interval*86400000:600000);await db.prepare('UPDATE reviews SET due_at = ?, interval_days = ?, repetitions = ? WHERE user_id = ? AND word_id = ?').bind(due,interval,row.repetitions+1,uid,input.wordId).run();return reply({ok:true,dueAt:due});}
if(action==='profile'){const input=z.object({name:z.string().trim().max(40),dailyGoal:z.union([z.literal(10),z.literal(20),z.literal(30)])}).parse(body);await db.prepare('INSERT INTO profiles (user_id, name, daily_goal) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET name = excluded.name, daily_goal = excluded.daily_goal').bind(uid,input.name,input.dailyGoal).run();return reply({ok:true});}
if(action==='draft'){const input=z.object({lessonId:z.string(),writing:z.string().max(6000)}).parse(body);if(!findLesson(input.lessonId))return reply({error:'课程不存在。'},404);await db.prepare('INSERT INTO writing_drafts (user_id, lesson_id, body, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, lesson_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at').bind(uid,input.lessonId,input.writing,now).run();return reply({ok:true});}
if(action==='assessment'){const input=z.object({listening:z.number().int().min(0).max(3),reading:z.number().int().min(0).max(3),oral:z.number().int().min(0).max(3),writing:z.number().int().min(0).max(3)}).parse(body);await db.prepare('INSERT INTO assessments (user_id, result, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET result = excluded.result, updated_at = excluded.updated_at').bind(uid,JSON.stringify({...input,date:now}),now).run();return reply({ok:true});}
if(action==='report'){const input=z.object({lessonId:z.string(),body:z.string().trim().min(5).max(1000)}).parse(body);if(!findLesson(input.lessonId))return reply({error:'课程不存在。'},404);await db.prepare('INSERT INTO content_reports (id, user_id, lesson_id, body, created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(),uid,input.lessonId,input.body,now).run();return reply({ok:true});}
return reply({error:'未知操作。'},400);
}catch(error){if(error instanceof z.ZodError||error instanceof SyntaxError)return reply({error:'提交内容不完整或格式不正确，请检查后重试。'},400);console.error('Study save failed',error);return reply({error:'暂时无法保存，内容仍保留在当前页面，请重试。'},503)}
}

