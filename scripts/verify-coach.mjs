import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

// Tests run against the built Worker in a fresh in-memory database, never production.
const files=await readdir('dist/server',{recursive:true});
const modules=['index.js',...files.filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:path.resolve('dist/server',f)}));
const mf=new Miniflare({modules,modulesRoot:path.resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'coach-qa'},cf:false});
const goal={mode:'balanced',level:'A1',start:'zero',dailyMinutes:10,targetDate:null,interests:['生活'],timezone:'Asia/Shanghai'};
const uuid=()=>crypto.randomUUID();
async function request(user,route,body,method=body?'POST':'GET',headers={}){
 const r=await mf.dispatchFetch('http://localhost/api/coach/'+route,{method,headers:{...(user?{'oai-authenticated-user-id':'coach-test-'+user,'oai-authenticated-user-email':user+'@example.test'}:{}),...(body?{'content-type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
 return {status:r.status,data:await r.json(),headers:r.headers};
}
async function ok(user,route,body,method){const r=await request(user,route,body,method);assert.equal(r.status,200,JSON.stringify(r.data));return r.data}
try{
 const db=await mf.getD1Database('DB');
 for(const name of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){
  for(const sql of (await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 }
 assert.equal((await request(null,'profiles')).status,401);
 assert.equal((await request(null,'capabilities')).status,401);
 const capabilities=await ok('a','capabilities');
 assert.equal(capabilities.status,'not_configured');
 assert.equal(capabilities.pronunciationAssessment,false);
 assert.equal('key' in capabilities,false);
 assert.equal((await request('a','profiles',{language:'fr-FR',goal,commandId:uuid()},'POST',{origin:'https://other.example'})).status,403);
 assert.equal((await request('a','profiles',{language:'fr-FR',goal:{...goal,targetDate:'2026-02-30'},commandId:uuid()})).status,400);
 assert.equal((await request('a','profiles',{language:'fr-FR',goal:{...goal,timezone:'invalid-zone'},commandId:uuid()})).status,400);
 assert.equal((await request('a','profiles',{large:'中'.repeat(11000)})).status,413);
 const create={language:'fr-FR',goal,commandId:uuid()};
 const fr=(await ok('a','profiles',create)).profile;
 assert.deepEqual((await ok('a','profiles',create)).profile,fr);
 assert.equal((await request('a','profiles',{...create,goal:{...goal,dailyMinutes:20}})).status,409);
 const de=(await ok('a','profiles',{language:'de-DE',goal:{...goal,mode:'exam',level:'A2'},commandId:uuid()})).profile;
 assert.equal((await ok('b','profiles')).profiles.length,0);
 assert.equal((await request('b','learning?profileId='+fr.id)).status,404);
 const patch={profileId:fr.id,expectedRevision:0,goal:{...goal,interests:['旅行','生活']},commandId:uuid()};
 assert.equal((await request('b','profiles',patch,'PATCH')).status,404);
 assert.equal((await ok('a','profiles',patch,'PATCH')).profile.revision,1);
 assert.equal((await ok('a','profiles',patch,'PATCH')).profile.revision,1);
 assert.equal((await request('a','profiles',{...patch,goal:{...goal,dailyMinutes:20}},'PATCH')).status,409);
 assert.equal((await request('a','profiles',{...patch,commandId:uuid()},'PATCH')).status,409);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM coach_goals WHERE profile_id=?').bind(fr.id).first()).n,2);
 const state=()=>ok('a','learning?profileId='+fr.id);
 const initial=await state(),german=await ok('a','learning?profileId='+de.id);
 assert.equal(initial.lessons.length,4);assert.equal(german.lessons.length,4);
 assert.equal(initial.attempts.length,0);assert.equal(initial.reviewCount,0);
 assert.ok(initial.lessons.every(l=>l.language==='fr-FR'&&l.level==='A1'&&!('answer' in l.question)&&!('why' in l.question)));
 assert.ok(german.lessons.every(l=>l.language==='de-DE'&&l.level==='A2'));
 const lesson=initial.lessons[0],attemptId=uuid();
 assert.equal((await request('a','learning',{action:'start',profileId:fr.id,lessonId:german.lessons[0].id,attemptId})).status,404);
 const start={action:'start',profileId:fr.id,lessonId:lesson.id,attemptId};
 assert.equal((await ok('a','learning',start)).attempt.revision,0);
 assert.equal((await ok('a','learning',start)).attempt.id,attemptId);
 assert.equal((await request('b','learning',start)).status,404);
 const draft={action:'save',profileId:fr.id,attemptId,revision:0,answer:1,writing:'Bonjour'};
 assert.equal((await ok('a','learning',draft)).attempt.revision,1);
 assert.equal((await ok('a','learning',draft)).attempt.revision,1);
 assert.equal((await request('a','learning',{...draft,writing:'Changed'})).status,409);
 assert.equal((await state()).attempts[0].writing,'Bonjour');
 assert.equal((await request('a','learning',{...draft,action:'complete',revision:1})).status,400);
 const finish={...draft,action:'complete',revision:1,writing:'Bonjour je suis une étudiante et je vis à Lyon.',score:999,seconds:999};
 const completed=(await ok('a','learning',finish)).attempt;
 assert.equal(completed.result.score,1);assert.equal(completed.result.outOf,1);
 assert.equal('seconds' in completed,false);
 assert.deepEqual((await ok('a','learning',finish)).attempt,completed);
 assert.equal((await request('a','learning',{...finish,answer:0})).status,409);
 assert.equal((await state()).attempts.length,1);
 assert.equal((await ok('a','learning?profileId='+de.id)).attempts.length,0);
 for(let i=0;i<4;i++){const bookmark={action:'bookmark',profileId:fr.id,lessonId:lesson.id,phraseIndex:i};await ok('a','learning',bookmark);await ok('a','learning',bookmark)}
 assert.equal((await state()).reviews.length,4);
 const plan=await ok('a','learning',{action:'plan',profileId:fr.id});
 assert.deepEqual((await ok('a','learning',{action:'plan',profileId:fr.id})),plan);
 assert.ok(plan.tasks.reduce((sum,t)=>sum+t.minutes,0)<=10);
 assert.equal(plan.tasks.find(t=>t.type==='review').itemIds.length,3);
 assert.ok(!plan.tasks.some(t=>t.lessonId===lesson.id));
 const item=(await state()).reviews[0];
 const review={action:'review',profileId:fr.id,itemId:item.id,revision:0,grade:'easy',eventId:uuid()};
 const outcomes=await Promise.all([ok('a','learning',review),ok('a','learning',review)]);
 assert.deepEqual(outcomes[0],outcomes[1]);
 assert.equal((await request('a','learning',{...review,grade:'hard'})).status,409);
 assert.equal((await request('a','learning',{...review,eventId:uuid()})).status,409);
 assert.equal((await request('b','learning',review)).status,404);
 assert.equal((await state()).reviewCount,1);
 const savedItem=(await state()).reviews.find(r=>r.id===item.id);
 assert.equal(savedItem.stage,1);assert.equal(savedItem.revision,1);
 assert.equal(savedItem.due_at,outcomes[0].dueAt);
 assert.equal((await ok('a','learning?profileId='+de.id)).reviewCount,0);
 assert.equal((await db.prepare('PRAGMA foreign_key_check').all()).results.length,0);
 // Pure rules: exact intervals, timezone date boundaries, unfinished priority, all budgets.
 const source=await readFile('lib/coach/learning.ts','utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const {reviewSchedule,makePlan,localDate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 assert.equal(localDate(Date.UTC(2026,9,1,18),'Asia/Shanghai'),'2026-10-02');
 assert.equal(localDate(Date.UTC(2026,9,1,18),'America/Los_Angeles'),'2026-10-01');
 assert.deepEqual(reviewSchedule(3,'again',0),{stage:0,dueAt:600000});
 assert.deepEqual(reviewSchedule(3,'hard',0),{stage:3,dueAt:86400000});
 for(let stage=0;stage<=5;stage++)assert.equal(reviewSchedule(stage,'easy',0).dueAt,[1,3,7,14,30,30][stage]*86400000);
 for(const dailyMinutes of [10,20,30,45]){
  const tasks=makePlan({...goal,dailyMinutes},initial.lessons,new Set(),new Set([initial.lessons[3].id]),Array.from({length:50},(_,i)=>String(i)));
  assert.ok(tasks.reduce((n,t)=>n+t.minutes,0)<=dailyMinutes);
  assert.equal(tasks.find(t=>t.type==='lesson')?.lessonId,initial.lessons[3].id);
 }
 console.log('PASS coach: migrations; auth/CSRF/body limits; profile history and stale updates; French/German isolation; sanitized catalog; draft recovery; server grading; idempotent completion/review; bounded persistent plans; timezone and interval rules. Local synthetic data only.');
}finally{await mf.dispose()}
