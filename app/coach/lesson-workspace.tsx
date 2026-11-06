'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {api} from '@/lib/coach/client';
import type {CoachProfile} from '@/lib/coach/types';
import type {LessonJourney,LessonAttempt} from '@/lib/coach/lesson-types';
import type {ListeningSession} from '@/lib/coach/listening-types';
import {ListeningPractice} from './listening-workspace';
import {ConversationPanel,type Session} from './speaking-workspace';
import {PronunciationNotes} from './pronunciation-notes';
import {TextLesson} from './text-lesson';
type Stage='overview'|'text'|'listening'|'speaking';
export function LessonWorkspace({profile,attempt,onBack,onRefresh,onDirty}:{profile:CoachProfile;attempt:LessonAttempt;onBack:()=>void;onRefresh:()=>Promise<unknown>;onDirty:(v:boolean)=>void}){
 const [data,setData]=useState<LessonJourney|null>(null),[stage,setStage]=useState<Stage>('overview'),[listen,setListen]=useState<ListeningSession|null>(null),[oral,setOral]=useState<Session|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[consent,setConsent]=useState(false),[dirty,setDirty]=useState(false),[leave,setLeave]=useState<(()=>void)|null>(null);
 const alive=useRef(true),pending=useRef<{action:'listening'|'speaking';componentId:string;replaceConversationId?:string}|null>(null);
 const markDirty=useCallback((value:boolean)=>{setDirty(value);onDirty(value)},[onDirty]);
 const base={profileId:profile.id,attemptId:attempt.id};
 async function refresh(){const next=await api<LessonJourney>(`lessons?profileId=${profile.id}&attemptId=${attempt.id}`);if(alive.current)setData(next);return next}
 useEffect(()=>{alive.current=true;void refresh().catch(e=>{if(alive.current)setError(e.message)});return()=>{alive.current=false;onDirty(false)}},[profile.id,attempt.id,onDirty]);
 useEffect(()=>onDirty(dirty||busy),[dirty,busy,onDirty]);
 function navigate(fn:()=>void){if(dirty)setLeave(()=>fn);else fn()}
 async function run(fn:()=>Promise<void>){setBusy(true);setError('');try{await fn()}catch(e){if(alive.current)setError((e as Error).message)}finally{if(alive.current)setBusy(false)}}
 async function overview(){markDirty(false);setStage('overview');await run(async()=>{await refresh();await onRefresh()})}
 async function open(next:Stage,restart=false){
  if(next==='overview'){await overview();return}if(!data)return;
  if(next==='text'){setStage(next);return}
  await run(async()=>{
   let journey=data;const id=next==='listening'?journey.attempt.listening_id:journey.attempt.conversation_id;
   if(!id||restart){
    if(next==='speaking'&&!consent)throw new Error('请先阅读并确认录音处理说明。');
    const command=pending.current??{action:next,componentId:crypto.randomUUID(),...(restart&&id?{replaceConversationId:id}:{})};
    if(command.action!==next)throw new Error('上一次步骤尚待确认，请先重试原步骤或重新读取。');pending.current=command;
    journey=await api<LessonJourney>('lessons',{...base,...command,...(next==='speaking'?{consentVersion:'coach-ai-processing-v1'}:{})});pending.current=null;
    if(!alive.current)return;setData(journey);
   }
   if(next==='listening'){const value=await api<ListeningSession>(`listening?profileId=${profile.id}&attemptId=${journey.attempt.listening_id}`);if(alive.current)setListen(value)}
   else {const value=await api<Session>(`conversations?profileId=${profile.id}&conversationId=${journey.attempt.conversation_id}`);if(alive.current)setOral(value)}
   if(alive.current){markDirty(false);setStage(next)}
  });
 }
 async function finish(){await run(async()=>{const next=await api<LessonJourney>('lessons',{...base,action:'finish'});if(alive.current)setData(next);await onRefresh()})}
 const ready=data&&Object.values(data.steps).every(Boolean);
 return <><section className="coach-panel coach-course-journey"><div className="coach-actions"><Button variant="outline" disabled={busy} onClick={()=>navigate(onBack)}>返回课程列表</Button></div>{error&&<div className="coach-error" role="alert">{error}<Button disabled={busy} variant="outline" onClick={()=>navigate(()=>void run(async()=>{await refresh();pending.current=null;setStage('overview')}))}>重新读取本课</Button></div>}
 {!data?<p role="status">正在读取本课步骤…</p>:<><p className="coach-kicker">{data.lesson.level} · 本课学习路线</p>{stage==='overview'?<><h2>{data.lesson.title}</h2><p>{data.lesson.objective}</p></>:<p className="coach-note">{data.lesson.title} · {stage==='text'?'文字与理解':stage==='listening'?'精听与跟读':'开口练习'}</p>}<ol className="coach-lesson-steps"><li><span>文字与理解</span><strong>{data.steps.text?'已完成':'待练习'}</strong></li><li><span>示例音频</span><strong>{data.steps.listening?'已播放':'待播放'}</strong></li><li><span>开口与小结</span><strong>{data.steps.speaking?'已完成':'待练习'}</strong></li></ol>
 {stage==='overview'&&<><p>先认识词句，再听示例、完成理解与短表达，最后用自己的话交流。可分次练习，进度分别保存。</p><p className="coach-note">{data.capabilities.message} · AI 辅助原创，尚未人工审核。完成活动不代表掌握全部知识或达到等级。</p><div className="coach-actions"><Button disabled={busy} onClick={()=>void open('text')}>{data.steps.text?'回看文字与理解':'学习词句与理解'}</Button><Button variant="outline" disabled={busy} onClick={()=>void open('listening')}>本课示例音频与精听</Button></div>{data.pronunciation&&<PronunciationNotes guide={data.pronunciation} disabled={busy} onPractice={()=>void open('listening')}/>}<div className="coach-note-box"><h3>开口使用本课表达</h3><p>与本课角色交流，至少一轮录音获得回复后结束会话，并生成学习小结。纯文字练习单独保存，不替代开口步骤。</p>{!data.attempt.conversation_id||data.oral.finished&&!data.steps.speaking?<><p>提交录音后，OpenAI 处理音频转写；确认后的文字和对话用于教学反馈，回复文字用于语音合成。应用保留转写和练习记录，不长期保存原始录音。请使用虚构信息，避免真实敏感内容。</p><label className="coach-inline"><Checkbox checked={consent} disabled={busy} onCheckedChange={v=>setConsent(v===true)}/>我已了解并同意本次练习的数据处理</label></>:null}<div className="coach-actions"><Button disabled={busy||(!data.attempt.conversation_id&&!consent)} onClick={()=>void open('speaking')}>{data.attempt.conversation_id?'继续或回看本课口语':'开始本课开口练习'}</Button>{data.oral.finished&&!data.steps.speaking&&!data.attempt.full_completed_at&&<Button variant="outline" disabled={busy||!consent} onClick={()=>void open('speaking',true)}>重新进行本课口语</Button>}</div><p className="coach-note">本课当前会话：已保存录音 {(data.oral.recordingMs/1000).toFixed(1)} 秒，{data.oral.audioReplies} 轮录音获得回复。录音长度不等于有效说话时长；不评估发音。</p></div><h3>本课小结</h3><p>{data.attempt.full_completed_at?'本课三个步骤已完成并保存。可以从文字和听说反馈中选择需要再次练习的表达。':ready?'三个步骤已有记录，可以确认完成本课。':'尚未完成整课。已完成的文字或听说步骤会保留，服务不可用时可以稍后继续。'}</p><Button disabled={busy||!ready||Boolean(data.attempt.full_completed_at)} onClick={()=>void finish()}>{data.attempt.full_completed_at?'整课已完成':'确认完成本课'}</Button></>}
 </>}{busy&&<p role="status">正在读取或保存步骤…</p>}</section>
 {data&&stage==='text'&&<TextLesson grammar={data.grammar} lesson={data.lesson} attempt={data.attempt} profile={profile} onDirty={markDirty} onBack={()=>void overview()} onListen={()=>navigate(()=>void open('listening'))} onRefresh={async()=>{await refresh();return onRefresh()}}/>}
 {stage==='listening'&&listen&&<ListeningPractice backLabel="返回本课进度" key={listen.attempt.id} initial={listen} profile={profile} onDirty={markDirty} onBack={()=>void overview()}/>}
 {stage==='speaking'&&oral&&<ConversationPanel backLabel="返回本课进度" key={oral.conversation.id} initial={oral} profile={profile} onDirty={markDirty} onBack={()=>void overview()}/>}
 <AlertDialog open={leave!==null} onOpenChange={v=>{if(!v)setLeave(null)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>切换本课步骤？</AlertDialogTitle><AlertDialogDescription>未保存的答案或本机录音可能丢失，已经保存的步骤会保留。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>继续当前步骤</AlertDialogCancel><AlertDialogAction onClick={()=>{const fn=leave;setLeave(null);markDirty(false);fn?.()}}>确认离开</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}
