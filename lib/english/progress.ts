import type {EnglishProgress} from './types';

export const emptyEnglishProgress=():EnglishProgress=>({
 listening:{submitted:0,independent:{attempts:0,correct:0,total:0},assisted:{attempts:0,correct:0,total:0}},
 task:{assessed:0,completed:0,uncertain:0},issues:{saved:0,repeated:[]},
});

export async function englishProgressReport(db:D1Database,profileId:string):Promise<EnglishProgress>{
 const [listeningRows,taskRows,issueRows,repeatedRows]=await db.batch([
  db.prepare(`WITH source AS (
   SELECT listening_result,(
    COALESCE(json_extract(listening_result,'$.assisted'),0)=1 OR COALESCE(json_extract(help,'$.deviceVoice'),0)=1
   ) assisted FROM english_sessions WHERE profile_id=?
  ) SELECT count(listening_result) submitted,
   COALESCE(sum(CASE WHEN listening_result IS NOT NULL AND assisted=0 THEN 1 ELSE 0 END),0) independentAttempts,
   COALESCE(sum(CASE WHEN listening_result IS NOT NULL AND assisted=0 THEN json_extract(listening_result,'$.correct') ELSE 0 END),0) independentCorrect,
   COALESCE(sum(CASE WHEN listening_result IS NOT NULL AND assisted=0 THEN json_extract(listening_result,'$.total') ELSE 0 END),0) independentTotal,
   COALESCE(sum(CASE WHEN listening_result IS NOT NULL AND assisted=1 THEN 1 ELSE 0 END),0) assistedAttempts,
   COALESCE(sum(CASE WHEN listening_result IS NOT NULL AND assisted=1 THEN json_extract(listening_result,'$.correct') ELSE 0 END),0) assistedCorrect,
   COALESCE(sum(CASE WHEN listening_result IS NOT NULL AND assisted=1 THEN json_extract(listening_result,'$.total') ELSE 0 END),0) assistedTotal
   FROM source`).bind(profileId),
  db.prepare(`SELECT count(*) assessed,
   COALESCE(sum(json_extract(last_feedback,'$.taskStatus')='completed'),0) completed,
   COALESCE(sum(json_extract(last_feedback,'$.taskStatus')='uncertain'),0) uncertain
   FROM (SELECT (SELECT t.feedback FROM english_turns t WHERE t.session_id=s.id AND t.feedback IS NOT NULL ORDER BY t.sequence DESC LIMIT 1) last_feedback
    FROM english_sessions s WHERE s.profile_id=?) WHERE last_feedback IS NOT NULL`).bind(profileId),
  db.prepare("SELECT count(*) saved FROM english_reviews WHERE profile_id=? AND kind IN ('expression','task')").bind(profileId),
  db.prepare(`SELECT kind,min(trim(json_extract(payload,'$.knowledge'))) explanation,count(*) n
   FROM english_reviews WHERE profile_id=? AND kind IN ('expression','task')
   AND length(trim(COALESCE(json_extract(payload,'$.knowledge'),'')))>0
   GROUP BY kind,lower(trim(json_extract(payload,'$.knowledge')))
   HAVING count(*)>=2 ORDER BY n DESC,kind,explanation LIMIT 2`).bind(profileId),
 ]);
 const listening=listeningRows.results[0] as {submitted:number;independentAttempts:number;independentCorrect:number;independentTotal:number;assistedAttempts:number;assistedCorrect:number;assistedTotal:number};
 const task=taskRows.results[0] as {assessed:number;completed:number;uncertain:number};
 const issues=issueRows.results[0] as {saved:number};
 return {listening:{submitted:listening.submitted,independent:{attempts:listening.independentAttempts,correct:listening.independentCorrect,total:listening.independentTotal},assisted:{attempts:listening.assistedAttempts,correct:listening.assistedCorrect,total:listening.assistedTotal}},task,issues:{saved:issues.saved,repeated:(repeatedRows.results as {kind:'expression'|'task';explanation:string;n:number}[]).map(row=>({kind:row.kind,explanation:row.explanation,count:row.n}))}};
}
