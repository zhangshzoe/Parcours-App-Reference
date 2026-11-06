import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {Miniflare} from 'miniflare';
const source=await fs.readFile('lib/coach/privacy-export.ts','utf8');
const isolated=source.replace("import {CoachError} from './server';",'class CoachError extends Error {}');
const js=ts.transpileModule(isolated,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {exportDefinitions}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const files=await fs.readdir('dist/server',{recursive:true});
const mf=new Miniflare({
 modules:['index.js',...files.filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:path.resolve('dist/server',f)})),
 modulesRoot:path.resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'privacy-export-isolated'},cf:false,
 outboundService:()=>{throw new Error('Export must not contact external services')},
});
const user='privacy-a',other='privacy-b';
async function request(who,body={action:'export',scope:'all'},headers={}){
 return mf.dispatchFetch('http://localhost/api/coach/privacy',{method:'POST',headers:{'Content-Type':'application/json',...(who?{'oai-authenticated-user-id':who,'oai-authenticated-user-email':who+'@example.test'}:{}),...headers},body:JSON.stringify(body)});
}
async function exported(who,scope){const r=await request(who,{action:'export',scope});assert.equal(r.status,200,await r.clone().text());assert.match(r.headers.get('cache-control'),/private, no-store/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.match(r.headers.get('content-disposition'),/^attachment; filename="parcours-/);assert(r.headers.get('vary').split(',').map(s=>s.trim()).includes('Cookie'));return r.json()}
try{
 const db=await mf.getD1Database('DB');
 for(const file of (await fs.readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await db.batch((await fs.readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 const actual=(await db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all()).results.map(r=>r.name).filter(name=>!['app_data_guards','app_privacy_confirmations'].includes(name)).sort();
 assert.deepEqual(exportDefinitions.map(d=>d.name).sort(),actual,'Every business table needs an explicit privacy coverage decision');
 const schemas=new Map(),foreignKeys=new Map();
 for(const d of exportDefinitions){
  const info=(await db.prepare(`PRAGMA table_info(${d.name})`).all()).results;schemas.set(d.name,info);
  assert.deepEqual(d.columns.split(',').sort(),info.map(c=>c.name).sort(),d.name+' columns must be reviewed');
  foreignKeys.set(d.name,(await db.prepare(`PRAGMA foreign_key_list(${d.name})`).all()).results);
 }
 const ordered=[];const remaining=[...exportDefinitions];
 while(remaining.length){
  const i=remaining.findIndex(d=>foreignKeys.get(d.name).every(f=>ordered.some(p=>p.name===f.table)));
  assert(i>=0,'Fixture graph must be acyclic');ordered.push(...remaining.splice(i,1));
 }
 async function seed(owner,lang){
  const ids=new Map();
  for(const d of ordered){
   if(lang==='en-US'?d.group!=='english':d.group==='english'||d.group!=='coach'&&lang!=='fr-FR')continue;
   const id=`${owner}-${lang}-${d.name}`;ids.set(d.name,id);
   const values={};
   for(const c of schemas.get(d.name))values[c.name]=c.type==='INTEGER'?1:`${id}-${c.name}`;
   for(const f of foreignKeys.get(d.name))values[f.from]=ids.get(f.table);
   if(d.group==='privacy'){values.revision=0;values.last_delete_id=null;values.last_scope=null;values.deleted_at=null}
   if('id' in values)values.id=id;if('user_id'in values)values.user_id=owner;
   if('language'in values)values.language=lang;if('level'in values)values.level='A1';
   if('status'in values)values.status=d.name.includes('attempts')?'active':'succeeded';
   if('deadline_at'in values)values.deadline_at=Date.now()-1000;
   if('original_transcript'in values)values.original_transcript='Original naïf / Straße / 中文 '+owner;
   if('accepted_text'in values)values.accepted_text='修正后的转写 '+owner;
   for(const field of d.json??[])values[field]=JSON.stringify({fixture:owner,language:lang,saved:'Bonjour, Grüße 中文'});
   if(d.snapshot)values[d.snapshot]=JSON.stringify({id:'content-'+id,version:2,title:'学习材料',language:lang,level:'A1',items:[{id:'item-'+id,skill:'listening',answer:'PRIVATE_ANSWER_KEY',audio:{text:'PRIVATE_LISTENING_SCRIPT'}}],questions:[{answer:'PRIVATE_ANSWER_KEY'}],answer:'PRIVATE_ANSWER_KEY'});
   const cols=d.columns.split(',');await db.prepare(`INSERT INTO ${d.name} (${d.columns}) VALUES (${cols.map(()=>'?').join(',')})`).bind(...cols.map(c=>values[c])).run();
  }
 }
 await seed(user,'fr-FR');await seed(user,'de-DE');await seed(user,'en-US');await seed(other,'fr-FR');await seed(other,'en-US');
 // Existing old history view caps at 500; the export must not inherit that truncation.
 for(let offset=0;offset<600;offset+=50)await db.batch(Array.from({length:50},(_,i)=>db.prepare('INSERT INTO study_activity(user_id,attempt_id,lesson_id,seconds,created_at) VALUES(?,?,?,?,?)').bind(user,'old-extra-'+(offset+i),'old-course',10,offset+i)));
 const before=(await db.batch(exportDefinitions.map(d=>db.prepare(`SELECT count(*) AS n FROM ${d.name}`)))).map(r=>r.results[0].n);
 const all=await exported(user,'all');assert.equal(all.format,'parcours-personal-data');assert.equal(all.version,1);assert.equal(all.account.id,user);assert.equal(all.summary.sections.length,38);
 assert.equal(all.records.study_activity.length,601);assert.equal(all.records.coach_profiles.length,2);
 assert(!JSON.stringify(all).includes(other));assert(!JSON.stringify(all).includes('PRIVATE_ANSWER_KEY'));assert(!JSON.stringify(all).includes('PRIVATE_LISTENING_SCRIPT'));
 assert.equal(all.summary.totalRecords,Object.values(all.records).reduce((n,rows)=>n+rows.length,0));
 for(const s of all.summary.sections)assert.equal(s.count,all.records[s.key].length);
 for(const d of exportDefinitions)assert.equal(all.records[d.name].length,d.name==='study_activity'?601:d.group==='coach'?2:1,d.name);
 assert.equal(all.records.coach_turns[0].original_transcript,'Original naïf / Straße / 中文 '+user);assert.equal(all.records.coach_turns[0].accepted_text,'修正后的转写 '+user);
 assert.equal(all.records.coach_profiles[0].goal.fixture,user);
 for(const lang of ['fr-FR','de-DE']){
  const data=await exported(user,lang);assert.equal(data.summary.sections.length,24);assert.equal(data.records.coach_profiles[0].language,lang);
  for(const rows of Object.values(data.records))assert.equal(rows.length,1);
  assert(!Object.hasOwn(data.records,'profiles'));assert(!JSON.stringify(data.records).includes(lang==='fr-FR'?'de-DE':'fr-FR'));
  for(const name of ['coach_exam_attempts','coach_assessment_attempts','coach_listening_attempts']){assert.equal(data.records[name][0].result,null);assert(!Object.hasOwn(data.records[name][0],'snapshot'));assert.equal(data.records[name][0].content_reference.version,2)}
 }
 const english=await exported(user,'en-US');assert.equal(english.summary.sections.length,6);assert.equal(english.records.english_profiles.length,1);
 assert(!Object.hasOwn(english.records,'coach_profiles'));assert(!Object.hasOwn(english.records,'lesson_progress'));
 assert.equal(english.records.english_turns[0].original_transcript,'Original naïf / Straße / 中文 '+user);
 assert.equal(english.records.english_turns[0].accepted_text,'修正后的转写 '+user);
 assert(!Object.hasOwn(english.records.english_sessions[0],'snapshot'));
 assert.equal(english.records.english_sessions[0].audioConsentRequestRecorded,false,'A stored notice version alone cannot prove an audio request');
 assert.match(english.notice.englishConsent,/不代表实际上传/);
 assert(!JSON.stringify(english).includes(other));
 // Completed result/feedback belongs to the learner and is preserved, not recomputed.
 await db.prepare("UPDATE coach_exam_attempts SET status='submitted',result=? WHERE profile_id IN (SELECT id FROM coach_profiles WHERE user_id=?)").bind(JSON.stringify({savedResult:'confirmed',answer:1}),user).run();
 const submitted=await exported(user,'all');assert.equal(submitted.records.coach_exam_attempts[0].result.savedResult,'confirmed');
 const empty=await exported('privacy-empty','all');assert.equal(empty.summary.totalRecords,0);assert.equal(empty.summary.sections.length,38);
 assert.equal((await request(null)).status,401);
 assert.equal((await request(user,{action:'export',scope:'all',userId:other})).status,400);
 assert.equal((await request(user,{action:'export',scope:'other'})).status,400);
 assert.equal((await request(user,{action:'delete',scope:'all'})).status,400);
 assert.equal((await request(user,undefined,{origin:'https://hostile.example'})).status,403);
 assert.equal((await request(user,undefined,{'sec-fetch-site':'cross-site'})).status,403);
 assert.equal((await request(user,undefined,{'Content-Type':'text/plain'})).status,415);
 assert.equal((await request(user,{action:'export',scope:'all',padding:'x'.repeat(1500)})).status,413);
 const after=(await db.batch(exportDefinitions.map(d=>db.prepare(`SELECT count(*) AS n FROM ${d.name}`)))).map(r=>r.results[0].n);
 assert.deepEqual(after,before,'Export must not write, expire or delete records');
 await db.prepare("UPDATE english_calls SET operation='audio' WHERE user_id=?").bind(user).run();
 const withAudioRequest=await exported(user,'en-US');
 assert.equal(withAudioRequest.records.english_sessions[0].audioConsentRequestRecorded,true,'A saved audio call is reported separately from the notice version');
 const active=await db.prepare("SELECT status FROM coach_assessment_attempts WHERE profile_id IN(SELECT id FROM coach_profiles WHERE user_id=?) LIMIT 1").bind(user).first();assert.equal(active.status,'active');
 assert.equal((await db.prepare('PRAGMA foreign_key_check').all()).results.length,0);

 // Scope, confirmation, failure rollback and stale-request protections.
 async function privacy(who,body,revision=0){return request(who,body,{'X-Parcours-Data-Revision':String(revision)})}
 async function confirmation(who,scope,revision=0){const r=await privacy(who,{action:'prepare-delete',scope,revision},revision);assert.equal(r.status,200,await r.clone().text());return (await r.json()).confirmation}
 const deletion=c=>({action:'delete',token:c.token,scope:c.scope,revision:c.revision,phrase:c.phrase});
 const firstConfirm=await confirmation(user,'fr-FR');assert.equal(firstConfirm.totalRecords,24);assert.equal(firstConfirm.phrase,'删除法语学习数据');
 assert.equal((await privacy(other,deletion(firstConfirm))).status,409);
 assert.equal((await privacy(user,{...deletion(firstConfirm),phrase:'wrong'})).status,400);
 const superseding=await confirmation(user,'all');assert.equal((await privacy(user,deletion(firstConfirm))).status,409);
 await db.prepare('UPDATE app_privacy_confirmations SET expires_at=0 WHERE user_id=?').bind(user).run();
 assert.equal((await privacy(user,deletion(superseding))).status,409);
 const valid=await confirmation(user,'fr-FR');
 const guardJS=ts.transpileModule(await fs.readFile('lib/data-guard.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const {guardedDatabase}=await import('data:text/javascript;base64,'+Buffer.from(guardJS).toString('base64'));
 const stale=guardedDatabase(db,user,0);
 const oldInsert=stale.prepare('INSERT INTO content_reports(id,user_id,lesson_id,body,created_at) VALUES(?,?,?,?,?)').bind('late-write',user,'lesson','must never return',1);
 await db.prepare("CREATE TRIGGER privacy_fixture_abort BEFORE DELETE ON coach_turns BEGIN SELECT RAISE(ABORT, 'fixture_abort'); END").run();
 const preRollback=await exported(user,'all');
 assert.equal((await privacy(user,deletion(valid))).status,503);
 assert.equal((await db.prepare('SELECT revision FROM app_data_controls WHERE user_id=?').bind(user).first()).revision,0);
 assert.deepEqual((await exported(user,'all')).records,preRollback.records,'Deletion failure rolls all child deletes and revision back');
 assert.equal((await db.prepare('SELECT count(*) AS n FROM app_data_guards').first()).n,0);
 await db.prepare('DROP TRIGGER privacy_fixture_abort').run();
 const [cleared,replayed]=await Promise.all([privacy(user,deletion(valid)),privacy(user,deletion(valid))]);
 assert.equal(cleared.status,200,await cleared.clone().text());assert.equal(replayed.status,200,await replayed.clone().text());
 assert.equal((await cleared.json()).deleted,true);assert.equal((await replayed.json()).deleted,true);
 await assert.rejects(()=>oldInsert.run(),/学习数据已被清理/);
 await assert.rejects(()=>stale.batch([stale.prepare('INSERT INTO content_reports(id,user_id,lesson_id,body,created_at) VALUES(?,?,?,?,?)').bind('late-batch',user,'lesson','forbidden',1)]),/学习数据已被清理/);
 await assert.rejects(()=>stale.prepare('SELECT * FROM profiles').all(),/学习数据已被清理/);
 const frAfter=await privacy(user,{action:'export',scope:'fr-FR'},1);assert.equal(frAfter.status,200);assert.equal((await frAfter.json()).summary.totalRecords,0);
 const deAfter=await privacy(user,{action:'export',scope:'de-DE'},1);assert.equal((await deAfter.json()).summary.totalRecords,24);
 assert.equal((await exported(other,'all')).records.coach_profiles.length,1);
 assert.equal((await exported(other,'all')).records.english_profiles.length,1);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM study_activity WHERE user_id=?').bind(user).first()).n,601,'Language deletion preserves legacy');
 const oldLegacy=await mf.dispatchFetch('http://localhost/api/state',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test','X-Parcours-Data-Revision':'0'},body:JSON.stringify({action:'profile',name:'stale',dailyGoal:20})});assert.equal(oldLegacy.status,409);
 const missingLegacy=await mf.dispatchFetch('http://localhost/api/state',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:JSON.stringify({action:'profile',name:'stale',dailyGoal:20})});assert.equal(missingLegacy.status,409);
 const freshRead=await mf.dispatchFetch('http://localhost/api/coach/profiles',{headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}});assert.equal((await freshRead.json()).dataRevision,1);
 const fresh=guardedDatabase(db,user,1);await fresh.prepare('INSERT INTO content_reports(id,user_id,lesson_id,body,created_at) VALUES(?,?,?,?,?)').bind('fresh-write',user,'lesson','new intentionally saved content',1).run();
 const allConfirm=await confirmation(user,'all',1);const clearedAll=await privacy(user,deletion(allConfirm),1);assert.equal(clearedAll.status,200);
 const receipt=await privacy(user,{action:'deletion-status',token:allConfirm.token},1);assert.equal((await receipt.json()).deleted,true);
 const someoneElse=await privacy(other,{action:'deletion-status',token:allConfirm.token});assert.equal((await someoneElse.json()).deleted,false);
 const afterAll=await privacy(user,{action:'export',scope:'all'},2);const emptyAll=await afterAll.json();assert.equal(emptyAll.summary.totalRecords,1);assert.equal(emptyAll.records.app_data_controls[0].revision,2);
 for(const [table,rows] of Object.entries(emptyAll.records))if(table!=='app_data_controls')assert.equal(rows.length,0,table);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM app_privacy_confirmations WHERE user_id=?').bind(user).first()).n,0);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM app_data_guards').first()).n,0);
 // A refreshed client can start again; retrying an already-completed delete preserves new work.
 const current=guardedDatabase(db,user,2);await current.prepare('INSERT INTO writing_drafts(user_id,lesson_id,body,updated_at) VALUES(?,?,?,?)').bind(user,'new-lesson','new draft after refresh',Date.now()).run();
 assert.equal((await privacy(user,deletion(allConfirm),1)).status,200);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM writing_drafts WHERE user_id=?').bind(user).first()).n,1);
 assert.equal((await db.prepare('PRAGMA foreign_key_check').all()).results.length,0);
 const englishConfirm=await confirmation(other,'en-US');assert.equal(englishConfirm.totalRecords,6);assert.equal(englishConfirm.phrase,'删除英语听说数据');
 assert.equal((await privacy(other,deletion(englishConfirm))).status,200);
 const otherEnglish=await privacy(other,{action:'export',scope:'en-US'},1);assert.equal((await otherEnglish.json()).summary.totalRecords,0);
 const otherFrench=await privacy(other,{action:'export',scope:'fr-FR'},1);assert.equal((await otherFrench.json()).records.coach_profiles.length,1);
 console.log('PASS: typed/scope/user-bound expiring confirmation; atomic rollback; concurrent idempotent deletion; all child records removed; language/legacy isolation; in-flight database guards; old/missing client generation blocked; fresh generation and retry preserve new data.');
 console.log('PASS: all 38 exported tables/columns reviewed; French/German/English owner and route isolation; 601 old activity records exported without truncation; original/confirmed transcripts, completed results and JSON preserved; unfinished keys hidden; no mutations; auth/origin/input guards; no external calls.');
}finally{await mf.dispose()}
