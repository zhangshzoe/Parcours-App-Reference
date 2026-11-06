import {dataHeaders,observeDataRevision} from '@/lib/data-revision';
import {withRequestDeadline} from './request-deadline';
export class AudioResponseError extends Error {
 constructor(message:string){super(message);this.name='AudioResponseError'}
}

export async function api<T=unknown>(path:string,body?:unknown,method='POST'):Promise<T>{
 const data=await withRequestDeadline(async signal=>{
  let response:Response;
  try {
   response=await fetch('/api/coach/'+path,body?{method,cache:'no-store',headers:dataHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body),signal}:{cache:'no-store',headers:dataHeaders(),signal});
  } catch {throw new Error('未能连接到服务，操作结果尚未确认。请保留页面，联网后检查保存状态再重试。')}
  let result:T&{error?:string;dataRevision?:number};
  try {result=await response.json() as T&{error?:string;dataRevision?:number}}
  catch {throw new Error('服务暂时无法返回结果。请稍后检查保存状态，再重试。')}
  if(!response.ok)throw new Error(result?.error||'操作失败，请重试。');
  return result;
 });
 // A late response after timeout must not change this tab's data generation.
 observeDataRevision(data?.dataRevision);return data;
}

/** Only succeeds after the complete audio body arrives; no URLs/playback before that. */
export function audioRequest(url:string,init:RequestInit):Promise<{response:Response;blob:Blob}>{
 return withRequestDeadline(async signal=>{
  let response:Response;
  try{response=await fetch(url,{...init,cache:'no-store',signal})}
  catch{throw new Error('音频连接中断，生成结果尚未确认。请先读取状态，稍后再重试。')}
  if(!response.ok){let result:{error?:string};try{result=await response.json()}catch{throw new AudioResponseError('未收到完整的音频结果，请先读取状态再重试。')}throw new AudioResponseError(result.error||'音频暂时无法生成，请先读取状态再重试。')}
  if(!response.headers.get('content-type')?.startsWith('audio/')){await response.body?.cancel();throw new AudioResponseError('没有取得有效音频，请先读取状态再重试。')}
  const blob=await response.blob();if(!blob.size)throw new AudioResponseError('收到的音频为空，请先读取状态再重试。');
  return {response,blob};
 },{signal:init.signal});
}
