import {listeningEvidenceId} from './objective-evidence';
import {getCoachLesson} from './catalog';
import type {CoachLevel,CoachLanguage} from './types';
import type {ExamResult,ExamStudyHelp} from './exam-types';
import type {ListeningResult} from './listening-types';

type Objective={answered:number;correct:number;first:number;firstCorrect:number;firstIndependent:number;firstIndependentCorrect:number;repeated:number};
type WeakPoint={skill:'reading'|'listening';knowledge:string;wrong:number;answered:number};
type StudySkill='listening'|'reading'|'writing'|'speaking';
type StudyActivity={started:number;completed:number;savedAnswers:number;assistedAttempts:number};
export type ProgressReport={
 language:CoachLanguage;level:CoachLevel;asOf:number;
 courses:{text:number;complete:number};review:{saved:number;events:number;due:number;delayed:{attempts:number;transferAnswered:number;selfRatedEasy:number}};
 reading:Objective;listening:Objective;
 weakPoints:WeakPoint[];
 writing:{courseTexts:number;examTexts:number;textChatTurns:number};
 speaking:{recordings:number;recordingMs:number;repliedAudioTurns:number;finishedAudioConversations:number;examAnswers:number};
 feedback:{conversationTurns:number;examTasks:number};
 study:Record<StudySkill,StudyActivity>;
};
type Lesson={lesson_id:string;content_version:number;level:CoachLevel|null;topic:string|null;status:string;result:string|null;completed_at:number|null;full_completed_at:number|null;has_writing:number};
type Listen={material_id:string;level:CoachLevel;status:string;result:string|null;choices:string;submitted_at:number|null};
type Exam={level:CoachLevel;status:string;help:string;result:string|null;submitted_at:number|null};
type StudyRow={snapshot:string;answers:string;help:string;status:string};
type Event={skill:'reading'|'listening';id:string;at:number;correct:boolean;repeated:boolean;independent:boolean;knowledge:string|null};
const empty=():Objective=>({answered:0,correct:0,first:0,firstCorrect:0,firstIndependent:0,firstIndependentCorrect:0,repeated:0});
const emptyStudy=():StudyActivity=>({started:0,completed:0,savedAnswers:0,assistedAttempts:0});
export async function progressReport(db:D1Database,profile:{id:string;language:CoachLanguage},level:CoachLevel,now=Date.now()):Promise<ProgressReport>{
 const rows=await db.batch([
  db.prepare("SELECT lesson_id,content_version,json_extract(snapshot,'$.level') level,json_extract(snapshot,'$.topic') topic,status,result,completed_at,full_completed_at,length(trim(writing))>0 has_writing FROM coach_attempts WHERE profile_id=?").bind(profile.id),
  db.prepare("SELECT material_id,json_extract(snapshot,'$.level') level,status,result,json_extract(answers,'$.choices') choices,submitted_at FROM coach_listening_attempts WHERE profile_id=?").bind(profile.id),
  db.prepare("SELECT json_extract(snapshot,'$.level') level,status,help,result,submitted_at FROM coach_exam_attempts WHERE profile_id=? AND mode='timed'").bind(profile.id),
  db.prepare("SELECT count(*) recordings,COALESCE(sum(t.recording_ms),0) recording_ms,COALESCE(sum(t.state='replied'),0) replied FROM coach_turns t JOIN coach_conversations c ON c.id=t.conversation_id WHERE c.profile_id=? AND c.level=? AND t.input_kind='audio'").bind(profile.id,level),
  db.prepare("SELECT count(*) recordings,COALESCE(sum(r.recording_ms),0) recording_ms FROM coach_exam_recordings r JOIN coach_exam_attempts a ON a.id=r.attempt_id WHERE a.profile_id=? AND a.mode='timed' AND json_extract(a.snapshot,'$.level')=?").bind(profile.id,level),
  db.prepare("SELECT (SELECT count(*) FROM coach_turns t JOIN coach_conversations c ON c.id=t.conversation_id WHERE c.profile_id=? AND c.level=? AND t.input_kind='text') texts,(SELECT count(*) FROM coach_turns t JOIN coach_conversations c ON c.id=t.conversation_id WHERE c.profile_id=? AND c.level=? AND t.feedback IS NOT NULL) feedback,(SELECT count(*) FROM coach_conversations c WHERE c.profile_id=? AND c.level=? AND c.status='finished' AND EXISTS(SELECT 1 FROM coach_turns t WHERE t.conversation_id=c.id AND t.input_kind='audio' AND t.state='replied')) finished").bind(profile.id,level,profile.id,level,profile.id,level),
  db.prepare("SELECT count(*) n FROM coach_exam_feedback f JOIN coach_exam_attempts a ON a.id=f.attempt_id WHERE a.profile_id=? AND a.mode='timed' AND json_extract(a.snapshot,'$.level')=?").bind(profile.id,level),
  db.prepare('SELECT (SELECT count(*) FROM coach_review_items WHERE profile_id=?) saved,(SELECT count(*) FROM coach_review_items WHERE profile_id=? AND due_at<=?) due,(SELECT count(*) FROM coach_review_events WHERE profile_id=?) events').bind(profile.id,profile.id,now,profile.id),
  db.prepare("SELECT snapshot,answers,help,status FROM coach_exam_attempts WHERE profile_id=? AND mode='study'").bind(profile.id),
  db.prepare("SELECT count(*) attempts,COALESCE(sum(CASE WHEN length(trim(COALESCE(e.response,'')))>0 AND length(trim(COALESCE(e.transfer_prompt,'')))>0 THEN 1 ELSE 0 END),0) transferAnswered,COALESCE(sum(CASE WHEN e.grade='easy' AND length(trim(COALESCE(e.response,'')))>0 AND length(trim(COALESCE(e.transfer_prompt,'')))>0 THEN 1 ELSE 0 END),0) selfRatedEasy FROM coach_review_events e WHERE e.profile_id=? AND e.previous_revision>0 AND EXISTS(SELECT 1 FROM coach_review_events prior WHERE prior.profile_id=e.profile_id AND prior.item_id=e.item_id AND prior.previous_revision=e.previous_revision-1 AND prior.next_due_at<=e.occurred_at)").bind(profile.id),
 ]);
 const lessons=(rows[0].results as Lesson[]).filter(a=>(a.level??getCoachLesson(a.lesson_id)?.level)===level);
 const listening=(rows[1].results as Listen[]).filter(a=>a.level===level),exams=(rows[2].results as Exam[]).filter(a=>a.level===level);
 const audio=rows[3].results[0] as {recordings:number;recording_ms:number;replied:number},examAudio=rows[4].results[0] as {recordings:number;recording_ms:number};
 const chat=rows[5].results[0] as {texts:number;feedback:number;finished:number};
 const review=rows[7].results[0] as {saved:number;due:number;events:number};
 const delayed=rows[9].results[0] as {attempts:number;transferAnswered:number;selfRatedEasy:number};
 const report:ProgressReport={language:profile.language,level,asOf:now,
  courses:{text:new Set(lessons.filter(a=>a.status==='complete').map(a=>a.lesson_id)).size,complete:new Set(lessons.filter(a=>a.full_completed_at!==null).map(a=>a.lesson_id)).size},review:{...review,delayed},
  reading:empty(),listening:empty(),weakPoints:[],writing:{courseTexts:0,examTexts:0,textChatTurns:chat.texts},
  speaking:{recordings:audio.recordings+examAudio.recordings,recordingMs:audio.recording_ms+examAudio.recording_ms,repliedAudioTurns:audio.replied,finishedAudioConversations:chat.finished,examAnswers:0},
  feedback:{conversationTurns:chat.feedback,examTasks:Number((rows[6].results[0] as {n:number}).n)},
  study:{listening:emptyStudy(),reading:emptyStudy(),writing:emptyStudy(),speaking:emptyStudy()},
 };
 for(const row of rows[8].results as StudyRow[]){
  const paper=JSON.parse(row.snapshot) as {level:CoachLevel;kind:StudySkill;items:{id:string}[]};if(paper.level!==level||!Object.hasOwn(report.study,paper.kind))continue;
  const activity=report.study[paper.kind],answers=JSON.parse(row.answers) as Record<string,string|number>,help=JSON.parse(row.help) as ExamStudyHelp;
  activity.started++;if(row.status==='submitted')activity.completed++;
  activity.savedAnswers+=paper.items.filter(item=>answers[item.id]!==undefined&&String(answers[item.id]).trim()).length;
  if(Object.values(help).some(entry=>Object.values(entry).some(value=>value===true||typeof value==='number'&&value>0)))activity.assistedAttempts++;
 }
 const events:Event[]=[];
 for(const a of lessons)if(a.status==='complete'&&a.result){
  const result=JSON.parse(a.result) as {score:number},topic=a.topic??getCoachLesson(a.lesson_id)?.topic;
  events.push({skill:'reading',id:'lesson:'+a.lesson_id,at:a.completed_at!,correct:result.score===1,repeated:false,independent:false,knowledge:topic?`微课主题：${topic}`:null});
  if(a.has_writing)report.writing.courseTexts++;
 }
 for(const a of listening)if(a.status==='submitted'&&a.result){
  const result=JSON.parse(a.result) as ListeningResult,choices=JSON.parse(a.choices) as Record<string,number>;
  for(const item of result.items)if(Object.hasOwn(choices,item.id))events.push({skill:'listening',id:listeningEvidenceId(a.material_id,item.id),at:a.submitted_at!,correct:item.correct,repeated:result.repeated,independent:false,knowledge:item.knowledge??null});
 }
 for(const a of exams)if(a.status!=='active'&&a.result){
  const result=JSON.parse(a.result) as ExamResult,help=JSON.parse(a.help??'{}') as ExamStudyHelp;
  for(const item of result.items)if(item.answered){
   if(item.skill==='reading'||item.skill==='listening')events.push({skill:item.skill,id:item.id,at:a.submitted_at!,correct:item.correct===true,repeated:item.repeated,independent:!Object.values(help[item.id]??{}).some(value=>value===true||typeof value==='number'&&value>0),knowledge:item.knowledge??null});
   else if(item.skill==='writing')report.writing.examTexts++;
   else report.speaking.examAnswers++;
  }
 }
 // Reusing the same item in a different activity never produces another first sample.
 const seen=new Set<string>(),weakPoints=new Map<string,WeakPoint>();
 for(const e of events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))){const s=report[e.skill],key=e.skill+':'+e.id;
  s.answered++;if(e.correct)s.correct++;
  if(e.repeated||seen.has(key))s.repeated++;else{s.first++;if(e.correct)s.firstCorrect++;if(e.independent){s.firstIndependent++;if(e.correct)s.firstIndependentCorrect++}}seen.add(key);
  const knowledge=e.knowledge?.trim();if(profile.language==='fr-FR'&&knowledge){const topicKey=e.skill+':'+knowledge,point=weakPoints.get(topicKey)??{skill:e.skill,knowledge,wrong:0,answered:0};point.answered++;if(!e.correct)point.wrong++;weakPoints.set(topicKey,point)}
 }
 report.weakPoints=[...weakPoints.values()].filter(point=>point.wrong>0).sort((a,b)=>b.wrong-a.wrong||b.answered-a.answered||a.knowledge.localeCompare(b.knowledge,'zh-CN')).slice(0,5);
 return report;
}
