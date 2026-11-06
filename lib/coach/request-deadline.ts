export class RequestTimeoutError extends Error {
 constructor(){super('请求等待超时，操作结果尚未确认。请保留输入，先读取保存状态，再决定是否重试。');this.name='RequestTimeoutError'}
}
export const CLIENT_REQUEST_TIMEOUT_MS=45000;

/** Bound fetch AND response consumption. Never automatically replay a write. */
export async function withRequestDeadline<T>(read:(signal:AbortSignal)=>Promise<T>,options:{signal?:AbortSignal|null;timeoutMs?:number}={}):Promise<T>{
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
 let detach=()=>{};
 const cancelled=()=>new DOMException('请求已取消。','AbortError');
 const interrupted=new Promise<never>((_,reject)=>{
  const cancel=()=>{reject(cancelled());controller.abort()};
  if(options.signal?.aborted){cancel();return}
  options.signal?.addEventListener('abort',cancel,{once:true});detach=()=>options.signal?.removeEventListener('abort',cancel);
  timer=setTimeout(()=>{reject(new RequestTimeoutError());controller.abort()},options.timeoutMs??CLIENT_REQUEST_TIMEOUT_MS);
 });
 try {
  return await Promise.race([interrupted,Promise.resolve().then(()=>{if(controller.signal.aborted)throw cancelled();return read(controller.signal)})]);
 }finally{if(timer!==undefined)clearTimeout(timer);detach()}
}
