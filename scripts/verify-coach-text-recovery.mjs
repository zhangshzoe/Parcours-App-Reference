import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';import path from 'node:path';import {Miniflare} from 'miniflare';
const files=await readdir('dist/server',{recursive:true}),modules=['index.js',...files.filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:path.resolve('dist/server',f)}));
const mf=new Miniflare({modules,modulesRoot:path.resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],cf:false,d1Databases:{DB:'text-recovery'},outboundService:()=>{throw Error('Text storage/recovery must not contact an AI service')}});
const uuid=()=>crypto.randomUUID(),consentVersion='coach-ai-processing-v1';
async function req(user,route,body){const r=await mf.dispatchFetch('http://localhost/api/coach/'+route,{method:body?'POST':'GET',headers:{...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}}
async function ok(...args){const r=await req(...args);assert.equal(r.status,200,JSON.stringify(r.data));return r.data}
try{
 const db=await mf.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await db.batch((await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 for(const language of ['fr-FR','de-DE'])for(const level of ['A1','A2'])for(const mode of ['scenario','free']){
  const user=language+level+mode,p=(await ok(user,'profiles',{language,goal:{mode:'balanced',level,start:'a1',dailyMinutes:20,targetDate:null,interests:['生活'],timezone:'Asia/Shanghai'},commandId:uuid()})).profile;
  const base={profileId:p.id,conversationId:uuid()},listing=await ok(user,'conversations?profileId='+p.id);
  await ok(user,'conversations',{...base,action:mode==='free'?'create-free':'create',...(mode==='free'?{topic:'学习日常安排'}:{scenarioId:listing.scenarios[0].id}),mode:'guided',consentVersion});
  const original=language==='fr-FR'?'Bonjour, je suis ici.':'Hallo, ich bin hier.',command={...base,action:'text',turnId:uuid(),text:original};
  await ok(user,'conversations',command); // Discard this response: model a server write whose reply was lost.
  const replay=await ok(user,'conversations',command),query='conversations?'+new URLSearchParams(base),restored=await ok(user,query);
  assert.equal(restored.turns.length,1);assert.deepEqual(restored.turns,replay.turns);assert.equal(restored.turns[0].id,command.turnId);assert.equal(restored.turns[0].original_transcript,original);assert.equal(restored.turns[0].input_kind,'text');assert.equal(restored.turns[0].recording_ms,0);assert.equal(restored.turns[0].state,'draft');assert.equal(restored.turns[0].accepted_text,null);
  assert.equal((await req(user,'conversations',{...command,text:original+'!'})).status,409,'The same ID cannot silently change text');
  assert.equal((await req('other',query)).status,404);assert.equal((await req(null,query)).status,401);
  await ok(user,'conversations',{...base,action:'end'});const afterEnd=await ok(user,'conversations',command);assert.equal(afterEnd.conversation.status,'finished');assert.equal(afterEnd.turns.length,1,'A replay after another device finishes the conversation cannot create a turn');
  assert.equal((await db.prepare('SELECT count(*) AS n FROM coach_turns WHERE conversation_id=?').bind(base.conversationId).first()).n,1);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM coach_service_calls WHERE conversation_id=?').bind(base.conversationId).first()).n,0);
 }
 assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
 console.log('PASS text recovery: eight French/German A1/A2 scenario/free flows; lost-response replay and read; one immutable text turn; zero audio time/service calls; mismatch refusal; ownership; finished-session replay. Synthetic identities, no real-service validation.');
}finally{await mf.dispose()}
