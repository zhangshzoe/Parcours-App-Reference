import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
const files=await readdir('dist/server',{recursive:true});
const modules=['index.js',...files.filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:path.resolve('dist/server',f)}));
const wavCode=ts.transpileModule(await readFile('lib/coach/wav.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {encodeWav}=await import('data:text/javascript;base64,'+Buffer.from(wavCode).toString('base64'));
const audio=Buffer.from(encodeWav(Float32Array.from({length:16000},(_,i)=>Math.sin(i/12)*.15))).toString('base64');
let latch;
const mf=new Miniflare({modules,modulesRoot:path.resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],cf:false,d1Databases:{DB:'privacy-late'},bindings:{COACH_AI_ENABLED:'true',COACH_OPENAI_API_KEY:'fixture-not-key'},outboundService:async request=>{
 assert.equal(new URL(request.url).origin,'https://api.openai.com');
 const route=new URL(request.url).pathname;assert.equal(route,latch.route);latch.enter();await latch.releasePromise;
 if(route==='/v1/audio/speech')return new Response(new Uint8Array(200),{headers:{'content-type':'audio/mpeg'}});
 if(route==='/v1/audio/transcriptions')return Response.json({text:'Bonjour, je suis Lina.'});
 return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({reply:'Bonjour Lina.',translation:'你好，Lina。',hint:'继续介绍自己。',taskStatus:'in_progress',points:[]})}]}]});
}});
const uuid=()=>crypto.randomUUID(),consentVersion='coach-ai-processing-v1';
const goal={mode:'balanced',level:'A1',start:'a1',dailyMinutes:20,targetDate:null,interests:['生活'],timezone:'Asia/Shanghai'};
async function req(user,route,body,revision=0){const r=await mf.dispatchFetch('http://localhost/api/coach/'+route,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test','X-Parcours-Data-Revision':String(revision),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:r.headers.get('content-type')?.startsWith('audio/')?new Uint8Array(await r.arrayBuffer()):await r.json()};}
async function ok(...args){const r=await req(...args);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
async function bounded(p){let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Provider entry timed out')),10000)})]);}finally{clearTimeout(timer);}}
try{
 const db=await mf.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await db.batch((await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 for(const [action,route] of [['speak','/v1/audio/speech'],['audio','/v1/audio/transcriptions'],['respond','/v1/responses']]){
  const user='late-'+action,profile=(await ok(user,'profiles',{language:'fr-FR',goal,commandId:uuid()})).profile;
  const catalog=await ok(user,'conversations?profileId='+profile.id),conversationId=uuid(),turnId=uuid(),base={profileId:profile.id,conversationId};
  await ok(user,'conversations',{action:'create',...base,scenarioId:catalog.scenarios[0].id,mode:'guided',consentVersion});
  if(action==='respond'){await ok(user,'conversations',{action:'text',...base,turnId,text:'Bonjour, je suis Lina.'});await ok(user,'conversations',{action:'confirm',...base,turnId,revision:0,text:'Bonjour, je suis Lina.'});}
  let enter,release;const entered=new Promise(resolve=>{enter=resolve}),releasePromise=new Promise(resolve=>{release=resolve});latch={route,enter,release,releasePromise};
  const input={action,...base,commandId:uuid(),...(action==='speak'?{turnId:null}:action==='audio'?{turnId,audio,consentVersion}:{turnId,revision:1})};
  const pending=req(user,'conversations',input);
  try{
   await bounded(entered);
   assert.equal((await db.prepare("SELECT count(*) AS n FROM coach_service_calls WHERE user_id=? AND status='running'").bind(user).first()).n,1);
   const c=(await ok(user,'privacy',{action:'prepare-delete',scope:'all',revision:0})).confirmation;
   assert.equal((await ok(user,'privacy',{action:'delete',scope:c.scope,token:c.token,revision:c.revision,phrase:c.phrase})).deleted,true);
   const replacement=(await ok(user,'profiles',{language:'fr-FR',goal,commandId:uuid()},1)).profile;
   release();const result=await pending;assert.equal(result.status,409,JSON.stringify(result.data));assert.equal(result.data.code,'data_revision_changed');
   assert.equal((await db.prepare('SELECT count(*) AS n FROM coach_service_calls WHERE user_id=?').bind(user).first()).n,0);
   assert.equal((await db.prepare('SELECT count(*) AS n FROM coach_conversations WHERE id=?').bind(conversationId).first()).n,0);
   assert.equal((await db.prepare('SELECT count(*) AS n FROM coach_turns WHERE id=?').bind(turnId).first()).n,0);
   assert.equal((await db.prepare('SELECT count(*) AS n FROM coach_profiles WHERE id=?').bind(replacement.id).first()).n,1);
  }finally{release();await pending;}
 }
 assert.equal((await db.prepare('PRAGMA foreign_key_check').all()).results.length,0);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM app_data_guards').first()).n,0);
 console.log('PASS: delayed mocked TTS, ASR and dialogue complete after deletion; each returns 409 without audio/data resurrection or damage to newly created profiles. Isolated fixtures only; no real provider validation.');
}finally{latch?.release();await mf.dispose();}
