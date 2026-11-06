'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Recorder,type Recording} from '@/app/coach/recorder';
import {PrivacyPanel} from '@/app/coach/privacy-panel';
import {createAudioSubmission,type AudioSubmission} from '@/lib/coach/audio-submission';
import {audioRequest} from '@/lib/coach/client';
import {withRequestDeadline} from '@/lib/coach/request-deadline';
import {dataHeaders,observeDataRevision} from '@/lib/data-revision';
import {clearEnglishReviewDraft,englishReviewStorage,readEnglishReviewDraft,writeEnglishReviewDraft,type EnglishReviewPending} from '@/lib/english/review-draft';
import {clearEnglishSessionDraft,englishSessionStorage,readEnglishSessionDraft,writeEnglishSessionDraft,type EnglishAudioCommand,type EnglishResponseCommand,type EnglishTextCommand} from '@/lib/english/session-draft';
import {playEnglishDeviceSpeech} from '@/lib/english/device-speech';
import type {EnglishOverview,EnglishProfile,EnglishReview,EnglishSession,EnglishTurn} from '@/lib/english/types';
import {ENGLISH_AI_FEEDBACK_CONSENT_VERSION,ENGLISH_CONSENT_VERSION} from '@/lib/english/types';

async function request<T>(body?:unknown,query=''):Promise<T>{
 const result=await withRequestDeadline(async signal=>{
  let response:Response;try{response=await fetch('/api/english'+query,body?{method:'POST',headers:dataHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body),cache:'no-store',signal}:{headers:dataHeaders(),cache:'no-store',signal})}
  catch{throw new Error('网络中断，保存结果未确认。请保留当前页面，联网后先读取记录。')}
  let data:T&{error?:string;dataRevision?:number};try{data=await response.json() as T&{error?:string;dataRevision?:number}}catch{throw new Error('未收到完整的保存结果，请读取记录后再试。')}
  if(!response.ok)throw new Error(data.error||'操作未完成，请重试。');return data;
 });observeDataRevision(result?.dataRevision);return result;
}
const formatTime=(time:number)=>new Date(time).toLocaleString('zh-CN');

export default function EnglishApp({signedIn,signInHref}:{signedIn:boolean;signInHref:string}){
 const [overview,setOverview]=useState<EnglishOverview|null>(null),[active,setActive]=useState<EnglishSession|null>(null),[busy,setBusy]=useState(false),[privacyBusy,setPrivacyBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[minutes,setMinutes]=useState<10|20|30>(20);
 const profileCommand=useRef<{id:string;command:string;minutes:10|20|30;revision?:number}|null>(null),startCommand=useRef<{id:string;scenarioId:string}|null>(null);
 const load=useCallback(async()=>{const data=await request<EnglishOverview>();setOverview(data);if(data.profile)setMinutes(data.profile.dailyMinutes);if(startCommand.current&&data.sessions.some(s=>s.id===startCommand.current?.id))startCommand.current=null;return data},[]);
 useEffect(()=>{if(!signedIn)return;let live=true;request<EnglishOverview>().then(data=>{if(live){setOverview(data);if(data.profile)setMinutes(data.profile.dailyMinutes)}}).catch(e=>{if(live)setError((e as Error).message)});return()=>{live=false}},[signedIn]);
 async function run(work:()=>Promise<void>){if(privacyBusy){setError('数据管理操作进行中，请完成后再继续学习。');return}setBusy(true);setError('');setNotice('');try{await work()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function saveProfile(){await run(async()=>{const cmd=profileCommand.current??{id:overview?.profile?.id??crypto.randomUUID(),command:crypto.randomUUID(),minutes,revision:overview?.profile?.revision};profileCommand.current=cmd;
  await request<{profile:EnglishProfile}>({action:'profile',profileId:cmd.id,commandId:cmd.command,dailyMinutes:cmd.minutes,...(cmd.revision===undefined?{}:{expectedRevision:cmd.revision})});profileCommand.current=null;await load();setNotice('每日学习时间已保存。')})}
 async function start(scenarioId:string){await run(async()=>{if(startCommand.current&&startCommand.current.scenarioId!==scenarioId)throw new Error('请先读取上一场景的保存状态，再选择另一个场景。');const cmd=startCommand.current??{id:crypto.randomUUID(),scenarioId};startCommand.current=cmd;const data=await request<{session:EnglishSession}>({action:'start',profileId:overview!.profile!.id,sessionId:cmd.id,scenarioId:cmd.scenarioId});startCommand.current=null;setActive(data.session)})}
 async function open(id:string){await run(async()=>{const data=await request<{session:EnglishSession}>(undefined,`?profileId=${overview!.profile!.id}&sessionId=${id}`);setActive(data.session)})}
 async function back(){setActive(null);await load().catch(e=>setError((e as Error).message))}
 if(!signedIn)return <div className="coach-shell"><header className="coach-header"><Link className="coach-brand" href="/">parcours<span>.</span></Link><span>英语听说 · 内测开发中</span></header><main className="coach-main english-mini"><section className="coach-panel"><h1>英语听说练习</h1><p>登录后保存听辨、录音转写、每轮回答与复习记录。</p><Button asChild><a href={signInHref} target="_top">登录并开始</a></Button></section></main></div>;
 return <div className="coach-shell"><header className="coach-header english-header"><Link className="coach-brand" href="/">parcours<span>.</span></Link><span className="coach-release">英语听说 · 内测开发中</span><Link className="coach-text-link" href="/coach">法语备考</Link></header><main className="coach-main english-mini">
  <div className="coach-title"><p>ENGLISH · LISTEN & SPEAK</p><h1>听懂重点，说清下一步。</h1><p>五个日常与工作场景；难度由你选择，不是水平测评。</p></div>
  {error&&<div className="coach-error" role="alert">{error}<Button variant="outline" disabled={busy} onClick={()=>void load().then(()=>setError('')).catch(e=>setError((e as Error).message))}>读取已保存记录</Button></div>}{notice&&<p role="status" className="coach-note-box">{notice}</p>}
  {!overview?<p role="status">正在读取英语学习记录…</p>:!overview.profile?<section className="coach-panel"><h2>建立英语听说目标</h2><p>默认每天 20 分钟，可随时改为 10 或 30 分钟。日期与练习难度不代表已评定水平。</p><Minutes value={minutes} onChange={setMinutes} disabled={busy}/><Button disabled={busy} onClick={()=>void saveProfile()}>{busy?'保存中…':'保存并查看场景'}</Button></section>:active?<SessionPanel key={active.id} initial={active} profile={overview.profile} configured={overview.capabilities.configured} onBack={()=>void back()}/>:<>
   <section className="coach-panel"><h2>今日学习</h2><p>根据已保存的到期复习和练习记录安排下一步；完成一次不代表掌握英语等级。</p><div className="english-control"><label htmlFor="english-minutes">每天可用时间</label><Minutes id="english-minutes" value={minutes} onChange={value=>{setMinutes(value);profileCommand.current=null}} disabled={busy}/><Button variant="outline" disabled={busy||minutes===overview.profile.dailyMinutes} onClick={()=>void saveProfile()}>保存时间</Button></div><p>到期复习：{overview.dueReviews} 条 · 今日服务调用：{overview.dailyCalls.used}/{overview.dailyCalls.limit}</p><p className="coach-note">{overview.capabilities.message}</p><EnglishToday overview={overview} busy={busy} onOpen={open} onStart={start}/></section>
   <EnglishLearningProfile overview={overview}/>
   {overview.reviews.length>0&&<ReviewPanel profileId={overview.profile.id} items={overview.reviews} totalDue={overview.dueReviews} onChange={load}/>}
   <section className="coach-panel"><h2>选择场景</h2><p className="coach-note">内容为虚构案例 · AI 辅助原创 · 尚未经过英语教师审核。每次最多三轮回答。</p><div className="english-grid">{overview.scenarios.map(s=><article className="english-review-card" key={s.id}><span className="coach-kicker">{s.difficulty==='basic'?'基础':'进阶'} · 版本 {s.version}</span><h3>{s.title}</h3><p>{s.goal}</p><Button disabled={busy} onClick={()=>void start(s.id)}>开始听说练习</Button></article>)}</div></section>
   <section className="coach-panel"><h2>学习记录</h2>{overview.sessions.length===0?<p>还没有已保存的英语练习。</p>:overview.sessions.map(s=><div className="coach-phrase" key={s.id}><div><strong>{overview.scenarios.find(c=>c.id===s.scenarioId)?.title??s.scenarioId} · {s.difficulty==='advanced'?'进阶':'基础'}</strong><p>{formatTime(s.createdAt)} · {s.status==='finished'?'已结束':s.status==='speaking'?'回应中':'听辨中'} · 首次听辨 {s.listeningCorrect===null?'未提交':`${s.listeningCorrect}/${s.listeningTotal}（${s.listeningAssisted?'辅助后':'未使用辅助'}）`} · 回答 {s.turns} 轮</p></div><Button variant="outline" disabled={busy} onClick={()=>void open(s.id)}>查看或继续</Button></div>)}</section>
   <PrivacyPanel language="en-US" onBusy={setPrivacyBusy} onDeleted={()=>window.location.reload()}/>
   <p className="coach-note">英语学习记录按账号独立保存，原始录音不会长期保存在本应用；已确认的转写与反馈会保存。</p>
  </>}
 </main></div>;
}

function Minutes({id,value,onChange,disabled}:{id?:string;value:10|20|30;onChange:(value:10|20|30)=>void;disabled:boolean}){return <select id={id} aria-label="每天可用时间" disabled={disabled} value={value} onChange={e=>onChange(Number(e.target.value) as 10|20|30)}>{[10,20,30].map(n=><option value={n} key={n}>{n} 分钟</option>)}</select>}

function EnglishLearningProfile({overview}:{overview:EnglishOverview}){
 const {listening,task,issues}=overview.progress;
 return <section className="coach-panel"><h2>学习档案</h2><p className="coach-note">按本账号全部已保存英语练习和复习项汇总；下方历史列表仍只显示最近 40 次，可操作复习卡每次载入最多 50 条。不能据此换算英语等级、发音分数或正式测评结果。</p>
  <p><strong>首次听辨：</strong>{listening.submitted?`已提交 ${listening.submitted} 次；未使用辅助 ${listening.independent.attempts} 次${listening.independent.attempts?`（答对 ${listening.independent.correct}/${listening.independent.total} 题）`:''}，辅助后 ${listening.assisted.attempts} 次${listening.assisted.attempts?`（答对 ${listening.assisted.correct}/${listening.assisted.total} 题）`:''}。`:'尚无已提交记录。'}{listening.submitted>0&&listening.submitted<3?' 样本较少，先继续练习不同场景。':''}</p>
  <p><strong>到期后听辨复习：</strong>{overview.delayedListening.deviceVoiceCorrect||overview.delayedListening.textAssistedCorrect?`设备朗读后答对 ${overview.delayedListening.deviceVoiceCorrect} 次，文字辅助后答对 ${overview.delayedListening.textAssistedCorrect} 次。`:'尚无已保存的到期后客观答对记录。'}这些是复习事件次数，均不计作首次独立听辨。</p>
  <p><strong>任务要点：</strong>{task.assessed?`有 AI 文字反馈的练习 ${task.assessed} 次，最近一次反馈判断已完成 ${task.completed} 次${task.uncertain?`、判断不确定 ${task.uncertain} 次`:''}。`:'尚无 AI 文字反馈，无法判断完成情况。'}{task.assessed>0&&task.assessed<3?' 样本较少，暂不推断稳定能力。':''}</p>
  <p><strong>表达问题：</strong>{issues.saved?`已收藏 ${issues.saved} 条表达或任务问题。`:'尚未收藏表达或任务问题。'}{issues.repeated.length?' 全部已保存复习项中，同一反馈说明重复出现：':' 目前没有足够的相同反馈来判断重复问题。'}</p>
  {issues.repeated.length>0&&<ul>{issues.repeated.map(item=><li key={`${item.kind}:${item.explanation}`}>{item.explanation}（{item.count} 条）</li>)}</ul>}
  <p className="coach-note">任务判断只依据已确认的回答文字；录音的发音、重音和停顿没有评估。可进入单次记录查看听辨题与逐轮反馈。</p>
 </section>;
}

function EnglishToday({overview,busy,onOpen,onStart}:{overview:EnglishOverview;busy:boolean;onOpen:(id:string)=>Promise<void>;onStart:(id:string)=>Promise<void>}){
 const due=overview.dueReviews;
 const current=overview.unfinishedSession;
 const attempted=new Set(overview.attemptedScenarioIds);
 const next=overview.scenarios.find(s=>s.difficulty==='basic'&&!attempted.has(s.id))??overview.scenarios.find(s=>!attempted.has(s.id));
 const repeat=overview.scenarios.find(s=>s.difficulty==='basic');
 const recap=overview.sessions.find(s=>s.status==='finished')??overview.sessions.find(s=>s.listeningCorrect!==null&&s.id!==current?.id);
 const currentTitle=current?overview.scenarios.find(s=>s.id===current.scenarioId)?.title??'上次练习':'';
 return <><p className="coach-note">按已保存的每日 {overview.profile?.dailyMinutes??20} 分钟从左到右选做；时间不够可留到下次，计划不计作实际学习时长。</p><div className="english-grid english-today-steps">
  <article className="english-review-card"><h3>1 · 到期复习</h3><p>{due?`${due} 条问题到期。先换一个情境回忆，再看参考。`:'目前没有到期问题；下一次复习按已保存的间隔出现。'}</p>{due>0&&<Button variant="outline" disabled={busy} onClick={()=>document.getElementById('english-due-reviews')?.scrollIntoView({behavior:'smooth',block:'start'})}>前往到期复习</Button>}</article>
  <article className="english-review-card"><h3>2 · 听辨与回应</h3>{current?<><p>{currentTitle}：{current.status==='speaking'?'已保存听辨，继续用自己的话回应。':'继续完成尚未提交的听辨。'}</p><Button disabled={busy} onClick={()=>void onOpen(current.id)}>继续上次练习</Button></>:next||repeat?<><p>{next?'下一场景':'全部场景已尝试，可再练'}：{(next??repeat)?.title}。{overview.capabilities.configured?'听辨后继续口头回应。':'可先练听辨；AI 追问和转写待配置。'}</p><Button disabled={busy} onClick={()=>void onStart((next??repeat)!.id)}>{next?'开始推荐场景':'再练一个场景'}</Button></>:<p>暂无可用场景。</p>}</article>
  <article className="english-review-card"><h3>3 · 回看与复盘</h3>{recap?<><p>回看上次的听辨答案和辅助使用{recap.turns>0?'、逐轮回答与反馈':''}，再决定要复习什么。</p><Button variant="outline" disabled={busy} onClick={()=>void onOpen(recap.id)}>查看已保存练习</Button></>:<p>{current?.status==='speaking'?'本次听辨解析可从上方继续入口查看；结束练习后这里会单列复盘。':'结束一次练习后，这里会出现可回看的记录。'}</p>}</article>
 </div></>;
}

function SessionPanel({initial,profile,configured,onBack}:{initial:EnglishSession;profile:EnglishProfile;configured:boolean;onBack:()=>void}){
 const [savedDraft]=useState(()=>readEnglishSessionDraft(englishSessionStorage(),profile.id,initial));
 const [session,setSession]=useState(initial),[answers,setAnswers]=useState<Record<string,number>>({...initial.answers,...savedDraft.answers}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[rate,setRate]=useState(1);
 const [recording,setRecording]=useState<Recording|null>(null),[recordBusy,setRecordBusy]=useState(false),[text,setText]=useState(savedDraft.text),[edit,setEdit]=useState(()=>{const pending=initial.turns.find(t=>t.state!=='replied');return savedDraft.edit??pending?.acceptedText??pending?.originalTranscript??''}),[consent,setConsent]=useState(false),[feedbackConsent,setFeedbackConsent]=useState(false),[restored,setRestored]=useState(savedDraft.restored),[responseCommand,setResponseCommand]=useState<EnglishResponseCommand|null>(savedDraft.responseCommand),[audioPending,setAudioPending]=useState<EnglishAudioCommand|null>(savedDraft.audioCommand),[textPending,setTextPending]=useState<EnglishTextCommand|null>(savedDraft.textCommand);
 const listenCommand=useRef<{id:string;revision:number;answers:Record<string,number>}|null>(null),audioCommand=useRef<AudioSubmission|null>(null),textCommand=useRef<{id:string;text:string}|null>(null);
 const player=useRef<HTMLAudioElement|null>(null),audioUrl=useRef('');
 const base={profileId:profile.id,sessionId:session.id};
 const refresh=useCallback(async()=>{const pendingId=audioCommand.current?.commandId??audioPending?.id??textPending?.id??responseCommand?.id;
  const data=await request<{session:EnglishSession;receipt?:{commandId:string;status:'not-found'|'running'|'failed'|'succeeded';operation:string|null}}>(undefined,`?profileId=${profile.id}&sessionId=${initial.id}${pendingId?`&commandId=${pendingId}`:''}`);
  setSession(data.session);setAnswers(a=>data.session.status==='listening'?a:data.session.answers);
  const savedAudio=audioPending&&data.session.turns.find(turn=>turn.id===audioPending.recordingId);
  const savedText=textPending&&data.session.turns.find(turn=>turn.id===textPending.id&&turn.inputKind==='text'&&turn.originalTranscript===text.trim());
  if(savedAudio){audioCommand.current=null;setAudioPending(null);setRecording(null);setEdit(savedAudio.originalTranscript);setRestored(false);setNotice('转写已保存在练习记录中，请核对文字。')}
  else if(savedText){textCommand.current=null;setTextPending(null);setText('');setEdit(savedText.originalTranscript);setRestored(false);setNotice('文字回应已保存在练习记录中，请核对。')}
  else if(data.receipt?.status==='failed'){
   const pendingAudio=audioCommand.current;if(pendingAudio&&pendingAudio.commandId===pendingId)audioCommand.current={...pendingAudio,commandId:crypto.randomUUID()};
   if(audioPending?.id===pendingId)setAudioPending(null);
   if(responseCommand?.id===pendingId)setResponseCommand(null);
   setNotice(audioPending?.id===pendingId?(pendingAudio?'服务已确认失败，原录音仍在当前页面，可重试。':'服务已确认失败；刷新后原录音已丢失，请重新录制。'):'服务已确认失败，可再次请求反馈。');
  }else if(data.receipt?.status==='running')setNotice('上一请求仍在处理，请稍后再读取状态。');
  else if(data.receipt?.status==='succeeded'){
   if(audioPending?.id===pendingId)setNotice('录音请求回执显示完成，但转写尚未出现在练习记录。请保留原编号并稍后再读取。');
   const pendingResponse=responseCommand;
   if(pendingResponse&&pendingResponse.id===pendingId){const turnId=pendingResponse.turnId;if(data.session.turns.some(t=>t.id===turnId&&t.state==='replied'))setResponseCommand(null);else setNotice('服务回执已完成，但反馈尚未出现在练习记录。请保留原请求编号并稍后再读取。')}
  }else if(data.receipt?.status==='not-found'&&audioPending?.id===pendingId)setNotice('暂未找到这次录音请求的服务记录；结果仍未确认，请稍后再读取。');
  else if(textPending)setNotice('这次文字回应尚未出现在练习记录中。可沿用原轮次编号重试保存。');
  return data.session},[profile.id,initial.id,responseCommand,audioPending,textPending,text]);
 useEffect(()=>()=>{player.current?.pause();if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);window.speechSynthesis?.cancel()},[]);
 useEffect(()=>writeEnglishSessionDraft(englishSessionStorage(),profile.id,session,{answers,text,edit,responseCommand,audioCommand:audioPending,textCommand:textPending}),[profile.id,session,answers,text,edit,responseCommand,audioPending,textPending]);
 const unfinished=session.turns.find(turn=>turn.state!=='replied');
 const dirty=session.status==='listening'&&JSON.stringify(answers)!==JSON.stringify(session.answers)||Boolean(recording||text.trim())||Boolean(unfinished&&edit!==(unfinished.acceptedText??unfinished.originalTranscript));
 function discardDraft(){clearEnglishSessionDraft(englishSessionStorage(),profile.id,session.id);setAnswers(session.answers);setText('');setEdit(unfinished?.acceptedText??unfinished?.originalTranscript??'');setRestored(false)}
 useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(dirty||busy||recordBusy){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[dirty,busy,recordBusy]);
 async function run(action:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await action()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function assist(kind:'play'|'slow'|'text'|'translation'|'hint',segmentId?:string,deviceVoice?:boolean){const cmd={action:'assist',...base,kind,segmentId,deviceVoice,revision:session.revision,commandId:crypto.randomUUID()};const data=await request<{session:EnglishSession}>(cmd);setSession(data.session);listenCommand.current=null;return data.session}
 async function changeRate(value:number){if(value>=1){setRate(1);return}await run(async()=>{await assist('slow');setRate(value)})}
 async function playClip(id:string){await run(async()=>{
  const clip=session.scenario.clip.find(c=>c.id===id)!;if(!clip)throw new Error('找不到音频片段。');
  if(configured){const {blob}=await audioRequest('/api/english',{method:'POST',headers:dataHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'speak',...base,segmentId:id,commandId:crypto.randomUUID()})});if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current=URL.createObjectURL(blob);const audio=player.current??new Audio();player.current=audio;audio.src=audioUrl.current;audio.playbackRate=rate;const done=new Promise<void>((resolve,reject)=>{audio.onended=()=>resolve();audio.onerror=()=>reject(new Error('音频播放失败，请检查设备后重试。'))});try{await Promise.all([audio.play(),done])}finally{audio.onended=null;audio.onerror=null}await assist('play',id,false)}
  else{if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))throw new Error('当前设备没有可用朗读功能，且服务语音尚未配置。');await playEnglishDeviceSpeech(clip.text,rate,window.speechSynthesis,SpeechSynthesisUtterance);await assist('play',id,true);setNotice('本次使用设备朗读备用方案；它未经过人工音频审核。')}
 })}
 async function show(kind:'text'|'translation'){await run(async()=>{await assist(kind);setNotice(kind==='text'?'原文查看已记录。':'翻译查看已记录。')})}
 async function showHint(){await run(async()=>{await assist('hint');setNotice('下一轮表达提示已记录。提示后回答会与独立回答分开标记。')})}
 async function submitListening(){await run(async()=>{const cmd=listenCommand.current??{id:crypto.randomUUID(),revision:session.revision,answers:{...answers}};listenCommand.current=cmd;const data=await request<{session:EnglishSession}>({action:'listen',...base,commandId:cmd.id,revision:cmd.revision,answers:cmd.answers});listenCommand.current=null;setSession(data.session);setAnswers(data.session.answers);setRestored(false);setNotice('首次听辨已保存。现在可以查看解释，再用自己的话回应。')})}
 async function sendAudio(){await run(async()=>{if(textPending)throw new Error('请先核对上一条文字回应的保存状态。');if(audioPending)throw new Error('请先读取上一条录音请求的处理状态。');if(!recording&&!audioCommand.current)throw new Error('请先录音。');if(!consent)throw new Error('请先确认录音提交说明。');const cmd=audioCommand.current??createAudioSubmission(recording!.bytes);audioCommand.current=cmd;const pending={id:cmd.commandId,recordingId:cmd.recordingId,turnCount:session.turns.length};setAudioPending(pending);writeEnglishSessionDraft(englishSessionStorage(),profile.id,session,{answers,text,edit,responseCommand,audioCommand:pending,textCommand:textPending});const data=await request<{session:EnglishSession}>({action:'audio',...base,turnId:cmd.recordingId,commandId:cmd.commandId,audio:cmd.audio,consentVersion:ENGLISH_CONSENT_VERSION});setSession(data.session);const saved=data.session.turns.find(turn=>turn.id===cmd.recordingId);if(saved){audioCommand.current=null;setAudioPending(null);setRecording(null);setEdit(saved.originalTranscript);setRestored(false);setNotice('转写已保存。请核对文字，识别错误可修改；原始转写保留。')}else setNotice('录音请求尚未确认保存。请先读取已保存状态，再重试原请求。')})}
 async function sendText(){await run(async()=>{if(audioPending)throw new Error('请先核对录音请求的处理状态。');const cmd=textCommand.current??{id:textPending?.id??crypto.randomUUID(),text:text.trim()};textCommand.current=cmd;const pending={id:cmd.id,turnCount:session.turns.length};setTextPending(pending);writeEnglishSessionDraft(englishSessionStorage(),profile.id,session,{answers,text,edit,responseCommand,audioCommand:audioPending,textCommand:pending});const data=await request<{session:EnglishSession}>({action:'text',...base,turnId:cmd.id,text:cmd.text});setSession(data.session);const saved=data.session.turns.find(turn=>turn.id===cmd.id&&turn.inputKind==='text'&&turn.originalTranscript===cmd.text);if(saved){textCommand.current=null;setTextPending(null);setText('');setEdit(saved.originalTranscript);setRestored(false);setNotice('文字已保存；文字练习不计入口语，也不会产生发音评价。')}else setNotice('文字回应尚未确认保存，请先读取状态或沿用原轮次编号重试。')})}
 async function confirm(turn:EnglishTurn){await run(async()=>{const data=await request<{session:EnglishSession}>({action:'confirm',...base,turnId:turn.id,revision:turn.revision,text:edit});setSession(data.session);setRestored(false);setNotice('已保存确认后的表达。')})}
 async function respond(turn:EnglishTurn){await run(async()=>{if(!feedbackConsent)throw new Error('请先确认 AI 文字处理说明。');const cmd=responseCommand?.turnId===turn.id&&responseCommand.turnRevision===turn.revision?responseCommand:{turnId:turn.id,turnRevision:turn.revision,id:crypto.randomUUID()};setResponseCommand(cmd);writeEnglishSessionDraft(englishSessionStorage(),profile.id,session,{answers,text,edit,responseCommand:cmd,audioCommand:audioPending,textCommand:textPending});const data=await request<{session:EnglishSession}>({action:'respond',...base,turnId:turn.id,revision:turn.revision,commandId:cmd.id,consentVersion:ENGLISH_AI_FEEDBACK_CONSENT_VERSION});setSession(data.session);if(data.session.turns.some(saved=>saved.id===turn.id&&saved.state==='replied')){setResponseCommand(null);setEdit('');setRestored(false);setNotice('已保存 AI 追问与文字反馈。请根据追问再回答一次。')}else setNotice('追问请求尚未确认保存。请先读取已保存状态，再重试原请求。')})}
 async function bookmark(turn:EnglishTurn,index:number){await run(async()=>{await request({action:'bookmark',...base,turnId:turn.id,pointIndex:index});setNotice('已加入英语复习。')})}
 async function finish(){await run(async()=>{const data=await request<{session:EnglishSession}>({action:'finish',...base});setSession(data.session);setNotice('练习记录已保存。完成练习不代表已达到某个英语等级。')})}
 const pending=session.turns.find(t=>t.state!=='replied'),last=session.turns.at(-1),canRecord=session.status==='speaking'&&!pending&&session.turns.length<3;
 return <section className="coach-panel"><div className="english-header"><Button variant="outline" disabled={busy||recordBusy} onClick={onBack}>返回英语路线</Button><span className="coach-kicker">{session.difficulty==='basic'?'基础':'进阶'} · 场景 v{session.scenarioVersion} · 未经教师审核</span></div><h2>{session.scenario.title}</h2><p>{session.scenario.goal}</p><p className="coach-note">本次场景使用虚构信息。基础／进阶只是练习选择，不是水平结果。每次最多三轮回答。</p><p className="coach-note">未提交的听辨选项、文字回应与转写修订暂存在当前标签页，最长一天；录音请求只暂存编号，原始录音不会写入草稿。</p>{restored&&<p role="status" className="coach-note-box">已恢复本标签页未完成的英语练习状态。</p>}{(restored||dirty)&&!recording&&!responseCommand&&!audioPending&&!textPending&&<Button variant="outline" disabled={busy||recordBusy} onClick={discardDraft}>放下未提交文字草稿</Button>}{textPending&&<div className="coach-note-box"><p>上一条文字回应尚未确认保存。请先读取练习记录；若未保存，可沿用原轮次编号重试。</p><Button variant="outline" disabled={busy} onClick={()=>void refresh().catch(e=>setError((e as Error).message))}>读取文字保存状态</Button></div>}{audioPending&&<div className="coach-note-box"><p>上一条录音转写尚未确认保存。请先读取状态；刷新后原始录音不能恢复。确认失败后可重新录制。</p><Button variant="outline" disabled={busy} onClick={()=>void refresh().catch(e=>setError((e as Error).message))}>读取录音处理状态</Button></div>}{responseCommand&&<div className="coach-note-box"><p>上一条 AI 追问请求的保存结果尚需核对。请先读取状态；重试时沿用原请求编号。</p><Button variant="outline" disabled={busy} onClick={()=>void refresh().catch(e=>setError((e as Error).message))}>读取上一请求状态</Button></div>}
 {error&&<div role="alert" className="coach-error">{error} 当前页面输入仍保留。<Button variant="outline" disabled={busy} onClick={()=>void refresh().then(()=>setError('')).catch(e=>setError((e as Error).message))}>读取已保存状态</Button></div>}{notice&&<p role="status" className="coach-note-box">{notice}</p>}
 {session.status==='listening'?<><h3>第一步：先听，再独立回答</h3><p>第一次作答前不显示原文和翻译。听完后回答大意与细节；按需使用精听辅助，系统会记录。</p><div className="english-control"><label htmlFor="english-rate">播放速度</label><select id="english-rate" value={rate} disabled={busy} onChange={e=>void changeRate(Number(e.target.value))}><option value={1}>正常</option><option value={0.8}>慢速</option></select><span className="coach-note">{configured?'AI 合成语音':'设备朗读备用 · 未人工审核'}</span></div><div className="english-help"><Button disabled={busy} onClick={()=>void playClip(session.scenario.clip[0].id)}>听第一句</Button>{session.scenario.clip.slice(1).map((clip,i)=><Button key={clip.id} variant="outline" disabled={busy} onClick={()=>void playClip(clip.id)}>听第 {i+2} 句</Button>)}<Button variant="outline" disabled={busy} onClick={()=>void show('text')}>查看原文</Button><Button variant="outline" disabled={busy} onClick={()=>void show('translation')}>查看翻译</Button></div>{(session.help.text||session.help.translation)&&<div className="english-transcript">{session.scenario.clip.map(c=><p key={c.id}>{session.help.text&&<span lang="en">{c.text}</span>}{session.help.translation&&<span> · {c.zh}</span>}</p>)}</div>}<p className="coach-note">已播放 {session.help.plays} 次{session.help.slow?' · 用过慢速':''}{session.help.text?' · 看过原文':''}{session.help.translation?' · 看过翻译':''}。用过辅助后的正确答案不会记为首次独立听懂。</p>
  <div className="english-questions">{session.scenario.questions.map(q=><fieldset key={q.id}><legend>{q.prompt}</legend>{q.options.map((option,i)=><label className="english-option" key={option}><input type="radio" name={q.id} checked={answers[q.id]===i} disabled={busy} onChange={()=>{setAnswers(a=>({...a,[q.id]:i}));listenCommand.current=null}}/>{option}</label>)}</fieldset>)}</div><Button disabled={busy||session.scenario.clip.some(c=>!session.help.segments.includes(c.id))||session.scenario.questions.some(q=>answers[q.id]===undefined)} onClick={()=>void submitListening()}>提交首次听辨答案</Button><p className="coach-note">需先听完全部句子。提交后才显示答案与解释；每次尝试单独保存。</p></>:<>
  <div className="english-result"><h3>首次听辨</h3><p>{session.listeningResult?.correct}/{session.listeningResult?.total} 题 · {session.listeningResult?.assisted?'使用过辅助':'未使用辅助'}{session.help.deviceVoice?'（设备朗读备用）':''}。这是这组题的结果，不是英语等级分数。</p>{session.listeningResult?.items.map(item=>{const q=session.scenario.questions.find(q=>q.id===item.id)!;return <p key={item.id}><strong>{item.correct?'✓':'需复习'} {q.prompt}</strong> 参考：{q.options[item.answer]}。{item.why}</p>})}</div>
  <div className="english-transcript"><h3>逐句精听</h3>{session.scenario.clip.map(c=><p key={c.id}><span lang="en">{c.text}</span><br/>{c.zh}</p>)}</div>
  <h3>第二步：用自己的话回应</h3><p>{session.scenario.task}</p><blockquote lang="en">{session.scenario.opening}</blockquote><p className="coach-note">对话伙伴会根据已确认的回答追问。短句、答非所问或遗漏任务时不应判为已完成；AI 结果仅供练习参考。</p>
  {session.turns.map(turn=><article className="english-turn" key={turn.id}><h4>第 {turn.sequence+1} 次回答 · {turn.inputKind==='audio'?'录音转写':'文字练习'}{session.help.speakingHints?.includes(turn.sequence)?' · 提示后回答':''}</h4><blockquote lang="en">{turn.acceptedText??turn.originalTranscript}</blockquote>{turn.inputKind==='audio'&&turn.acceptedText&&turn.acceptedText!==turn.originalTranscript&&<p className="coach-note">原始转写：{turn.originalTranscript}</p>}{turn.feedback&&<><p><strong>AI 追问：</strong><span lang="en">{turn.feedback.reply}</span></p><p className="coach-note">{turn.feedback.translation}</p><p>任务状态：{turn.feedback.taskStatus==='completed'?'这轮任务要点已完成（AI 辅助判断）':turn.feedback.taskStatus==='uncertain'?'判断不确定，请自行核对':'尚有要点待完成'}</p>{turn.feedback.points.map((point,i)=><div className="english-result" key={i}><strong>{point.kind==='natural'?'可选优化':point.kind==='uncertain'?'待核对':point.kind==='task'?'任务遗漏':'建议纠正'}</strong><p>你的表达：{point.evidence||'未找到可引用的原句'}</p><p>原因：{point.explanation}</p><p>建议表达：<span lang="en">{point.suggestion}</span></p>{point.kind!=='uncertain'&&<Button variant="outline" disabled={busy} onClick={()=>void bookmark(turn,i)}>加入复习</Button>}</div>)}{session.status==='speaking'&&turn.sequence===session.turns.length-1&&turn.sequence<2&&turn.feedback.hint&&!session.help.speakingHints?.includes(turn.sequence+1)&&<Button variant="outline" disabled={busy} onClick={()=>void showHint()}>查看下一轮表达提示</Button>}{session.help.speakingHints?.includes(turn.sequence+1)&&<p className="coach-note-box">下一轮提示：{turn.feedback.hint}</p>}<p className="coach-note">请在下一轮用自己的话回应，并按需要重试。反馈只基于确认后的文字；发音、重音和停顿未评估。</p></>}</article>)}
  {session.status==='speaking'&&pending&&<div className="english-review-card"><h3>核对第 {pending.sequence+1} 次回答</h3><p>{pending.inputKind==='audio'?'语音识别可能有误。请先核对并修正；原始转写仍会保留。':'请核对这轮文字，再决定是否请求 AI 追问。'}</p><Textarea aria-label="确认或修正转写" lang="en" value={edit} onChange={e=>setEdit(e.target.value)} maxLength={3000}/><label className="english-option"><input type="checkbox" checked={feedbackConsent} disabled={busy} onChange={e=>setFeedbackConsent(e.target.checked)}/>我同意将本次及此前已确认的英语回答、练习场景发送至 OpenAI，用于生成追问和文字反馈；应用保存反馈和调用元数据。请勿输入真实客户资料。</label><div className="coach-actions"><Button variant="outline" disabled={busy||!edit.trim()||pending.state==='ready'&&edit===pending.acceptedText} onClick={()=>void confirm(pending)}>确认并保存文字</Button><Button disabled={busy||!configured||!feedbackConsent||pending.state!=='ready'||edit!==pending.acceptedText} onClick={()=>void respond(pending)}>获取针对这次回答的 AI 追问与反馈</Button></div>{!configured&&<p className="coach-note">AI 服务未配置；已确认文字可保存，但不能生成追问或反馈。</p>}</div>}
  {canRecord&&<div className="english-review-card"><h3>{session.turns.length===0?'开始回应':session.turns.length===1?'回答追问': '根据反馈再说一次'}</h3>{last?.feedback&&<blockquote lang="en">{last.feedback.reply}</blockquote>}<Recorder disabled={busy||Boolean(audioPending)||Boolean(textPending)} onRecording={value=>{setRecording(value);audioCommand.current=null}} onBusy={setRecordBusy}/><label className="english-option"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>我了解：点击提交后录音会发送至已配置的 OpenAI 服务用于转写；本应用只保存转写、修改和反馈，不长期保存原始录音。</label><Button disabled={busy||recordBusy||Boolean(textPending)||Boolean(audioPending)||!recording||!consent||!configured} onClick={()=>void sendAudio()}>提交录音并转写</Button>{!configured&&<p className="coach-note">语音与 AI 服务未配置，录音不能提交；本机试听仍可用。</p>}<details><summary>改用文字练习（不计口语）</summary><Textarea aria-label="英语文字回应" lang="en" value={text} disabled={busy||Boolean(textPending)||Boolean(audioPending)} onChange={e=>{setText(e.target.value);textCommand.current=null}} maxLength={3000}/><Button variant="outline" disabled={busy||Boolean(recording)||Boolean(audioPending)||!text.trim()} onClick={()=>void sendText()}>保存文字回答</Button></details></div>}
  {session.status==='speaking'&&session.turns.length<3&&<p className="coach-note">请完成首次回应、追问和重试三轮。当前轮次已保存，返回后可继续。</p>}{session.status==='speaking'&&session.turns.length>=3&&<Button variant="outline" disabled={busy||Boolean(pending)||recordBusy} onClick={()=>void finish()}>{last?.feedback?.taskStatus==='completed'?'完成并保存本次练习':'结束并保存（任务仍待完成）'}</Button>}{session.status==='finished'&&<p className="coach-note-box">本次练习已结束。首次听辨、辅助使用、每次回答和反馈均单独保留；没有发音分数或正式等级结论。</p>}
 </>}
 </section>;
}

function ReviewPanel({profileId,items,totalDue,onChange}:{profileId:string;items:EnglishReview[];totalDue:number;onChange:()=>Promise<EnglishOverview>}){
 const [savedDraft]=useState(()=>readEnglishReviewDraft(englishReviewStorage(),profileId,items));
 const [revealed,setRevealed]=useState<Record<string,boolean>>(savedDraft.revealed),[answers,setAnswers]=useState<Record<string,string>>(savedDraft.answers),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [reviewPreparation,setReviewPreparation]=useState(savedDraft.preparation),[playingReview,setPlayingReview]=useState<string|null>(null),[restored,setRestored]=useState(savedDraft.restored);
 const [pending,setPending]=useState<EnglishReviewPending|null>(savedDraft.pending);
 const due=items.filter(item=>item.due);
 useEffect(()=>writeEnglishReviewDraft(englishReviewStorage(),profileId,items,{answers,revealed,preparation:reviewPreparation,pending}),[profileId,items,answers,revealed,reviewPreparation,pending]);
 async function grade(item:EnglishReview,value:'again'|'hard'|'easy'){
  const command=pending??{itemId:item.id,eventId:crypto.randomUUID(),revision:item.revision,grade:value,answer:(answers[item.id]??'').trim(),...(item.kind==='listening'&&reviewPreparation[item.id]?{reviewMode:reviewPreparation[item.id]}:{})};
  if(command.itemId!==item.id||!command.answer)return;
  setPending(command);setBusy(true);setError('');
  try{await request({action:'review',profileId,...command});await onChange();setPending(null);setRestored(false);setRevealed(current=>({...current,[item.id]:false}));setAnswers(current=>({...current,[item.id]:''}));setReviewPreparation(current=>{const next={...current};delete next[item.id];return next})}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function refresh(){setBusy(true);setError('');try{await onChange();setPending(null)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 function discard(){clearEnglishReviewDraft(englishReviewStorage(),profileId);setAnswers({});setRevealed({});setReviewPreparation({});setRestored(false);setError('')}
 function play(item:EnglishReview){
  if(!item.payload.clip)return;
  if(!('speechSynthesis' in window)){setError('这台设备没有可用朗读；可选择文字辅助继续复习。');return}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(item.payload.clip);utterance.lang='en-US';utterance.rate=.9;
  utterance.onend=()=>{setPlayingReview(null);setReviewPreparation(current=>({...current,[item.id]:'device-voice'}))};
  utterance.onerror=()=>{setPlayingReview(null);setError('设备朗读未完成，请重试或选择文字辅助。')};
  setPlayingReview(item.id);setError('');
  try{window.speechSynthesis.speak(utterance)}catch{setPlayingReview(null);setError('设备朗读未完成，请重试或选择文字辅助。')}
 }
 return <section id="english-due-reviews" className="coach-panel">
  <h2>到期复习 · 换一个情境再试</h2>
  <p className="coach-note">未提交回答暂存在当前标签页，最长一天；成功保存或放下草稿后清除。原始录音不会写入草稿。</p>
  {totalDue>due.length&&<p className="coach-note">当前显示最早到期的 {due.length} 条；完成后刷新会继续显示其余到期问题。</p>}
  {restored&&<p role="status" className="coach-note-box">已恢复本标签页未提交的英语复习回答。</p>}
  {!pending&&due.some(item=>Boolean(answers[item.id]?.trim()||reviewPreparation[item.id]||revealed[item.id]))&&<Button variant="outline" disabled={busy||playingReview!==null} onClick={discard}>放下未提交草稿</Button>}
  {due.length===0?<p>目前没有到期问题。复习间隔来自每次回忆结果。</p>:due.map(item=>{
   const answer=answers[item.id]??'',wrong=item.kind==='listening'&&revealed[item.id]&&answer!==item.payload.answer;
   const locked=busy||Boolean(pending)||playingReview!==null;
   const prepared=item.kind!=='listening'||!item.payload.clip||Boolean(reviewPreparation[item.id]);
   return <article className="english-review-card" key={item.id}>
    <span className="coach-kicker">{item.kind==='listening'?'听力误解':item.kind==='task'?'任务遗漏':'表达'} · {item.payload.focus}</span>
    {item.kind==='listening'&&item.payload.clip&&<div className="english-control">
     <Button variant="outline" disabled={locked} onClick={()=>play(item)}>{playingReview===item.id?'朗读中…':'播放新情境听力'}</Button>
     <Button variant="outline" disabled={locked||Boolean(revealed[item.id])} onClick={()=>setReviewPreparation(current=>({...current,[item.id]:'text-assisted'}))}>查看文字材料（辅助后）</Button>
     <span className="coach-note">设备朗读备用 · 未人工审核；本题只记录复习对错，不计首次独立听辨。</span>
    </div>}
    {item.kind==='listening'&&!item.payload.clip&&<p className="coach-note">这张旧复习卡没有音频，只能作为文字题练习。</p>}
    {reviewPreparation[item.id]==='text-assisted'&&item.payload.clip&&<p lang="en">{item.payload.clip}</p>}
    <p>{item.payload.prompt}</p>
    {item.kind==='listening'&&!prepared&&<p className="coach-note">先听完新情境，或明确选择文字辅助，再回答。</p>}
    {item.payload.options?<div className="english-questions"><fieldset disabled={locked||revealed[item.id]||!prepared}><legend>选择你的答案</legend>{item.payload.options.map(option=><label className="english-option" key={option}><input type="radio" name={'review-'+item.id} checked={answer===option} onChange={()=>setAnswers(a=>({...a,[item.id]:option}))}/>{option}</label>)}</fieldset></div>:<Textarea aria-label="尝试在新情境中作答" lang="en" disabled={locked||revealed[item.id]||!prepared} value={answer} onChange={e=>setAnswers(a=>({...a,[item.id]:e.target.value}))}/>}
    {!revealed[item.id]?<Button variant="outline" disabled={locked||!prepared||!answer.trim()} onClick={()=>setRevealed(a=>({...a,[item.id]:true}))}>查看参考并自评</Button>:<>
     <p>{item.kind==='listening'?'参考答案：':'原题改写示例（请按新情境调整）：'}<span lang="en">{item.payload.answer}</span></p>
     {wrong&&<p role="status">本次选择与参考答案不同；请按“还需练习”保存。</p>}
     {item.payload.clip&&<details><summary>查看本次听力原文</summary><p lang="en">{item.payload.clip}</p></details>}
     <p className="coach-note">原问题：{item.payload.source} · 原回答：{item.payload.userAnswer}。{item.payload.knowledge}</p>
     {item.kind!=='listening'&&<p className="coach-note">请自行判断回答是否完成新情境任务、是否避免了原问题；上面的原题示例不是新题标准答案。</p>}
     <div className="coach-actions"><Button variant="outline" disabled={locked} onClick={()=>void grade(item,'again')}>还需练习</Button><Button variant="outline" disabled={locked||wrong} onClick={()=>void grade(item,'hard')}>有点把握</Button><Button disabled={locked||wrong} onClick={()=>void grade(item,'easy')}>{item.kind==='listening'?'本题答对（辅助后）':'自评能在新情境运用'}</Button></div>
    </>}
   </article>
  })}
  {pending&&<div className="coach-actions"><Button variant="outline" disabled={busy} onClick={()=>{const item=items.find(item=>item.id===pending.itemId);if(item)void grade(item,pending.grade)}}>重试保存原请求</Button><Button variant="outline" disabled={busy} onClick={()=>void refresh()}>读取已保存复习状态</Button></div>}
  {error&&<p role="alert" className="coach-error">{error} 本页输入仍保留。</p>}
 </section>;
}
