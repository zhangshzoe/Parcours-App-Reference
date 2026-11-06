import {grammarForLesson} from './grammar';
import {pronunciationForLesson} from './pronunciation';
import {CoachError} from './server';
import {getCoachLesson,publicLesson,type CoachLesson} from './catalog';
import type {LessonAttempt} from './lesson-types';
export type LessonRow=Omit<LessonAttempt,'result'>&{profile_id:string;content_version:number;snapshot:string|null;result:string|null};
export async function ownLessonAttempt(db:D1Database,profileId:string,id:string){const row=await db.prepare('SELECT * FROM coach_attempts WHERE id=? AND profile_id=?').bind(id,profileId).first<LessonRow>();if(!row)throw new CoachError(404,'找不到此微课记录。');return row}
export function savedLesson(a:{snapshot:string|null;lesson_id:string;content_version:number}){const lesson:CoachLesson|undefined=a.snapshot?JSON.parse(a.snapshot):getCoachLesson(a.lesson_id);if(!lesson||lesson.version!==a.content_version)throw new CoachError(409,'此课程版本暂不可用。');return lesson}
export function lessonAttemptView(row:LessonRow):LessonAttempt{const {snapshot,profile_id,content_version,...rest}=row;return {...rest,result:row.result?JSON.parse(row.result):null}}
export async function lessonJourney(db:D1Database,row:LessonRow){
 const lesson=savedLesson(row);
 const listening=row.listening_id?await db.prepare('SELECT played_at,snapshot FROM coach_listening_attempts WHERE id=? AND profile_id=?').bind(row.listening_id,row.profile_id).first<{played_at:number|null;snapshot:string}>():null;
 const conversation=row.conversation_id?await db.prepare("SELECT c.status,c.summary,c.practice_snapshot,COALESCE((SELECT sum(recording_ms) FROM coach_turns WHERE conversation_id=c.id AND input_kind='audio'),0) recording_ms,(SELECT count(*) FROM coach_turns WHERE conversation_id=c.id AND input_kind='audio' AND state='replied') audio_replies FROM coach_conversations c WHERE c.id=? AND c.profile_id=?").bind(row.conversation_id,row.profile_id).first<{status:string;summary:string|null;practice_snapshot:string;recording_ms:number;audio_replies:number}>():null;
 const audioOwn=Boolean(conversation&&JSON.parse(conversation.practice_snapshot).lessonAttemptId===row.id),listenOwn=Boolean(listening&&JSON.parse(listening.snapshot).courseAttemptId===row.id);
 const steps={text:row.status==='complete',listening:listenOwn&&listening?.played_at!==null,speaking:audioOwn&&conversation?.status==='finished'&&conversation.audio_replies>0&&conversation.summary!==null};
 return {attempt:lessonAttemptView(row),lesson:publicLesson(lesson),pronunciation:pronunciationForLesson(lesson),grammar:grammarForLesson(lesson),steps,oral:{recordingMs:audioOwn?conversation!.recording_ms:0,audioReplies:audioOwn?conversation!.audio_replies:0,finished:audioOwn&&conversation?.status==='finished',summary:audioOwn&&conversation?.summary!==null}};
}
