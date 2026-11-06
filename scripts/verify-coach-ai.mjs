import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';

// Contract fixtures only. No credential lookup, network access, or real-service claims.
await mkdir('.sites-runtime',{recursive:true});
const source=await readFile('lib/coach/ai.ts','utf8');
const target=path.resolve('.sites-runtime/coach-ai-test.mjs');
await writeFile(target,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {aiConfig,aiCapabilities,createAIService}=await import(pathToFileURL(target).href+'?'+Date.now());
const config=aiConfig({COACH_AI_ENABLED:'true',COACH_OPENAI_API_KEY:'fixture-not-a-secret'});
assert.equal(aiConfig({COACH_OPENAI_API_KEY:'fixture'}),null);
assert.equal(aiConfig({COACH_AI_ENABLED:'true'}),null);
assert.equal(aiConfig({COACH_AI_ENABLED:'true',COACH_OPENAI_API_KEY:'fixture',COACH_FR_VOICE:'unknown'}),null);
assert.equal(aiCapabilities({}).status,'not_configured');
assert.equal(aiCapabilities({COACH_AI_ENABLED:'true',COACH_OPENAI_API_KEY:'fixture'}).status,'configured_unverified');
assert.equal(JSON.stringify(aiCapabilities({COACH_AI_ENABLED:'true',COACH_OPENAI_API_KEY:'fixture'})).includes('fixture'),false);
const audio=new Blob([new Uint8Array(200)],{type:'audio/webm;codecs=opus'});
const input={language:'fr-FR',level:'A1',mode:'guided',scenario:{role:'café waiter',goal:'order a drink',tasks:['request one drink']},turns:[{role:'user',text:'Un thé, s’il vous plaît.'}]};
const feedback={reply:'Sur place ou à emporter ?',translation:'堂食还是外带？',hint:'可以使用 sur place。',taskStatus:'in_progress',points:[]};
let calls=[];
const fixture=async(url,options)=>{
 calls.push({url,options});
 assert.equal(new Headers(options.headers).get('authorization'),'Bearer fixture-not-a-secret');
 assert.equal(options.redirect,'manual');
 assert.ok(options.signal);
 if(url.endsWith('/transcriptions')){assert.equal(options.body.get('language'),'fr');assert.equal(options.body.get('file').name,'recording.webm');return Response.json({text:'Bonjour.'},{headers:{'x-request-id':'test-asr'}})}
 if(url.endsWith('/speech'))return new Response(new Uint8Array(200),{headers:{'content-type':'audio/mpeg','x-request-id':'test-tts'}});
 return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(feedback)}]}]},{headers:{'x-request-id':'test-dialogue'}});
};
const service=createAIService(config,fixture);
assert.equal((await service.transcribe(audio,'fr-FR')).text,'Bonjour.');
assert.equal((await service.speak('Guten Tag.','de-DE')).audio.length,200);
assert.equal(JSON.parse(calls[1].options.body).voice,'sage');
assert.equal(JSON.parse(calls[1].options.body).input,'Guten Tag.');
const response=await service.dialogue(input);
assert.deepEqual(response.feedback,feedback);assert.equal(response.evidenceBasis,'text-only');assert.equal(response.pronunciationSupported,false);
const body=JSON.parse(calls[2].options.body);
assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.input.at(-1).content,input.turns[0].text);
const count=calls.length;
await assert.rejects(()=>service.transcribe(new Blob(['a'],{type:'audio/webm'}),'fr-FR'),e=>e.code==='invalid_input');
await assert.rejects(()=>service.transcribe(new Blob([new Uint8Array(200)],{type:'text/plain'}),'fr-FR'),e=>e.code==='invalid_input');
await assert.rejects(()=>service.speak('x'.repeat(1501),'fr-FR'),e=>e.code==='invalid_input');
assert.equal(calls.length,count);
let network=0;
await assert.rejects(()=>createAIService(null,async()=>{network++;throw Error('must not call')}).speak('Bonjour','fr-FR'),e=>e.code==='not_configured');
assert.equal(network,0);
for(const [status,code,retryable] of [[302,'unavailable',false],[401,'not_configured',false],[403,'not_configured',false],[429,'quota',false],[500,'unavailable',true]]){
 let attempts=0;const failed=createAIService(config,async()=>{attempts++;return new Response('PRIVATE PROVIDER DETAIL',{status})});
 await assert.rejects(()=>failed.dialogue(input),e=>e.code===code&&e.retryable===retryable&&!e.message.includes('PRIVATE'));
 assert.equal(attempts,1,'No automatic billable retries');
}
const timeout=createAIService(config,async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('private request')), {once:true})),5);
await assert.rejects(()=>timeout.dialogue(input),e=>e.code==='timeout');
const fromJSON=data=>createAIService(config,async()=>Response.json(data));
await assert.rejects(()=>fromJSON({text:''}).transcribe(audio,'de-DE'),e=>e.code==='unintelligible');
await assert.rejects(()=>fromJSON({status:'incomplete',output:[]}).dialogue(input),e=>e.code==='invalid_response');
await assert.rejects(()=>fromJSON({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}).dialogue(input),e=>e.code==='invalid_response');
await assert.rejects(()=>fromJSON({audio:'fake'}).speak('Bonjour','fr-FR'),e=>e.code==='invalid_response');
const point={kind:'natural',evidence:'Un thé',explanation:'表达正确，可添加完整请求。',suggestion:'Je voudrais un thé.'};
const fromFeedback=f=>fromJSON({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(f)}]}]});
await assert.rejects(()=>fromFeedback({...feedback,pronunciationScore:95}).dialogue(input),e=>e.code==='invalid_response');
await assert.rejects(()=>fromFeedback({...feedback,points:[point,point,point,point]}).dialogue(input),e=>e.code==='invalid_response');
const uncertain=await fromFeedback({...feedback,points:[{...point,evidence:'a quote the learner never said'}]}).dialogue(input);
assert.equal(uncertain.feedback.points[0].kind,'uncertain','Unmatched evidence must not become a definite learner error');
assert.equal(uncertain.feedback.points[0].evidence,'','A fabricated quotation must not be repeated as learner evidence');
const inventedTask=await fromFeedback({...feedback,points:[{kind:'task',evidence:'a task quote the learner never said',explanation:'任务未完成',suggestion:'补充请求'}]}).dialogue({...input,phase:'review'});
assert.equal(inventedTask.feedback.points[0].kind,'uncertain');assert.equal(inventedTask.feedback.points[0].evidence,'');
const genuineOmission=await fromFeedback({...feedback,points:[{kind:'task',evidence:'',explanation:'没有提出问题',suggestion:'请提问'}]}).dialogue({...input,phase:'review'});
assert.equal(genuineOmission.feedback.points[0].kind,'task','An omission may have no direct quote');
for(const mode of ['challenge','exam']){
 const r=await fromFeedback({...feedback,points:[point]}).dialogue({...input,mode});
 assert.deepEqual(r.feedback.points,[]);assert.equal(r.feedback.hint,'');
 const summary=await fromFeedback({...feedback,points:[point]}).dialogue({...input,mode,phase:'review'});
 assert.equal(summary.feedback.points.length,1);
}
const englishScenario={role:'A teammate',goal:'Report progress',task:'Say what is finished',opening:'How is the pilot going?',sourceClip:['The pilot is ready.','We meet at ten.'],requiredActions:['report-done'],followUps:['What is next?']};
const copiedText='THE PILOT IS READY!';
const copiedProvider={reply:'What is next?',translation:'下一步是什么？',hint:'说出你自己的进展。',taskStatus:'completed',actionEvidence:[{action:'report-done',evidence:copiedText}],points:[]};
const copied=await fromFeedback(copiedProvider).englishDialogue({difficulty:'basic',scenario:englishScenario,turns:[{role:'user',text:copiedText}]});
assert.equal(copied.feedback.taskStatus,'in_progress','Repeating the heard clip is not independent task completion');
assert.deepEqual(copied.feedback.actionEvidence,[],'Copied audio cannot satisfy an action even if the provider claims it does');
const ownText='I finished the pilot draft yesterday.';
const own=await fromFeedback({...copiedProvider,actionEvidence:[{action:'report-done',evidence:ownText}]}).englishDialogue({difficulty:'basic',scenario:englishScenario,turns:[{role:'user',text:ownText}]});
assert.equal(own.feedback.taskStatus,'completed','A distinct relevant answer can still complete a task');
console.log('PASS AI adapter contracts: disabled configuration, no secret disclosure, language-specific ASR/TTS, structured text feedback, timeout/permissions/quota/refusal handling, bounded content, no fabricated pronunciation, no automatic retries. Synthetic fixtures only; real services NOT verified.');


