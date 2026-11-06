import type {ExamRow} from './exams';
import type {ExamPaper} from './exam-types';
// Recheck at sealing: another tab may have opened the same specialist material
// after this attempt started. Conservatively count that as repeated exposure.
export async function sealingExposures(db:D1Database,row:ExamRow,paper:ExamPaper){
 const [other,practice]=await db.batch([
  db.prepare("SELECT DISTINCT json_extract(j.value,'$.id') AS item_id FROM coach_exam_attempts a,json_each(a.snapshot,'$.items') j WHERE a.profile_id=? AND a.id<>?").bind(row.profile_id,row.id),
  db.prepare('SELECT lesson_id AS source FROM coach_attempts WHERE profile_id=? UNION SELECT material_id AS source FROM coach_listening_attempts WHERE profile_id=?').bind(row.profile_id,row.profile_id)
 ]);
 const seen=new Set((other.results as {item_id:string}[]).map(r=>r.item_id)),sources=new Set((practice.results as {source:string}[]).map(r=>r.source)),old=new Set<string>(JSON.parse(row.exposed_item_ids));
 return paper.items.filter(i=>old.has(i.id)||seen.has(i.id)||(i.audio&&(sources.has(i.audio.sourceLessonId)||sources.has(i.audio.sourceMaterialId)))).map(i=>i.id);
}
