'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {createCaptureSession,type CaptureView,type Recording} from '@/lib/coach/recording-capture';
export type {Recording} from '@/lib/coach/recording-capture';
export function Recorder({disabled,onRecording,onBusy}:{disabled:boolean;onRecording:(recording:Recording|null)=>void;onBusy:(busy:boolean)=>void}){
 const [view,setView]=useState<CaptureView>({state:'idle',seconds:0,error:''}),[url,setUrl]=useState('');
 const session=useRef<ReturnType<typeof createCaptureSession>|null>(null),audioUrl=useRef('');
 const callbacks=useRef({onRecording,onBusy});callbacks.current={onRecording,onBusy};
 useEffect(()=>{
  const capture=createCaptureSession({
   view:next=>{setView(next);callbacks.current.onBusy(['requesting','recording','processing'].includes(next.state))},
   result:recording=>{if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current=recording?URL.createObjectURL(new Blob([recording.bytes.slice().buffer as ArrayBuffer],{type:'audio/wav'})):'';setUrl(audioUrl.current);callbacks.current.onRecording(recording)}
  });session.current=capture;
  return()=>{capture.dispose();session.current=null;if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current=''};
 },[]);
 const {state,seconds,error}=view;
 return <div className="coach-recorder"><p role="status">{{idle:'待开始录音',requesting:'等待麦克风权限…',recording:`正在录音 · ${seconds} 秒`,processing:'正在检查录音…',ready:'录音已就绪，请先试听'}[state]}</p>
  <div className="coach-actions">{state==='recording'?<Button onClick={()=>session.current?.stop()}>停止录音</Button>:<Button variant="outline" disabled={disabled||state==='requesting'||state==='processing'} onClick={()=>void session.current?.start()}>{state==='ready'?'重新录音':'开始录音'}</Button>}
  {(state==='requesting'||state==='processing')&&<Button variant="outline" onClick={()=>session.current?.cancel()}>{state==='requesting'?'取消麦克风请求':'取消录音处理'}</Button>}</div>
  {url&&<audio controls src={url} preload="metadata" aria-label="试听我的录音"/>}
  <p className="coach-note">每次最多 60 秒。录音先留在当前页面，点击提交后才发送；刷新或离开会丢失未提交录音。</p>
  {state==='requesting'&&<p className="coach-note">可随时取消。浏览器权限提示可能仍在，但取消后即使授权也不会开始录音。</p>}
  {error&&<p role="alert" className="coach-error">{error}</p>}
 </div>;
}
