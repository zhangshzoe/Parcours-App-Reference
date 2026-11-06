import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {context,readBody,reply,failure,CoachError} from '@/lib/coach/server';
import {aiConfig,createAIService,AIServiceError} from '@/lib/coach/ai';
import {inspectWav,RecordingError} from '@/lib/coach/wav';
import {englishScenarios,englishScenario,type EnglishScenario} from '@/lib/english/scenarios';
import {emptyEnglishProgress,englishProgressReport} from '@/lib/english/progress';
import {alternativeQuestion,capabilities,initialHelp,listeningResult,ownProfile,ownSession,publicProfile,reviewRow,sessionView,type TurnRow} from '@/lib/english/server';
import {ENGLISH_CONSENT_VERSION,ENGLISH_AI_FEEDBACK_CONSENT_VERSION,ENGLISH_FEEDBACK_VERSION,type EnglishHelp,type EnglishListeningResult} from '@/lib/english/types';
import type {EnglishDialogueFeedback} from '@/lib/coach/ai';

export const dynamic='force-dynamic';
const uuid=z.string().uuid(),id={profileId:uuid,sessionId:uuid};
const transferScene:Record<EnglishScenario['scene'],EnglishScenario['scene']>={introduction:'clarify-request','project-update':'risk-timeline','clarify-request':'introduction','risk-timeline':'project-update','meeting-followup':'project-update'};
const actions=z.discriminatedUnion('action',[
 z.object({action:z.literal('profile'),profileId:uuid,commandId:uuid,expectedRevision:z.number().int().nonnegative().optional(),dailyMinutes:z.union([z.literal(10),z.literal(20),z.literal(30)])}).strict(),
 z.object({action:z.literal('start'),...id,scenarioId:z.string().min(3).max(80)}).strict(),
 z.object({action:z.literal('assist'),...id,commandId:uuid,revision:z.number().int().nonnegative(),kind:z.enum(['play','slow','text','translation','hint']),segmentId:z.string().max(20).optional(),deviceVoice:z.boolean().optional()}).strict(),
 z.object({action:z.literal('listen'),...id,commandId:uuid,revision:z.number().int().nonnegative(),answers:z.record(z.number().int().min(0).max(2))}).strict(),
 z.object({action:z.literal('text'),...id,turnId:uuid,text:z.string().trim().min(1).max(3000)}).strict(),
 z.object({action:z.literal('audio'),...id,turnId:uuid,commandId:uuid,audio:z.string().min(60).max(2560100),consentVersion:z.literal(ENGLISH_CONSENT_VERSION)}).strict(),
 z.object({action:z.literal('confirm'),...id,turnId:uuid,revision:z.number().int().nonnegative(),text:z.string().trim().min(1).max(3000)}).strict(),
 z.object({action:z.literal('respond'),...id,turnId:uuid,revision:z.number().int().nonnegative(),commandId:uuid,consentVersion:z.literal(ENGLISH_AI_FEEDBACK_CONSENT_VERSION)}).strict(),
 z.object({action:z.literal('speak'),...id,segmentId:z.string().max(20),commandId:uuid}).strict(),
 z.object({action:z.literal('finish'),...id}).strict(),
 z.object({action:z.literal('bookmark'),...id,turnId:uuid,pointIndex:z.number().int().min(0).max(1)}).strict(),
 z.object({action:z.literal('review'),profileId:uuid,itemId:z.string().min(5).max(120),eventId:uuid,revision:z.number().int().nonnegative(),grade:z.enum(['again','hard','easy']),answer:z.string().trim().min(1).max(3000),reviewMode:z.enum(['device-voice','text-assisted']).optional()}).strict(),
]);
type Call={db:D1Database;id:string};
async function digest(input:unknown){const bytes=new TextEncoder().encode(JSON.stringify(input));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')}
async function reserve(db:D1Database,userId:string,sessionId:string,commandId:string,operation:string,hash:string){
 const current=await db.prepare('SELECT operation,fingerprint,status FROM english_calls WHERE id=?').bind(commandId).first<{operation:string;fingerprint:string;status:string}>();
 if(current){if(current.operation!==operation||current.fingerprint!==hash)throw new CoachError(409,'同一请求不能更换内容。');if(current.status==='succeeded')return false;throw new CoachError(409,'请求正在处理或结果未确认，请先读取记录，再使用新请求重试。')}
 const now=Date.now(),utcStart=new Date().setUTCHours(0,0,0,0);
 await db.prepare("UPDATE english_calls SET status='failed',error_code='expired',finished_at=? WHERE user_id=? AND status='running' AND created_at<?").bind(now,userId,now-120000).run();
 const saved=await db.prepare(`INSERT INTO english_calls(id,user_id,session_id,operation,fingerprint,status,created_at) SELECT ?,?,?,?,?,'running',? WHERE
  (SELECT count(*) FROM english_calls WHERE user_id=? AND created_at>=?)<20 AND
  (SELECT count(*) FROM english_calls WHERE session_id=?)<10 AND
  NOT EXISTS(SELECT 1 FROM english_calls WHERE user_id=? AND status='running') ON CONFLICT(id) DO NOTHING`)
  .bind(commandId,userId,sessionId,operation,hash,now,userId,utcStart,sessionId,userId).run();
 if(!saved.meta.changes)throw new CoachError(429,'英语语音或对话请求已达次数上限，或另一个请求仍在处理。请稍后再试。');
 return true;
}
async function callDone(db:D1Database,id:string,requestId:string|null,model:string){await db.prepare("UPDATE english_calls SET status='succeeded',request_id=?,model=?,finished_at=? WHERE id=? AND status='running'").bind(requestId,model,Date.now(),id).run()}
async function callFailed(call:Call|null,error:unknown){if(!call)return;await call.db.prepare("UPDATE english_calls SET status='failed',error_code=?,finished_at=? WHERE id=? AND status='running'").bind(error instanceof AIServiceError?error.code:'interrupted',Date.now(),call.id).run().catch(()=>{})}
async function getTurn(db:D1Database,sessionId:string,turnId:string){const t=await db.prepare('SELECT * FROM english_turns WHERE id=? AND session_id=?').bind(turnId,sessionId).first<TurnRow>();if(!t)throw new CoachError(404,'找不到这轮回答。');return t}

export async function GET(request:Request){try{
 const {db,user,dataRevision}=await context(request),url=new URL(request.url),sessionId=url.searchParams.get('sessionId');
 if(sessionId){const p=await ownProfile(db,user.userId,uuid.parse(url.searchParams.get('profileId'))),s=await ownSession(db,p.id,uuid.parse(sessionId)),commandId=url.searchParams.get('commandId');
  const call=commandId?await db.prepare('SELECT operation,status FROM english_calls WHERE id=? AND user_id=? AND session_id=?').bind(uuid.parse(commandId),user.userId,s.id).first<{operation:string;status:string}>():null;
  return reply({session:await sessionView(db,s),capabilities:capabilities(env),dataRevision,...(commandId?{receipt:{commandId,status:call?.status??'not-found',operation:call?.operation??null}}:{})})}
 const p=await db.prepare('SELECT * FROM english_profiles WHERE user_id=?').bind(user.userId).first<import('@/lib/english/server').ProfileRow>();
 const sessions=p?await db.prepare('SELECT id,scenario_id,difficulty,status,created_at,help,listening_result,(SELECT count(*) FROM english_turns WHERE session_id=english_sessions.id) AS turns,(SELECT feedback FROM english_turns WHERE session_id=english_sessions.id AND feedback IS NOT NULL ORDER BY sequence DESC LIMIT 1) AS last_feedback FROM english_sessions WHERE profile_id=? ORDER BY created_at DESC LIMIT 40').bind(p.id).all<{id:string;scenario_id:string;difficulty:string;status:string;created_at:number;help:string;listening_result:string|null;turns:number;last_feedback:string|null}>():{results:[]};
 const attempted=p?await db.prepare('SELECT DISTINCT scenario_id FROM english_sessions WHERE profile_id=?').bind(p.id).all<{scenario_id:string}>():{results:[]};
 const unfinished=p?await db.prepare("SELECT id,scenario_id,status FROM english_sessions WHERE profile_id=? AND status!='finished' ORDER BY created_at DESC LIMIT 1").bind(p.id).first<{id:string;scenario_id:string;status:'listening'|'speaking'}>():null;
 const now=Date.now();
 const reviews=p?await db.prepare('SELECT id,kind,due_at,revision,stage,payload FROM english_reviews WHERE profile_id=? ORDER BY due_at LIMIT 50').bind(p.id).all<{id:string;kind:string;due_at:number;revision:number;stage:number;payload:string}>():{results:[]};
 const dueReviews=p?await db.prepare('SELECT count(*) AS n FROM english_reviews WHERE profile_id=? AND due_at<=?').bind(p.id,now).first<{n:number}>():null;
 const delayedListening=p?await db.prepare("SELECT count(CASE WHEN e.objective_correct=1 AND e.review_mode='device-voice' THEN 1 END) AS deviceVoiceCorrect,count(CASE WHEN e.objective_correct=1 AND e.review_mode='text-assisted' THEN 1 END) AS textAssistedCorrect FROM english_review_events e JOIN english_reviews r ON r.id=e.item_id AND r.profile_id=e.profile_id WHERE e.profile_id=? AND r.kind='listening'").bind(p.id).first<{deviceVoiceCorrect:number;textAssistedCorrect:number}>():null;
 const progress=p?await englishProgressReport(db,p.id):emptyEnglishProgress();
 const count=await db.prepare('SELECT count(*) AS n FROM english_calls WHERE user_id=? AND created_at>=?').bind(user.userId,new Date().setUTCHours(0,0,0,0)).first<{n:number}>();
 return reply({profile:p?publicProfile(p):null,scenarios:englishScenarios.map(s=>({id:s.id,scene:s.scene,difficulty:s.difficulty,title:s.title,goal:s.goal,version:s.version})),
  sessions:sessions.results.map(s=>{const result=s.listening_result?JSON.parse(s.listening_result) as EnglishListeningResult:null,help=JSON.parse(s.help) as EnglishHelp,feedback=s.last_feedback?JSON.parse(s.last_feedback) as EnglishDialogueFeedback:null;return {id:s.id,scenarioId:s.scenario_id,difficulty:s.difficulty,status:s.status,createdAt:s.created_at,listeningCorrect:result?.correct??null,listeningTotal:result?.total??null,listeningAssisted:result?result.assisted||help.deviceVoice:null,turns:s.turns,lastTaskStatus:feedback?.taskStatus??null}}),attemptedScenarioIds:attempted.results.map(s=>s.scenario_id),unfinishedSession:unfinished?{id:unfinished.id,scenarioId:unfinished.scenario_id,status:unfinished.status}:null,
  reviews:reviews.results.map(row=>reviewRow(row,now)),dueReviews:dueReviews?.n??0,delayedListening:{deviceVoiceCorrect:delayedListening?.deviceVoiceCorrect??0,textAssistedCorrect:delayedListening?.textAssistedCorrect??0},progress,capabilities:capabilities(env),dailyCalls:{used:count?.n??0,limit:20},dataRevision,
  notice:'基础／进阶只是练习难度选择；材料为 AI 辅助原创，未经过英语教师人工审核。练习记录不是正式语言能力测评。'});
}catch(e){return failure(e)}}

export async function POST(request:Request){let active:Call|null=null;try{
 const {db,user}=await context(request),input=actions.parse(await readBody(request,2700000)),now=Date.now();
 if(input.action==='profile'){
  const old=await db.prepare('SELECT * FROM english_profiles WHERE user_id=?').bind(user.userId).first<import('@/lib/english/server').ProfileRow>();
  if(!old){await db.prepare('INSERT INTO english_profiles(id,user_id,daily_minutes,revision,last_command,created_at,updated_at) VALUES(?,?,?,0,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(input.profileId,user.userId,input.dailyMinutes,input.commandId,now,now).run()}
  else if(old.last_command!==input.commandId){if(input.profileId!==old.id||input.expectedRevision!==old.revision)throw new CoachError(409,'档案已在其他页面更新，请刷新。');const result=await db.prepare('UPDATE english_profiles SET daily_minutes=?,revision=revision+1,last_command=?,updated_at=? WHERE id=? AND user_id=? AND revision=?').bind(input.dailyMinutes,input.commandId,now,old.id,user.userId,old.revision).run();if(!result.meta.changes)throw new CoachError(409,'档案已更新，请刷新。')}
  const p=await db.prepare('SELECT * FROM english_profiles WHERE user_id=?').bind(user.userId).first<import('@/lib/english/server').ProfileRow>();if(!p||p.id!==input.profileId||p.last_command!==input.commandId||p.daily_minutes!==input.dailyMinutes)throw new CoachError(409,'档案已经存在或请求内容不一致，请刷新。');return reply({profile:publicProfile(p)});
 }
 const p=await ownProfile(db,user.userId,input.profileId);
 if(input.action==='review'){
  const row=await db.prepare('SELECT * FROM english_reviews WHERE id=? AND profile_id=?').bind(input.itemId,p.id).first<{revision:number;stage:number;due_at:number;kind:string;payload:string}>();if(!row)throw new CoachError(404,'找不到此复习项。');
  if(row.kind!=='listening'&&input.reviewMode)throw new CoachError(400,'此复习项不需要听力辅助方式。');
  const reviewMode=row.kind==='listening'?input.reviewMode??null:null;
  const old=await db.prepare('SELECT grade,answer,review_mode,previous_revision FROM english_review_events WHERE id=? AND item_id=? AND profile_id=?').bind(input.eventId,input.itemId,p.id).first<{grade:string;answer:string|null;review_mode:string|null;previous_revision:number}>();if(old){if(old.grade!==input.grade||old.answer!==input.answer||old.review_mode!==reviewMode||old.previous_revision!==input.revision)throw new CoachError(409,'同一复习请求不能更换答案、辅助方式或评价。');return reply({ok:true,replayed:true})}
  if(row.revision!==input.revision)throw new CoachError(409,'复习状态已更新，请重新读取。');
  if(row.due_at>now)throw new CoachError(409,'这条复习尚未到期，请到期后再作答。');
  const payload=JSON.parse(row.payload) as {options?:string[];answer:string};
  if(row.kind==='listening'&&(!payload.options||!payload.options.includes(input.answer)))throw new CoachError(400,'请选择本次复习题的有效答案。');
  const objectiveCorrect=row.kind==='listening'?input.answer===payload.answer:null;
  if(objectiveCorrect===false&&input.grade!=='again')throw new CoachError(400,'本次听辨答案与正确答案不符，请标记为还需练习。');
  const nextStage=input.grade==='again'?0:input.grade==='hard'?Math.max(1,row.stage):Math.min(5,row.stage+1),days=[0,1,3,7,14,30][nextStage],nextDue=now+(input.grade==='again'?600000:days*86400000);
  const results=await db.batch([
   db.prepare('UPDATE english_reviews SET stage=?,due_at=?,revision=revision+1 WHERE id=? AND profile_id=? AND revision=?').bind(nextStage,nextDue,input.itemId,p.id,input.revision),
   db.prepare('INSERT INTO english_review_events(id,item_id,profile_id,grade,answer,review_mode,objective_correct,previous_revision,next_stage,next_due_at,occurred_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM english_reviews WHERE id=? AND profile_id=? AND revision=?) ON CONFLICT(id) DO NOTHING').bind(input.eventId,input.itemId,p.id,input.grade,input.answer,reviewMode,objectiveCorrect===null?null:Number(objectiveCorrect),input.revision,nextStage,nextDue,now,input.itemId,p.id,input.revision+1),
  ]);if(!results[0].meta.changes||!results[1].meta.changes)throw new CoachError(409,'复习已在其他页面更新，请重新读取。');return reply({ok:true,nextDue});
 }
 if(input.action==='start'){
  const s=englishScenario(input.scenarioId);if(!s)throw new CoachError(404,'找不到这个英语场景。');
  await db.prepare("INSERT INTO english_sessions(id,profile_id,scenario_id,scenario_version,difficulty,snapshot,status,answers,help,revision,consent_version,created_at) SELECT ?,?,?,?,?,?,'listening','{}',?,0,?,? WHERE (SELECT count(*) FROM english_sessions WHERE profile_id=? AND created_at>=?)<50 ON CONFLICT(id) DO NOTHING")
   .bind(input.sessionId,p.id,s.id,s.version,s.difficulty,JSON.stringify(s),JSON.stringify(initialHelp()),'not-obtained',now,p.id,now-86400000).run();
  const row=await ownSession(db,p.id,input.sessionId);if(row.scenario_id!==s.id||row.scenario_version!==s.version)throw new CoachError(409,'同一练习请求不能更换场景。');return reply({session:await sessionView(db,row),capabilities:capabilities(env)});
 }
 const row=await ownSession(db,p.id,input.sessionId),s=JSON.parse(row.snapshot) as EnglishScenario;
 const snapshot=()=>sessionView(db,row).then(session=>reply({session,capabilities:capabilities(env)}));
 if(input.action==='assist'){
  if(input.kind==='hint'?row.status!=='speaking':row.status!=='listening')throw new CoachError(409,'当前阶段不能使用此辅助。');
  if(row.last_command===input.commandId)return snapshot();
  if(row.revision!==input.revision)throw new CoachError(409,'练习已更新，请读取最新状态。');
  const help=JSON.parse(row.help) as EnglishHelp;
  if(input.kind==='play'){
   if(input.segmentId&&!s.clip.some(c=>c.id===input.segmentId))throw new CoachError(400,'找不到音频片段。');
   help.plays=Math.min(99,help.plays+1);if(input.segmentId&&!help.segments.includes(input.segmentId))help.segments.push(input.segmentId);help.deviceVoice ||= Boolean(input.deviceVoice);
  }else if(input.kind==='slow')help.slow=true;else if(input.kind==='text')help.text=true;else if(input.kind==='translation')help.translation=true;
  else {const turns=await db.prepare("SELECT sequence,state,feedback FROM english_turns WHERE session_id=? ORDER BY sequence DESC LIMIT 1").bind(row.id).first<{sequence:number;state:string;feedback:string|null}>();if(!turns||turns.state!=='replied'||!turns.feedback||turns.sequence>=2)throw new CoachError(409,'请先完成追问，再查看下一轮提示。');help.speakingHints??=[];if(!help.speakingHints.includes(turns.sequence+1))help.speakingHints.push(turns.sequence+1)}
  const changed=await db.prepare('UPDATE english_sessions SET help=?,revision=revision+1,last_command=? WHERE id=? AND profile_id=? AND revision=? AND status=?').bind(JSON.stringify(help),input.commandId,row.id,p.id,input.revision,input.kind==='hint'?'speaking':'listening').run();if(!changed.meta.changes)throw new CoachError(409,'辅助记录未保存，请重试。');return reply({session:await sessionView(db,await ownSession(db,p.id,row.id))});
 }
 if(input.action==='listen'){
  if(row.status!=='listening'){if(row.last_command===input.commandId&&row.answers===JSON.stringify(input.answers))return snapshot();throw new CoachError(409,'听力已提交，不能覆盖首次作答。')}
  if(row.revision!==input.revision)throw new CoachError(409,'练习已更新，请读取最新状态。');
  const help=JSON.parse(row.help) as EnglishHelp;if(s.clip.some(clip=>!help.segments.includes(clip.id)))throw new CoachError(400,'请先听完全部句子，再提交第一次听辨答案。');
  if(Object.keys(input.answers).length!==s.questions.length||s.questions.some(q=>!Number.isInteger(input.answers[q.id])||input.answers[q.id]<0||input.answers[q.id]>=q.options.length))throw new CoachError(400,'请完成本场景全部听力问题。');
  const result=listeningResult(s,input.answers,help),statements=[db.prepare("UPDATE english_sessions SET answers=?,listening_result=?,status='speaking',submitted_at=?,revision=revision+1,last_command=? WHERE id=? AND profile_id=? AND revision=? AND status='listening'").bind(JSON.stringify(input.answers),JSON.stringify(result),now,input.commandId,row.id,p.id,input.revision)];
  for(const item of result.items.filter(i=>!i.correct)){
   const q=s.questions.find(q=>q.id===item.id)!,alt=alternativeQuestion(s,item.focus);
   const payload={source:s.title,prompt:alt?.question.prompt??q.prompt,answer:alt?.question.options[alt.question.answer]??q.options[q.answer],alternativeScenarioId:alt?.scenario.id??s.id,focus:item.focus,userAnswer:q.options[input.answers[q.id]],knowledge:item.why,clip:(alt?.scenario??s).clip.map(segment=>segment.text).join(' '),options:alt?.question.options??q.options,language:'en-US',skill:'listening',taskVersion:row.scenario_version,sourceScenarioId:row.scenario_id,sourceItemId:q.id,alternativeScenarioVersion:alt?.scenario.version??row.scenario_version};
   statements.push(db.prepare("INSERT INTO english_reviews(id,profile_id,session_id,turn_id,kind,payload,stage,due_at,revision,created_at) SELECT ?,?,?,NULL,?,?,0,?,0,? WHERE EXISTS(SELECT 1 FROM english_sessions WHERE id=? AND last_command=? AND status='speaking') ON CONFLICT(id) DO NOTHING").bind(`listen:${row.id}:${q.id}`,p.id,row.id,'listening',JSON.stringify(payload),now+86400000,now,row.id,input.commandId));
  }
  const saved=await db.batch(statements);if(!saved[0].meta.changes)throw new CoachError(409,'答案未保存，请重试原请求。');
  return reply({session:await sessionView(db,await ownSession(db,p.id,row.id))});
 }
 if(input.action==='speak'){
  if(row.status==='finished')throw new CoachError(409,'这次练习已结束。');
  const clip=s.clip.find(c=>c.id===input.segmentId);if(!clip)throw new CoachError(404,'找不到这段听力材料。');
  const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'英语语音合成服务尚未配置。可以使用明确标注的设备朗读。');
  const hash=await digest(input),fresh=await reserve(db,user.userId,row.id,input.commandId,'speak',hash);if(!fresh)throw new CoachError(409,'音频不长期保存，请使用新请求重新播放。');active={db,id:input.commandId};
  const audio=await createAIService(config).speak(clip.text,'en-US');await callDone(db,input.commandId,audio.requestId,audio.model);active=null;
  return new Response(audio.audio.slice().buffer as ArrayBuffer,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'private, no-store','X-Parcours-Voice':'AI-generated'}});
 }
 if(input.action==='finish'){
  if(row.status==='finished')return snapshot();
  if(row.status!=='speaking')throw new CoachError(409,'请先完成听力练习。');
  const progress=await db.prepare("SELECT count(*) AS total,sum(CASE WHEN state!='replied' THEN 1 ELSE 0 END) AS pending FROM english_turns WHERE session_id=?").bind(row.id).first<{total:number;pending:number|null}>();
  if(progress?.pending)throw new CoachError(409,'请先确认或完成当前回答。');
  if((progress?.total??0)<3)throw new CoachError(409,'请完成回应、追问和重试三轮后再结束；现有回答已保存，可以稍后继续。');
  await db.prepare("UPDATE english_sessions SET status='finished',ended_at=? WHERE id=? AND profile_id=? AND status='speaking'").bind(now,row.id,p.id).run();return reply({session:await sessionView(db,await ownSession(db,p.id,row.id))});
 }
 if(input.action==='bookmark'){
  const t=await getTurn(db,row.id,input.turnId),feedback=t.feedback?JSON.parse(t.feedback) as EnglishDialogueFeedback&{feedbackVersion?:string}:null,point=feedback?.points[input.pointIndex];
  if(!point||!['error','natural','task'].includes(point.kind)||!point.suggestion?.trim())throw new CoachError(400,'此反馈没有可复习的具体表达。');
  const alt=englishScenarios.find(candidate=>candidate.scene===transferScene[s.scene]&&candidate.difficulty===s.difficulty)??s;
  const payload={source:s.title,prompt:`新情境 · ${alt.title}：${alt.role} 说 “${alt.opening}”。任务：${alt.task}。请用自己的话回应，再检查自己是否重犯这个问题：${point.explanation}`,answer:point.suggestion,alternativeScenarioId:alt.id,focus:point.kind,userAnswer:t.accepted_text??t.original_transcript,knowledge:point.explanation,language:'en-US',skill:'speaking',taskVersion:row.scenario_version,sourceScenarioId:row.scenario_id,sourceItemId:t.id,alternativeScenarioVersion:alt.version,...(feedback?.feedbackVersion?{feedbackVersion:feedback.feedbackVersion}:{})};
  await db.prepare('INSERT INTO english_reviews(id,profile_id,session_id,turn_id,kind,payload,stage,due_at,revision,created_at) VALUES(?,?,?,?,?,?,0,?,0,?) ON CONFLICT(id) DO NOTHING').bind(`turn:${t.id}:${input.pointIndex}`,p.id,row.id,t.id,point.kind==='task'?'task':'expression',JSON.stringify(payload),now+86400000,now).run();return reply({ok:true});
 }
 if(row.status!=='speaking')throw new CoachError(409,'当前练习尚未进入口语环节或已经结束。');
 if(input.action==='text'||input.action==='audio'){
  const previous=await db.prepare('SELECT * FROM english_turns WHERE id=?').bind(input.turnId).first<TurnRow>();
  if(previous){if(previous.session_id!==row.id||previous.input_kind!==input.action||input.action==='text'&&previous.original_transcript!==input.text)throw new CoachError(409,'同一轮回答不能更换内容。');return snapshot()}
  const recent=await db.prepare('SELECT count(*) AS n,sum(CASE WHEN state!=\'replied\' THEN 1 ELSE 0 END) AS pending FROM english_turns WHERE session_id=?').bind(row.id).first<{n:number;pending:number|null}>();if(recent!.n>=3||recent!.pending)throw new CoachError(409,'请先完成上一轮；每次最多三轮回答。');
  if(input.action==='text'){
   await db.prepare("INSERT INTO english_turns(id,session_id,sequence,input_kind,original_transcript,accepted_text,revision,state,recording_ms,created_at) SELECT ?,?,?, 'text',?,NULL,0,'draft',0,? WHERE EXISTS(SELECT 1 FROM english_sessions WHERE id=? AND profile_id=? AND status='speaking') ON CONFLICT(id) DO NOTHING").bind(input.turnId,row.id,recent!.n,input.text,now,row.id,p.id).run();return reply({session:await sessionView(db,await ownSession(db,p.id,row.id))});
  }
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio)||input.audio.length%4)throw new CoachError(400,'录音格式无效。');
  const audio=Uint8Array.from(atob(input.audio),ch=>ch.charCodeAt(0)),duration=inspectWav(audio).durationMs;
  const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'语音转写服务尚未配置。录音仍在本机页面，可稍后重试。');
  const hash=await digest(input),fresh=await reserve(db,user.userId,row.id,input.commandId,'audio',hash);if(!fresh)return snapshot();active={db,id:input.commandId};
  const consentSaved=await db.prepare("UPDATE english_sessions SET consent_version=? WHERE id=? AND profile_id=? AND status='speaking'").bind(ENGLISH_CONSENT_VERSION,row.id,p.id).run();
  if(!consentSaved.meta.changes)throw new CoachError(409,'录音处理说明未能记录，请读取状态后重试。');
  const transcript=await createAIService(config).transcribe(new Blob([audio.slice().buffer as ArrayBuffer],{type:'audio/wav'}),'en-US');
  const saved=await db.prepare("INSERT INTO english_turns(id,session_id,sequence,input_kind,original_transcript,accepted_text,revision,state,recording_ms,created_at) SELECT ?,?,?,'audio',?,NULL,0,'draft',?,? WHERE EXISTS(SELECT 1 FROM english_calls WHERE id=? AND status='running') AND EXISTS(SELECT 1 FROM english_sessions WHERE id=? AND profile_id=? AND status='speaking') ON CONFLICT(id) DO NOTHING").bind(input.turnId,row.id,recent!.n,transcript.text,duration,now,input.commandId,row.id,p.id).run();if(!saved.meta.changes)throw new CoachError(409,'转写完成但保存未确认，请读取记录。');await callDone(db,input.commandId,transcript.requestId,transcript.model);active=null;return reply({session:await sessionView(db,await ownSession(db,p.id,row.id))});
 }
 if(input.action==='confirm'){
  const t=await getTurn(db,row.id,input.turnId);if(t.accepted_text===input.text&&t.revision===input.revision+1&&t.state==='ready')return snapshot();
  const changed=await db.prepare("UPDATE english_turns SET accepted_text=?,revision=revision+1,state='ready' WHERE id=? AND session_id=? AND revision=? AND state IN ('draft','ready')").bind(input.text,t.id,row.id,input.revision).run();if(!changed.meta.changes)throw new CoachError(409,'转写确认未保存，请重新读取。');return reply({session:await sessionView(db,await ownSession(db,p.id,row.id))});
 }
 const config=aiConfig(env);if(!config)throw new AIServiceError('not_configured',false,'英语语音与 AI 对话服务尚未配置。现有输入仍保留。');
 if(input.action==='respond'){
  const t=await getTurn(db,row.id,input.turnId);if(t.state==='replied')return snapshot();if(t.state!=='ready'||t.revision!==input.revision||!t.accepted_text)throw new CoachError(409,'请先确认转写，再请求追问与反馈。');
  const hash=await digest(input),fresh=await reserve(db,user.userId,row.id,input.commandId,'respond',hash);if(!fresh)return snapshot();active={db,id:input.commandId};
  const turns=await db.prepare("SELECT * FROM english_turns WHERE session_id=? AND state IN ('ready','replied') ORDER BY sequence").bind(row.id).all<TurnRow>();
  const history=turns.results.flatMap(turn=>[{role:'user' as const,text:turn.accepted_text!},...(turn.feedback?[{role:'assistant' as const,text:(JSON.parse(turn.feedback) as {reply:string}).reply}]:[])]);
  const result=await createAIService(config).englishDialogue({difficulty:s.difficulty,scenario:{role:s.role,goal:s.goal,task:s.task,opening:s.opening,sourceClip:s.clip.map(segment=>segment.text),requiredActions:s.requiredActions,followUps:s.followUps},turns:history});
  const changed=await db.prepare("UPDATE english_turns SET feedback=?,state='replied' WHERE id=? AND session_id=? AND revision=? AND state='ready' AND EXISTS(SELECT 1 FROM english_calls WHERE id=? AND status='running')").bind(JSON.stringify({...result.feedback,feedbackVersion:ENGLISH_FEEDBACK_VERSION}),t.id,row.id,t.revision,input.commandId).run();if(!changed.meta.changes)throw new CoachError(409,'回答已变化；反馈没有覆盖现有记录。');await callDone(db,input.commandId,result.requestId,result.model);active=null;return reply({session:await sessionView(db,await ownSession(db,p.id,row.id))});
 }
 throw new CoachError(400,'不支持的操作。');
}catch(e){await callFailed(active,e);if(e instanceof RecordingError)return reply({error:e.message,code:'recording_invalid'},400);if(e instanceof AIServiceError)return reply({error:e.message,code:e.code,retryable:e.retryable},e.code==='quota'?429:e.code==='invalid_input'||e.code==='unintelligible'?422:503);return failure(e)}}
