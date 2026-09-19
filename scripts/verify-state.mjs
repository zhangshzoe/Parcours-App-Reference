import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
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
console.log('PASS: anonymous protection, per-user isolation, completion persistence, idempotent retry, review scheduling, validation, and origin checks. Test records are local only.');

} finally {await mf.dispose();}
