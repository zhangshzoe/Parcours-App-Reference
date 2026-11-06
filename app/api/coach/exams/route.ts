import {sealingExposures} from '@/lib/coach/exam-exposure';
import {z} from 'zod';
import {env} from 'cloudflare:workers';
import {aiCapabilities} from '@/lib/coach/ai';
import {validateExamSpeaking} from '@/lib/coach/exam-responses';
import {examAudioState,validateExamListening} from '@/lib/coach/exam-audio';
import {context,readBody,ownProfile,reply,failure,CoachError} from '@/lib/coach/server';
import {officialExamOverview} from '@/lib/coach/exam-overview';
import {examPapers,examRule} from '@/lib/coach/exam-catalog';
import {publicPaper,examView,ownExam,expireExam,validateAnswers,scoreExam,commandHash,type ExamRow} from '@/lib/coach/exams';
import type {CoachGoal} from '@/lib/coach/types';
import type {ExamAnswers,ExamPaper,ExamStudyHelp,ExamStudyDetails} from '@/lib/coach/exam-types';

const studyDeadline=253402300799000; // Existing non-null column; study attempts do not expire.
function details(row:ExamRow):ExamStudyDetails|undefined{
 if(row.mode!=='study')return;
 const paper=JSON.parse(row.snapshot) as ExamPaper,help=JSON.parse(row.help) as ExamStudyHelp,result:ExamStudyDetails={};
 for(const item of paper.items){const used=help[item.id];if(!used)continue;const revealed:ExamStudyDetails[string]={};
  if(used.hint)revealed.hint=item.knowledge;
  if(used.transcript&&item.audio)revealed.transcript=item.audio.text;
  if(used.translation&&item.audio)revealed.translation=item.audio.translation;
  if(used.deviceVoice&&item.audio)revealed.voiceText=item.audio.text;
  if(used.reveal){if(item.answer!==undefined)revealed.answer=item.answer;if(item.explanation)revealed.explanation=item.explanation;if(item.rubric)revealed.rubric=item.rubric}
  result[item.id]=revealed;
 }
 return result;
}
async function response(db:D1Database,row:ExamRow,now:number){return {attempt:{...examView(row),studyDetails:details(row),audioState:await examAudioState(db,row)},serverTime:now,capabilities:aiCapabilities(env)}}

export async function GET(request:Request){try{
 const {db,user}=await context(request),url=new URL(request.url),p=await ownProfile(db,user.userId,url.searchParams.get('profileId')??'');
 const now=Date.now(),id=url.searchParams.get('attemptId');
 if(id)return reply(await response(db,await expireExam(db,await ownExam(db,p.id,id),now),now));
 const {results}=await db.prepare('SELECT * FROM coach_exam_attempts WHERE profile_id = ? ORDER BY started_at DESC LIMIT 100').bind(p.id).all<ExamRow>();
 const rows:ExamRow[]=[];for(const row of results)rows.push(await expireExam(db,row,now));
 const level=(JSON.parse(p.goal) as CoachGoal).level;
 return reply({papers:examPapers.filter(paper=>paper.language===p.language&&paper.level===level).map(publicPaper),
  attempts:rows.map(row=>{const paper:ExamPaper=JSON.parse(row.snapshot);return {id:row.id,title:paper.title,level:paper.level,kind:paper.kind,mode:row.mode,status:row.status,startedAt:row.started_at,deadlineAt:row.deadline_at}}),
  capabilities:aiCapabilities(env),rule:examRule(p.language,level),officialOverview:officialExamOverview(p.language,level),fullPaper:{status:'available',label:'非官方缩短训练卷',paperId:`exam-${p.language.slice(0,2)}-${level.toLowerCase()}-integrated`,notice:'听力 4 题、阅读 4 题、写作 1 项、口语 1 项。复用专项材料；不是完整官方模拟考试，不能换算官方成绩。真实语音和人工审核仍待验证。'},serverTime:now});
 }catch(e){return failure(e)}}
const base={profileId:z.string().uuid()};
const schema=z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('start'),paperId:z.string().max(120),attemptId:z.string().uuid(),mode:z.enum(['timed','study']).optional()}).strict(),
 z.object({...base,action:z.literal('assist'),attemptId:z.string().uuid(),itemId:z.string().max(120),commandId:z.string().uuid(),revision:z.number().int().min(0),kind:z.enum(['hint','transcript','translation','slow','replay','deviceVoice','reveal'])}).strict(),
 z.object({...base,action:z.enum(['save','submit']),attemptId:z.string().uuid(),commandId:z.string().uuid(),revision:z.number().int().min(0),answers:z.record(z.union([z.number().int(),z.string().max(6000)]))}).strict(),
 z.object({...base,action:z.literal('bookmark'),attemptId:z.string().uuid(),itemId:z.string().max(120)}).strict(),
]);
export async function POST(request:Request){try{
 const {db,user}=await context(request),input=schema.parse(await readBody(request)),p=await ownProfile(db,user.userId,input.profileId),now=Date.now();
 if(input.action==='start'){
  const mode=input.mode??'timed';
  const existing=await db.prepare('SELECT * FROM coach_exam_attempts WHERE id = ?').bind(input.attemptId).first<ExamRow>();
  if(existing){if(existing.profile_id!==p.id||existing.paper_id!==input.paperId||existing.mode!==mode)throw new CoachError(409,'此开始请求已用于其他训练。');return reply(await response(db,await expireExam(db,existing,now),now))}
  const paper=examPapers.find(paper=>paper.id===input.paperId&&paper.language===p.language&&paper.level===(JSON.parse(p.goal) as CoachGoal).level);
  if(!paper)throw new CoachError(404,'这份训练不属于当前语言和等级。');
  if(mode==='study'&&(p.language!=='fr-FR'||paper.kind==='integrated'))throw new CoachError(400,'学习模式本轮仅支持法语 A1/A2 的单项任务。');
  if(mode==='timed'&&paper.items.some(i=>i.skill==='listening'||i.skill==='speaking')&&!aiCapabilities(env).configured)throw new CoachError(503,'语音服务待配置，暂不能开始包含听力或口语的新训练。');
  // Any earlier opened paper counts as exposure, even if abandoned before submission.
  const previous=await db.prepare("SELECT DISTINCT json_extract(j.value,'$.id') AS item_id FROM coach_exam_attempts a,json_each(a.snapshot,'$.items') j WHERE a.profile_id=?").bind(p.id).all<{item_id:string}>();
  const familiar=await db.prepare('SELECT lesson_id AS source FROM coach_attempts WHERE profile_id=? UNION SELECT material_id AS source FROM coach_listening_attempts WHERE profile_id=?').bind(p.id,p.id).all<{source:string}>();
  const seen=new Set(previous.results.map(r=>r.item_id)),sources=new Set(familiar.results.map(r=>r.source));
  const exposed=paper.items.filter(i=>seen.has(i.id)||(i.audio&&(sources.has(i.audio.sourceLessonId)||sources.has(i.audio.sourceMaterialId)))).map(i=>i.id);
  await db.prepare("INSERT INTO coach_exam_attempts (id,profile_id,paper_id,snapshot,answers,exposed_item_ids,mode,help,status,revision,started_at,deadline_at) SELECT ?,?,?,?,'{}',?,?,?,'active',0,?,? WHERE (SELECT count(*) FROM coach_exam_attempts WHERE profile_id = ? AND started_at >= ?) < 30 ON CONFLICT(id) DO NOTHING").bind(input.attemptId,p.id,paper.id,JSON.stringify(paper),JSON.stringify(exposed),mode,'{}',now,mode==='study'?studyDeadline:now+paper.durationSeconds*1000,p.id,now-86400000).run();
  const row=await db.prepare('SELECT * FROM coach_exam_attempts WHERE id = ?').bind(input.attemptId).first<ExamRow>();
  if(!row)throw new CoachError(429,'今天创建的训练较多，请先继续已有训练。');
  if(row.profile_id!==p.id||row.paper_id!==paper.id||row.mode!==mode)throw new CoachError(409,'此开始请求已用于其他训练。');
  return reply(await response(db,row,now));
 }
 let row=await expireExam(db,await ownExam(db,p.id,input.attemptId),now);
 const paper:ExamPaper=JSON.parse(row.snapshot);
 if(input.action==='assist'){
  if(row.mode!=='study'||row.status!=='active')throw new CoachError(409,'此辅助只适用于尚未完成的学习模式。');
  const item=paper.items.find(i=>i.id===input.itemId);if(!item)throw new CoachError(404,'找不到本题。');
  if(['transcript','translation','slow','replay','deviceVoice'].includes(input.kind)&&!item.audio)throw new CoachError(400,'本题没有听力材料。');
  const savedAnswer=(JSON.parse(row.answers) as Record<string,number|string>)[item.id];
  if(input.kind==='reveal'&&(savedAnswer===undefined||typeof savedAnswer==='string'&&!savedAnswer.trim()))throw new CoachError(409,'请先保存本题答案，再查看即时解析。');
  const hash=await commandHash(`assist:${input.kind}:${item.id}`,input.revision,{});
  const old=await db.prepare('SELECT attempt_id,fingerprint FROM coach_exam_commands WHERE id=?').bind(input.commandId).first<{attempt_id:string;fingerprint:string}>();
  if(old){if(old.attempt_id!==row.id||old.fingerprint!==hash)throw new CoachError(409,'同一辅助请求不能更换内容。');return reply(await response(db,row,now))}
  if(row.revision!==input.revision)throw new CoachError(409,'学习记录已更新，请先读取。');
  const help=JSON.parse(row.help) as ExamStudyHelp,used=help[item.id]??{};help[item.id]=used;
  if(input.kind==='replay'&&!used.deviceVoice&&!(await examAudioState(db,row))[item.audio!.key]?.played)throw new CoachError(409,'请先听完这段材料，再记录重播。');
  if(input.kind==='hint')used.hint=true;else if(input.kind==='transcript')used.transcript=true;else if(input.kind==='translation')used.translation=true;else if(input.kind==='slow')used.slow=true;else if(input.kind==='replay')used.extraPlays=Math.min(99,(used.extraPlays??0)+1);else if(input.kind==='deviceVoice')used.deviceVoice=true;else used.reveal=true;
  const operations=await db.batch([
   db.prepare("INSERT INTO coach_exam_commands(id,attempt_id,fingerprint,previous_revision,created_at) SELECT ?,id,?,?,? FROM coach_exam_attempts WHERE id=? AND profile_id=? AND mode='study' AND status='active' AND revision=? ON CONFLICT(id) DO NOTHING").bind(input.commandId,hash,input.revision,now,row.id,p.id,input.revision),
   db.prepare("UPDATE coach_exam_attempts SET help=?,revision=revision+1 WHERE id=? AND profile_id=? AND mode='study' AND status='active' AND revision=? AND EXISTS(SELECT 1 FROM coach_exam_commands WHERE id=? AND attempt_id=? AND fingerprint=?)").bind(JSON.stringify(help),row.id,p.id,input.revision,input.commandId,row.id,hash),
  ]);if(!operations[0].meta.changes||!operations[1].meta.changes)throw new CoachError(409,'辅助记录未保存，请重试。');
  row=await ownExam(db,p.id,row.id);return reply(await response(db,row,Date.now()));
 }
 if(input.action==='bookmark'){
  if(row.status==='active'&&(row.mode!=='study'||!(JSON.parse(row.help) as ExamStudyHelp)[input.itemId]?.reveal))throw new CoachError(409,'请先查看解析或提交训练，再收藏复习。');
  const item=paper.items.find(i=>i.id===input.itemId);
  if(!item||(item.skill!=='reading'&&item.skill!=='listening')||item.answer===undefined)throw new CoachError(400,'此题没有可加入复习的客观解析。');
  const savedAnswer=(JSON.parse(row.answers) as ExamAnswers)[item.id];
  const payload={target:`${item.passage??item.audio?.text}\n${item.options![item.answer]}`,zh:`${item.prompt}\n${item.explanation}`,lessonTitle:paper.title,language:paper.language,skill:item.skill,knowledge:item.knowledge,taskVersion:item.version,sourceAttemptId:row.id,sourceItemId:item.id,userAnswer:typeof savedAnswer==='number'?item.options?.[savedAnswer]??null:null};
  await db.prepare("INSERT INTO coach_review_items (id,profile_id,source_key,kind,payload,stage,due_at,revision,created_at) VALUES (?,?,?,'knowledge',?,0,?,0,?) ON CONFLICT(profile_id,source_key) DO NOTHING").bind(crypto.randomUUID(),p.id,`exam:${item.id}:v${item.version}`,JSON.stringify(payload),now,now).run();
  return reply({ok:true});
 }
 const answers=validateAnswers(paper,input.answers);await validateExamListening(db,row,paper,answers);await validateExamSpeaking(db,row,paper,answers);const hash=await commandHash(input.action,input.revision,answers);
 const existing=await db.prepare('SELECT * FROM coach_exam_commands WHERE id = ?').bind(input.commandId).first<{attempt_id:string;fingerprint:string}>();
 if(existing){if(existing.attempt_id!==row.id||existing.fingerprint!==hash)throw new CoachError(409,'同一保存请求不能更改内容。');return reply(await response(db,row,now))}
 if(row.status!=='active')throw new CoachError(409,'训练已提交或到时，不能再改变答案。请读取已保存的结果。');
 if(row.revision!==input.revision)throw new CoachError(409,'答案已在另一页面更新。请读取已保存版本后继续。');
 const exposed=await sealingExposures(db,row,paper);
 const submit=input.action==='submit',scored=submit?scoreExam(paper,answers,exposed):null;
 if(scored&&row.mode==='study')scored.notice='学习模式允许提示、原文、翻译和重复播放；本次仅用于自查，不作为首次独立作答或正式考试成绩。写作、口语仍未评分。';
 const result=scored?JSON.stringify(scored):null;
 await db.batch([
  db.prepare("INSERT INTO coach_exam_commands (id,attempt_id,fingerprint,previous_revision,created_at) SELECT ?,id,?,?,CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER) FROM coach_exam_attempts WHERE id = ? AND profile_id = ? AND revision = ? AND status = 'active' AND deadline_at > CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER) ON CONFLICT(id) DO NOTHING").bind(input.commandId,hash,input.revision,row.id,p.id,input.revision),
  db.prepare("UPDATE coach_exam_attempts SET answers = ?,exposed_item_ids = ?,revision = revision + 1,status = ?,submitted_at = CASE WHEN ? = 1 THEN (SELECT created_at FROM coach_exam_commands WHERE id = ?) ELSE NULL END,result = ? WHERE id = ? AND profile_id = ? AND revision = ? AND status = 'active' AND EXISTS (SELECT 1 FROM coach_exam_commands WHERE id = ? AND attempt_id = ? AND fingerprint = ? AND previous_revision = ? AND created_at < coach_exam_attempts.deadline_at)").bind(JSON.stringify(answers),JSON.stringify(exposed),submit?'submitted':'active',submit?1:0,input.commandId,result,row.id,p.id,input.revision,input.commandId,row.id,hash,input.revision),
 ]);
 const accepted=await db.prepare('SELECT attempt_id,fingerprint FROM coach_exam_commands WHERE id = ?').bind(input.commandId).first<{attempt_id:string;fingerprint:string}>();
 if(!accepted||accepted.attempt_id!==row.id||accepted.fingerprint!==hash)throw new CoachError(409,'保存未被接受，请读取最新的训练记录。');
 row=await expireExam(db,await ownExam(db,p.id,row.id),Date.now());
 return reply(await response(db,row,Date.now()));
 }catch(e){return failure(e)}}
