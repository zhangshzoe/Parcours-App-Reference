import {encodeWav,inspectWav} from './wav';

export type Recording={bytes:Uint8Array;durationMs:number};
export type CaptureState='idle'|'requesting'|'recording'|'processing'|'ready';
export type CaptureView={state:CaptureState;seconds:number;error:string};
type Callbacks={view:(view:CaptureView)=>void;result:(recording:Recording|null)=>void};
export type CaptureEnvironment={
 available:()=>boolean;hidden:()=>boolean;getMedia:()=>Promise<MediaStream>;
 recorder:(stream:MediaStream)=>MediaRecorder;
 decode:(blob:Blob,signal:AbortSignal)=>Promise<Recording>;
 subscribe:(hidden:()=>void,leaving:()=>void)=>()=>void;
 now:()=>number;setTimeout:typeof setTimeout;clearTimeout:typeof clearTimeout;
 setInterval:typeof setInterval;clearInterval:typeof clearInterval;
};
const MAX_BYTES=8*1024*1024;

/** One local capture. Cancellation invalidates late permission, stop and decode callbacks. */
export function createCaptureSession(callbacks:Callbacks,env:CaptureEnvironment=browserCaptureEnvironment()) {
 let view:CaptureView={state:'idle',seconds:0,error:''},generation=0,disposed=false;
 let rec:MediaRecorder|null=null,media:MediaStream|null=null,abort:AbortController|null=null;
 let clock:ReturnType<typeof setInterval>|null=null,deadline:ReturnType<typeof setTimeout>|null=null;
 let unsubscribe:()=>void=()=>{},untrack:()=>void=()=>{};
 const publish=(next:Partial<CaptureView>)=>{view={...view,...next};if(!disposed)callbacks.view(view)};
 const current=(token:number)=>!disposed&&token===generation;
 function release(){
  unsubscribe();unsubscribe=()=>{};untrack();untrack=()=>{};
  if(clock!==null)env.clearInterval(clock);if(deadline!==null)env.clearTimeout(deadline);clock=null;deadline=null;
  media?.getTracks().forEach(t=>t.stop());media=null;
 }
 function cancel(message='已取消本次录音。'){
  generation++;abort?.abort();abort=null;
  const old=rec;rec=null;
  if(old){old.ondataavailable=null;old.onstop=null;old.onerror=null;try{if(old.state!=='inactive')old.stop()}catch{/* still release the microphone */}}
  release();if(!disposed)callbacks.result(null);publish({state:'idle',seconds:0,error:message});
 }
 function stop(message=''){
  if(view.state!=='recording'||!rec)return;
  publish({state:'processing',error:message});
  // Stop live tracks promptly, even if the final MediaRecorder event is delayed.
  const active=rec;try{active.stop();release();deadline=env.setTimeout(()=>cancel('录音处理超时，请重新录音。'),30000)}catch{cancel('录音被中断，请重新录音。')}
 }
 async function start(){
  if(disposed||['requesting','recording','processing'].includes(view.state))return;
  cancel('');
  if(!env.available()){publish({error:'此浏览器暂不能录音。请使用支持麦克风的浏览器并通过 HTTPS 访问。'});return}
  if(env.hidden()){publish({error:'请回到当前页面后再开始录音。'});return}
  const token=generation;publish({state:'requesting',seconds:0,error:''});
  unsubscribe=env.subscribe(()=>{if(!env.hidden())return;if(view.state==='requesting')cancel('页面进入后台，已取消麦克风请求。回到页面后请重新开始。');else if(view.state==='recording')stop('页面进入后台，已停止录音。请试听后决定是否提交。')},()=>cancel('页面已离开，本次未提交录音已丢弃。'));
  try{
   const incoming=await env.getMedia();
   if(!current(token)){incoming.getTracks().forEach(t=>t.stop());return}
   media=incoming;
   if(env.hidden()){cancel('页面进入后台，已取消麦克风请求。回到页面后请重新开始。');return}
   const tracks=incoming.getAudioTracks();
   if(!tracks.length||tracks.some(t=>t.readyState!=='live'||t.muted)){cancel('麦克风没有可用声音轨道，请检查设备后重新录音。');return}
   const active=env.recorder(incoming);rec=active;const chunks:BlobPart[]=[];let size=0;
   const interrupted=()=>{if(current(token))cancel('麦克风连接或声音采集中断，本次录音未保留。请检查设备后重新录音。')};
   tracks.forEach(t=>{t.addEventListener('ended',interrupted);t.addEventListener('mute',interrupted)});
   untrack=()=>tracks.forEach(t=>{t.removeEventListener('ended',interrupted);t.removeEventListener('mute',interrupted)});
   active.ondataavailable=e=>{if(!current(token)||!e.data.size)return;chunks.push(e.data);size+=e.data.size;if(size>MAX_BYTES)cancel('录音文件过大，请缩短后重新录音。')};
   active.onerror=()=>{if(current(token))cancel('录音被中断，请重新录音。')};
   active.onstop=async()=>{
    if(!current(token))return;
    release();rec=null;publish({state:'processing'});
    const controller=new AbortController();abort=controller;
    deadline=env.setTimeout(()=>cancel('录音处理超时，请重新录音。'),30000);
    try{
     if(!size||size>MAX_BYTES)throw Error('录音为空或过大，请重新录音。');
     const result=await env.decode(new Blob(chunks,{type:active.mimeType}),controller.signal);
     if(!current(token))return;
     callbacks.result(result);publish({state:'ready'});
    }catch(e){if(current(token))cancel(e instanceof Error?e.message:'无法读取录音，请重新录音。')}
    finally{if(current(token)){release();abort=null}}
   };
   active.start(250);const began=env.now();publish({state:'recording'});
   clock=env.setInterval(()=>{if(current(token))publish({seconds:Math.min(60,Math.floor((env.now()-began)/1000))})},250);
   deadline=env.setTimeout(()=>stop(),60000);
  }catch(e){if(!current(token))return;const name=e instanceof Error?e.name:'';cancel(name==='NotAllowedError'?'麦克风权限被拒绝。请在浏览器网站权限中允许麦克风，然后重试。':name==='NotFoundError'?'未找到麦克风，请连接后重试。':'麦克风暂时不可用，请检查是否被其他应用占用。')}
 }
 return {start,stop,cancel,dispose(){disposed=true;cancel('')}};
}

export async function decodeRecording(blob:Blob,signal:AbortSignal):Promise<Recording>{
 signal.throwIfAborted();const context=new AudioContext();
 const close=()=>{void context.close().catch(()=>{})};signal.addEventListener('abort',close,{once:true});
 try{
  const source=await context.decodeAudioData(await blob.arrayBuffer());signal.throwIfAborted();
  const length=Math.min(960000,Math.floor(source.duration*16000));
  if(length<8000)throw Error('录音太短，请至少说半秒钟后再停止。');
  const offline=new OfflineAudioContext(1,length,16000),node=offline.createBufferSource();node.buffer=source;node.connect(offline.destination);node.start();
  const resampled=await offline.startRendering();signal.throwIfAborted();
  const bytes=encodeWav(resampled.getChannelData(0)),info=inspectWav(bytes);return {bytes,durationMs:info.durationMs};
 }finally{signal.removeEventListener('abort',close);await context.close().catch(()=>{})}
}
function browserCaptureEnvironment():CaptureEnvironment{return {
 available:()=>Boolean(window.isSecureContext&&typeof navigator.mediaDevices?.getUserMedia==='function'&&typeof MediaRecorder!=='undefined'&&typeof AudioContext!=='undefined'&&typeof OfflineAudioContext!=='undefined'),
 hidden:()=>document.hidden,getMedia:()=>navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false}),
 recorder:media=>{const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>MediaRecorder.isTypeSupported(type));return new MediaRecorder(media,mime?{mimeType:mime}:undefined)},
 decode:decodeRecording,now:()=>performance.now(),setTimeout,clearTimeout,setInterval,clearInterval,
 subscribe:(hidden,leaving)=>{document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leaving);return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leaving)}}
}}
