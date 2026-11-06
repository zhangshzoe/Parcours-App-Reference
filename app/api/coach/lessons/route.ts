import {z} from 'zod';
import {env} from 'cloudflare:workers';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {aiCapabilities} from '@/lib/coach/ai';
import {ownLessonAttempt,savedLesson,lessonJourney} from '@/lib/coach/lesson-journey';
import {withPronunciation} from '@/lib/coach/pronunciation';
import {listeningMaterials} from '@/lib/coach/listening-catalog';
import {lessonPractice} from '@/lib/coach/lesson-practice';
import {CONSENT_VERSION} from '@/lib/coach/conversations';
const uuid=z.string().uuid(),base={profileId:uuid,attemptId:uuid};
const schema=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('listening'),componentId:uuid}).strict(),
 z.object({...base,action:z.literal('speaking'),componentId:uuid,consentVersion:z.literal(CONSENT_VERSION),replaceConversationId:uuid.optional()}).strict(),
 z.object({...base,action:z.literal('finish')}).strict(),
]);
export async function GET(request:Request){try{const {db,user}=await context(request),url=new URL(request.url),p=await ownProfile(db,user.userId,url.searchParams.get('profileId')??''),a=await ownLessonAttempt(db,p.id,url.searchParams.get('attemptId')??'');return reply({...await lessonJourney(db,a),capabilities:aiCapabilities(env)})}catch(e){return failure(e)}}
export async function POST(request:Request){try{
 const {db,user}=await context(request),input=schema.parse(await readBody(request)),p=await ownProfile(db,user.userId,input.profileId),a=await ownLessonAttempt(db,p.id,input.attemptId),lesson=savedLesson(a),now=Date.now();
 if(lesson.language!==p.language)throw new CoachError(409,'课程语言与档案不符。');
 const view=async()=>({...await lessonJourney(db,await ownLessonAttempt(db,p.id,a.id)),capabilities:aiCapabilities(env)});
 if(input.action==='finish'){
  if(a.full_completed_at)return reply(await view());
  const state=await lessonJourney(db,a);if(!state.steps.text||!state.steps.listening||!state.steps.speaking)throw new CoachError(409,'请完成文字练习、播放本课音频，并完成至少一轮录音交流、结束会话和生成小结。');
  const result=await db.prepare("UPDATE coach_attempts SET full_completed_at=? WHERE id=? AND profile_id=? AND status='complete' AND full_completed_at IS NULL AND EXISTS(SELECT 1 FROM coach_listening_attempts l WHERE l.id=coach_attempts.listening_id AND l.profile_id=coach_attempts.profile_id AND l.played_at IS NOT NULL AND json_extract(l.snapshot,'$.courseAttemptId')=coach_attempts.id) AND EXISTS(SELECT 1 FROM coach_conversations c WHERE c.id=coach_attempts.conversation_id AND c.profile_id=coach_attempts.profile_id AND c.status='finished' AND c.summary IS NOT NULL AND json_extract(c.practice_snapshot,'$.lessonAttemptId')=coach_attempts.id AND EXISTS(SELECT 1 FROM coach_turns t WHERE t.conversation_id=c.id AND t.input_kind='audio' AND t.state='replied'))").bind(now,a.id,p.id).run();
  if(!result.meta.changes&&!(await ownLessonAttempt(db,p.id,a.id)).full_completed_at)throw new CoachError(409,'步骤记录发生变化，请重新读取。');return reply(await view());
 }
 if(input.action==='listening'){
  if(a.listening_id)return reply(await view());
  const material=listeningMaterials.find(m=>m.lessonId===lesson.id&&m.language===lesson.language&&m.lessonVersion===lesson.version);if(!material)throw new CoachError(409,'此版本的课程音频材料待补齐。');
  if(await db.prepare('SELECT id FROM coach_listening_attempts WHERE id=?').bind(input.componentId).first())throw new CoachError(409,'此请求标识已被使用。');
  await db.batch([
   db.prepare("INSERT INTO coach_listening_attempts(id,profile_id,material_id,snapshot,answers,repeated,created_at) SELECT ?,profile_id,?,?,?,1,? FROM coach_attempts WHERE id=? AND profile_id=? AND listening_id IS NULL ON CONFLICT(id) DO NOTHING").bind(input.componentId,material.id,JSON.stringify({...withPronunciation(material),courseAttemptId:a.id}),JSON.stringify({choices:{},dictation:''}),now,a.id,p.id),
   db.prepare("UPDATE coach_attempts SET listening_id=? WHERE id=? AND profile_id=? AND listening_id IS NULL AND EXISTS(SELECT 1 FROM coach_listening_attempts WHERE id=? AND profile_id=? AND json_extract(snapshot,'$.courseAttemptId')=?)").bind(input.componentId,a.id,p.id,input.componentId,p.id,a.id),
  ]);return reply(await view());
 }
 if(a.conversation_id===input.componentId)return reply(await view());
 if(a.full_completed_at)throw new CoachError(409,'整课记录已封存，不能替换口语步骤。');
 if(a.conversation_id&&!input.replaceConversationId)return reply(await view());
 if(input.replaceConversationId){if(input.replaceConversationId!==a.conversation_id)throw new CoachError(409,'待替换的会话已经变化。');const old=await db.prepare('SELECT status FROM coach_conversations WHERE id=? AND profile_id=?').bind(input.replaceConversationId,p.id).first<{status:string}>();if(old?.status!=='finished')throw new CoachError(409,'请先结束当前会话，再重新练习。')}
 const oldId=a.conversation_id??null,s=lessonPractice(lesson,a.id);
 if(await db.prepare('SELECT id FROM coach_conversations WHERE id=?').bind(input.componentId).first())throw new CoachError(409,'此请求标识已被使用。');
 const count=await db.prepare('SELECT count(*) n FROM coach_conversations WHERE profile_id=? AND created_at>=?').bind(p.id,now-86400000).first<{n:number}>();if(count!.n>=100)throw new CoachError(429,'今天开始的会话较多，请先继续已有练习。');
 await db.batch([
  db.prepare("INSERT INTO coach_conversations(id,profile_id,scenario_id,scenario_version,practice_type,practice_topic,practice_snapshot,language,level,mode,status,consent_version,created_at) SELECT ?,profile_id,NULL,?,'lesson',?,?,?,?,'guided','active',?,? FROM coach_attempts WHERE id=? AND profile_id=? AND conversation_id IS ? AND full_completed_at IS NULL AND (SELECT count(*) FROM coach_conversations WHERE profile_id=? AND created_at>=?)<100 ON CONFLICT(id) DO NOTHING").bind(input.componentId,s.version,s.topic,JSON.stringify(s),s.language,s.level,CONSENT_VERSION,now,a.id,p.id,oldId,p.id,now-86400000),
  db.prepare("UPDATE coach_attempts SET conversation_id=? WHERE id=? AND profile_id=? AND conversation_id IS ? AND full_completed_at IS NULL AND EXISTS(SELECT 1 FROM coach_conversations WHERE id=? AND profile_id=? AND json_extract(practice_snapshot,'$.lessonAttemptId')=?)").bind(input.componentId,a.id,p.id,oldId,input.componentId,p.id,a.id),
 ]);
 const after=await ownLessonAttempt(db,p.id,a.id);if(!after.conversation_id||after.conversation_id===oldId)throw new CoachError(409,'口语步骤未开始，请重新读取记录。');return reply(await view());
}catch(e){return failure(e)}}
