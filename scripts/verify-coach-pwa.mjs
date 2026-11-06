import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const root=process.cwd();
const ts=(await import('typescript')).default;
const clientJS=ts.transpileModule(await fs.readFile('lib/coach/client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const revisionJS=ts.transpileModule(await fs.readFile('lib/data-revision.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const deadlineJS=ts.transpileModule(await fs.readFile('lib/coach/request-deadline.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function client(fetch){const exports={},revision={},deadline={};vm.runInNewContext(revisionJS,{exports:revision,Error});vm.runInNewContext(deadlineJS,{exports:deadline,Error,DOMException,AbortController,setTimeout,clearTimeout});vm.runInNewContext(clientJS,{exports,fetch,Error,require:name=>{if(name==='./request-deadline')return deadline;assert.equal(name,'@/lib/data-revision');return revision}});return exports.api}
await assert.rejects(()=>client(async()=>{throw new TypeError('network failed')})('profiles'),/操作结果尚未确认/);
await assert.rejects(()=>client(async()=>new Response('<html>gateway down</html>',{status:503}))('profiles'),/检查保存状态/);
await assert.rejects(()=>client(async()=>Response.json({error:'保存版本已更新'},{status:409}))('exams',{}),/保存版本已更新/);
await assert.rejects(()=>client(async()=>Response.json(null,{status:503}))('profiles'),/操作失败/);
for(const body of [undefined,{answer:'fixture'}]){
 const result=await client(async(url,options)=>{assert.equal(url,'/api/coach/exams');assert.equal(options.cache,'no-store');assert.equal(options.method,body?'POST':undefined);return Response.json({saved:true})})('exams',body);
 assert.equal(result.saved,true);
}
const script=await fs.readFile(path.join(root,'public/coach-sw.js'),'utf8');
const origin='https://parcours.test';
const publicTypes=new Map([
 ['/coach/offline.html','text/html'],['/coach/offline.css','text/css'],
 ['/coach/icon-192.png','image/png'],['/coach/icon-512.png','image/png'],
 ['/coach/icon-maskable-512.png','image/png'],['/coach/apple-touch-icon.png','image/png'],
 ['/coach/manifest.webmanifest','application/manifest+json'],
]);
const bodies=new Map(await Promise.all([...publicTypes.keys()].map(async url=>[url,await fs.readFile(path.join(root,'public',url))])));
function harness({network,stores=new Map()}={}) {
 const handlers={};const calls=[];let claims=0,skips=0;
 const key=value=>new URL(typeof value==='string'?value:value.url,origin).href;
 const caches={
  keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),
  open:async name=>{
   if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
   return {put:async(url,response)=>{store.set(key(url),response.clone())},match:async url=>store.get(key(url))?.clone()};
  },
 };
 vm.runInNewContext(script,{
  self:{location:{origin},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim(){claims++}},skipWaiting(){skips++}},
  caches,Request,Response,URL,
  fetch:async(request,options)=>{
   calls.push({request,options});
   if(network)return network(request,options);
   const url=new URL(request.url),asset=url.pathname==='/coach/offline'?'/coach/offline.html':url.pathname;return new Response(bodies.get(asset),{headers:{'Content-Type':publicTypes.get(asset)}});
  },
 });
 return {stores,calls,get claims(){return claims},get skips(){return skips},
  async lifecycle(name){let pending;handlers[name]({waitUntil:p=>pending=p});await pending},
  async request(url,mode='cors',method='GET'){
   let result;handlers.fetch({request:{url:new URL(url,origin).href,mode,method},respondWith:p=>result=p});
   return result?await result:null;
  },
 };
}
const first=harness();await first.lifecycle('install');await first.lifecycle('activate');
assert.equal(first.skips,0);assert.equal(first.claims,0);
const cacheName=[...first.stores.keys()][0];const cached=first.stores.get(cacheName);
assert.deepEqual([...cached.keys()].sort(),[...publicTypes.keys()].map(p=>origin+p).sort());
assert.equal(first.calls.length,7);
for(const {request} of first.calls){assert.equal(request.credentials,'omit');assert.equal(request.redirect,'error');assert.equal(request.cache,'reload')}
assert(first.calls.some(({request})=>new URL(request.url).pathname==='/coach/offline'));
assert(!first.calls.some(({request})=>new URL(request.url).pathname==='/coach/offline.html'));
const exactFiles=harness({network:async request=>{
 const url=new URL(request.url);
 if(url.pathname==='/coach/offline')return new Response('missing',{status:404});
 return new Response(bodies.get(url.pathname),{headers:{'Content-Type':publicTypes.get(url.pathname)}});
}});
await exactFiles.lifecycle('install');assert.equal(exactFiles.calls.length,8);
assert.equal(await (await exactFiles.request('/coach/offline.html')).text(),bodies.get('/coach/offline.html').toString());
for(const status of [401,403,500]){
 const denied=harness({network:async request=>{
  const url=new URL(request.url);
  if(url.pathname==='/coach/offline')return new Response('denied',{status});
  return new Response(bodies.get(url.pathname),{headers:{'Content-Type':publicTypes.get(url.pathname)}});
 }});
 await assert.rejects(()=>denied.lifecycle('install'));
 assert(!denied.calls.some(({request})=>new URL(request.url).pathname==='/coach/offline.html'));
}
// No accidental interception, caching, offline HTML, or background replay for private requests.
for(const [url,mode,method] of [
 ['/api/coach/profiles','cors','GET'],['/api/coach/exams?attemptId=private','cors','GET'],
 ['/api/coach/exam-responses','cors','POST'],['/api/state','cors','GET'],
 ['/signout-with-chatgpt','navigate','GET'],['/signin-with-chatgpt','navigate','GET'],
 ['/','navigate','GET'],['/coach-other','navigate','GET'],['/coach?_rsc=private','cors','GET'],
 ['/coach','cors','GET'],['/coach','navigate','POST'],['https://audio.example/private.wav','cors','GET'],
 ['/coach/recordings/private.wav','cors','GET'],['/coach/icon-192.png?token=private','cors','GET'],
 ])assert.equal(await first.request(url,mode,method),null,url);
assert.equal(first.calls.length,7);
const offline=harness({stores:first.stores,network:async()=>{throw new Error('disconnected')}});
for(const url of ['/coach','/coach/','/coach?profile=private']){
 const result=await offline.request(url,'navigate');assert.equal(result.status,503);assert.equal(result.headers.get('cache-control'),'no-store');
 const html=await result.text();assert.match(html,/这些功能需要联网/);assert.match(html,/AI 回复/);assert.match(html,/断网不会暂停考试/);assert(!html.includes('profile=private'));
}
for(const url of publicTypes.keys())assert.equal((await offline.request(url)).status,200);
assert.equal(cached.size,7);
const successful=harness({stores:first.stores,network:async()=>new Response('private history',{headers:{'Cache-Control':'private, no-store'}})});
assert.equal(await(await successful.request('/coach','navigate')).text(),'private history');
assert.equal(successful.calls[0].options.cache,'no-store');assert.equal(cached.size,7);
for(const status of [302,401,403,404]){
 const server=harness({stores:first.stores,network:async()=>new Response('auth or server response',{status,headers:{Location:'/signin-with-chatgpt'}})});
 assert.equal((await server.request('/coach','navigate')).status,status);
}
for(const status of [500,503]){
 const server=harness({stores:first.stores,network:async()=>new Response('private error',{status})});
 assert.match(await(await server.request('/coach','navigate')).text(),/连接恢复后/);
}
const cleared=harness({network:async()=>{throw new Error('offline')}});
assert.match(await(await cleared.request('/coach','navigate')).text(),/暂时无法连接/);
// Fail closed on authentication HTML, private headers, redirect or missing precache assets.
for(const headers of [{'Content-Type':'application/json'},{'Cache-Control':'no-store'},{'Cache-Control':'private'},{'Set-Cookie':'private=1'}]){
 const unsafe=harness({network:async request=>{const url=new URL(request.url).pathname,asset=url==='/coach/offline'?'/coach/offline.html':url;return new Response('not public',{headers:{'Content-Type':publicTypes.get(asset),...headers}})}});
 await assert.rejects(()=>unsafe.lifecycle('install'));assert.equal(unsafe.stores.size,0);
}
const redirected=harness({network:async()=>({ok:true,redirected:true,headers:new Headers({'Content-Type':'text/html'})})});
await assert.rejects(()=>redirected.lifecycle('install'));
const missing=harness({network:async()=>new Response('missing',{status:404})});await assert.rejects(()=>missing.lifecycle('install'));
const stores=new Map([['unrelated-app-cache',new Map()],[cacheName,new Map()],['parcours-coach-public-old',new Map()]]);
const update=harness({stores});await update.lifecycle('activate');assert(stores.has('unrelated-app-cache'));assert(stores.has(cacheName));assert(!stores.has('parcours-coach-public-old'));
const manifest=JSON.parse(await fs.readFile(path.join(root,'public/coach/manifest.webmanifest'),'utf8'));
assert.equal(manifest.id,'/coach');assert.equal(manifest.start_url,'/coach');assert.equal(manifest.scope,'/coach');assert.equal(manifest.display,'standalone');
assert.equal(manifest.prefer_related_applications,false);
for(const icon of manifest.icons){const png=await fs.readFile(path.join(root,'public',icon.src));assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(icon.sizes,`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`)}
const html=bodies.get('/coach/offline.html').toString();assert(!/<script/i.test(html));assert(!/https?:\/\//.test(html));
for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g))assert(match[1]==='/coach'||publicTypes.has(match[1]),'offline dependency missing from allowlist');
console.log('PASS: public-only precache, omitted credentials, private/API/RSC bypass, network-only user pages, navigation fallback, auth/status preservation, cache cleanup isolation, no forced activation, manifest and PNG dimensions.');
// Exercise the built asset router as well: Vite dev serving alone does not prove production URLs.
const {Miniflare}=await import('miniflare');
const built=await fs.readdir('dist/server',{recursive:true});
const config=JSON.parse(await fs.readFile('dist/server/wrangler.json','utf8'));
assert.equal(config.assets.html_handling,'none');
const mf=new Miniflare({
 modules:['index.js',...built.filter(f=>f.endsWith('.js')&&f!=='index.js')].map(f=>({type:'ESModule',path:path.resolve('dist/server',f)})),
 modulesRoot:path.resolve('dist/server'),compatibilityDate:config.compatibility_date,compatibilityFlags:config.compatibility_flags,cf:false,
 d1Databases:{DB:'pwa-isolated'},assets:{directory:path.resolve('dist/server',config.assets.directory),routerConfig:{has_user_worker:true},assetConfig:{html_handling:config.assets.html_handling}},
 outboundService:()=>{throw new Error('PWA test must not call external services')},
});
try {
 for(const [url,type] of publicTypes){
  const response=await mf.dispatchFetch('http://localhost'+url,{redirect:'manual'});
  assert.equal(response.status,200,url);assert.equal(response.headers.get('location'),null,url);
  assert.equal(response.headers.get('content-type')?.split(';')[0],type);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),bodies.get(url));
 }
 const sw=await mf.dispatchFetch('http://localhost/coach-sw.js',{redirect:'manual'});
 assert.equal(sw.status,200);assert.match(sw.headers.get('content-type'),/javascript/);assert.equal(await sw.text(),script);
 const coach=await mf.dispatchFetch('http://localhost/coach');assert.equal(coach.status,200);const coachHTML=await coach.text();
 assert.match(coachHTML,/rel="manifest"[^>]*href="\/coach\/manifest.webmanifest"/);
 assert.match(coachHTML,/apple-touch-icon/);assert.match(coachHTML,/viewport-fit=cover/);
 const legacy=await mf.dispatchFetch('http://localhost/');assert.equal(legacy.status,200);assert(!/<link[^>]*rel="manifest"/.test(await legacy.text()));
 const unauthorized=await mf.dispatchFetch('http://localhost/api/coach/profiles');assert.equal(unauthorized.status,401);assert.match(unauthorized.headers.get('cache-control'),/no-store/);
 console.log('PASS: built asset router serves exact precache URLs without redirects; coach metadata present; original route preserved; private API still authenticated and no-store.');
} finally {await mf.dispose()}
