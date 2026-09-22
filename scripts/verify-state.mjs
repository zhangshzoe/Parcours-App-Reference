import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {lessons,levelGuide} from './verify-curriculum.mjs';
const origin='http://localhost';
const moduleFiles=await readdir('dist/server',{recursive:true});
const modules=['index.js',...moduleFiles.filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:path.resolve('dist/server',f)}));
const mf=new Miniflare({modules,modulesRoot:path.resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'parcours-qa'},cf:false});
try {
const database=await mf.getD1Database('DB');
const migration=await readFile('drizzle/0000_fresh_natasha_romanoff.sql','utf8');
for(const statement of migration.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await database.prepare(statement).run();
const run=crypto.randomUUID();
const identity=id=>({'oai-authenticated-user-id':'qa-'+run+'-'+id,'oai-authenticated-user-email':'qa-'+id+'@example.test'});
async function request(id,body,extra={}){const r=await mf.dispatchFetch(origin+'/api/state',{method:body?'POST':'GET',headers:{...(id?identity(id):{}),...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
assert.equal((await request(null)).data.user,null);
assert.equal((await request(null,{action:'bookmark',wordId:'lesson-01-word-1'})).status,401);
assert.equal((await request('a',{action:'bookmark',wordId:'lesson-01-word-1'})).status,200);
assert.equal((await request('a')).data.reviews.length,1);
assert.equal((await request('b')).data.reviews.length,0);
const completion={action:'complete',lessonId:'lesson-01',answers:[1,0],writing:'Bonjour ! Je voudrais un café et un croissant, s’il vous plaît.',seconds:90,attemptId:crypto.randomUUID()};
assert.equal((await request('a',completion)).status,200);
assert.equal((await request('a',completion)).status,200);
const saved=(await request('a')).data;
assert.equal(saved.progress.length,1);assert.equal(saved.progress[0].score,2);assert.equal(saved.activity.length,1);assert.equal(saved.reviews.length,3);assert.equal(saved.drafts[0].body,completion.writing);
assert.equal((await request('b')).data.progress.length,0);
assert.equal((await request('a',{action:'review',wordId:'lesson-01-word-1',grade:'easy'})).status,200);
assert.ok((await request('a')).data.reviews.find(r=>r.word_id==='lesson-01-word-1').due_at>Date.now());
assert.equal((await request('a',{action:'profile',name:'QA',dailyGoal:-5})).status,400);
assert.equal((await request('a',{action:'bookmark',wordId:'missing'})).status,404);
assert.equal((await request('a',{action:'bookmark',wordId:'lesson-01-word-1'},{origin:'https://different.example'})).status,403);
for(const level of ['A1','B2','C1','C2']){
 const lesson=lessons.find(l=>l.level===level);
 const minimum=levelGuide(level).completionWords;
 const attempt={action:'complete',lessonId:lesson.id,answers:[lesson.quiz.answer,lesson.grammar.answer],writing:lesson.writing.example,seconds:120,attemptId:crypto.randomUUID()};
 const insufficient=lesson.writing.example.trim().split(/\s+/).slice(0,minimum-1).join(' ');
 assert.equal((await request('levels',{...attempt,writing:insufficient})).status,400,level+' rejects under-length writing');
 assert.equal((await request('levels',{action:'draft',lessonId:lesson.id,writing:insufficient})).status,200,level+' permits unfinished drafts');
 assert.equal((await request('levels',attempt)).status,200,level+' completes');
 assert.equal((await request('levels',attempt)).status,200,level+' retry is idempotent');
}
const extended=(await request('levels')).data;
assert.equal(extended.progress.length,4);assert.equal(extended.activity.length,4);assert.equal(extended.reviews.length,12);
assert.ok(extended.progress.every(p=>p.score===2));
assert.equal((await request('b')).data.progress.length,0);
console.log('PASS: existing completion rules and all four new levels; correct scores, minimum lengths, unfinished drafts, saved reviews, per-user isolation and idempotent retries. Test records are local only.');

} finally {await mf.dispose();}
