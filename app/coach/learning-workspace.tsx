'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Switch} from '@/components/ui/switch';
import type {CoachProfile} from '@/lib/coach/types';
import type {PublicCoachLesson} from '@/lib/coach/catalog';
import type {PlanTask} from '@/lib/coach/learning';
import {api} from '@/lib/coach/client';
import type {LessonAttempt} from '@/lib/coach/lesson-types';
import {ReviewLibrary,ReviewFace} from './review-library';
import type {SavedReview} from '@/lib/coach/review-library';
import {clearReviewDraft,readReviewDraft,recoverReviewQueue,writeReviewDraft} from '@/lib/coach/review-draft';
import type {PendingReview} from '@/lib/coach/review-draft';
import {LessonWorkspace} from './lesson-workspace';
import {VocabularyWorkspace} from './vocabulary-workspace';

type Attempt=LessonAttempt;
type Review=SavedReview;
type LearningState={lessons:PublicCoachLesson[];attempts:Attempt[];reviews:Review[];reviewCount:number;serverTime:number};
export function LearningWorkspace({profile,view,onDirty,onListen,onTask}:{profile:CoachProfile;view:'today'|'courses'|'profile';onDirty:(dirty:boolean)=>void;onListen:(lessonId:string)=>void;onTask:(task:PlanTask)=>void}){
 const [vocabulary,setVocabulary]=useState(false),[library,setLibrary]=useState(false);
 const [notes,setNotes]=useState<string[]>([]);
 const [data,setData]=useState<LearningState|null>(null),[tasks,setTasks]=useState<PlanTask[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[active,setActive]=useState<Attempt|null>(null),[reviewing,setReviewing]=useState<string[]|null>(null);
 async function refresh(){const [state,plan]=await Promise.all([api<LearningState>('learning?profileId='+profile.id),api<{tasks:PlanTask[];notes:string[]}>('learning',{action:'plan',profileId:profile.id})]);setData(state);setTasks(plan.tasks);setNotes(plan.notes);return state}
 useEffect(()=>{let cancelled=false;setData(null);setError('');setActive(null);setReviewing(null);
  Promise.all([api<LearningState>('learning?profileId='+profile.id),api<{tasks:PlanTask[];notes:string[]}>('learning',{action:'plan',profileId:profile.id})]).then(([state,plan])=>{if(!cancelled){setData(state);setTasks(plan.tasks);setNotes(plan.notes)}}).catch(e=>{if(!cancelled)setError(e.message)});
  return()=>{cancelled=true};
 },[profile.id,profile.revision]);
 useEffect(()=>{setActive(null);setReviewing(null);setVocabulary(false);setLibrary(false)},[view,profile.id,profile.revision]);
 async function start(id:string,attemptId?:string){if(!data)return;setBusy(true);setError('');try{
  const saved=(attemptId?data.attempts.find(a=>a.id===attemptId&&a.lesson_id===id):undefined)??data.attempts.find(a=>a.lesson_id===id&&!a.full_completed_at);
  const a=saved??(await api<{attempt:Attempt}>('learning',{action:'start',profileId:profile.id,lessonId:id,attemptId:crypto.randomUUID()})).attempt;setActive(a);
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 function openTask(task:PlanTask){if(task.status==='complete'||task.status==='unavailable')return;if(task.type==='review')setReviewing(task.itemIds??[]);else if(task.type==='lesson'||task.type==='lesson-practice')void start(task.lessonId!,task.attemptId);else onTask(task)}
 async function replan(){setBusy(true);setError('');try{const plan=await api<{tasks:PlanTask[];notes:string[]}>('learning',{action:'plan',profileId:profile.id,replan:true});setTasks(plan.tasks);setNotes(plan.notes)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const completed=new Set(data?.attempts.filter(a=>a.status==='complete').map(a=>a.lesson_id)),due=data?.reviews.filter(r=>r.due_at<=data.serverTime)??[];
 if(error&&!data)return <section className="coach-panel"><h2>暂时无法读取课程</h2><p role="alert">{error}</p><Button onClick={()=>window.location.reload()}>重新读取</Button></section>;
 if(!data)return <p role="status">正在读取学习记录…</p>;
 if(vocabulary)return <VocabularyWorkspace key={`${profile.id}:${profile.revision}`} profile={profile} onBack={()=>setVocabulary(false)} onRefresh={refresh}/>;
 if(active)return <LessonWorkspace key={active.id} attempt={active} profile={profile} onDirty={onDirty} onBack={()=>setActive(null)} onRefresh={refresh}/>;
 if(reviewing)return <ReviewQueue key={profile.id} profile={profile} items={due.filter(r=>reviewing.includes(r.id))} allDue={due} onDirty={onDirty} onBack={()=>{setReviewing(null);void refresh().catch(e=>setError(e.message))}} onRefresh={refresh}/>;
 if(library)return <ReviewLibrary key={profile.id} items={data.reviews} serverTime={data.serverTime} language={profile.language} onBack={()=>setLibrary(false)} onReview={setReviewing}/>;
 return <>{error&&<p className="coach-error" role="alert">{error}</p>}
 {view==='today'&&<><section className="coach-panel coach-focus"><span className="coach-kicker">今日学习计划</span><h2>{tasks.reduce((sum,t)=>sum+t.minutes,0)} 分钟，按你的目标练习</h2><p>每日预算 {profile.goal.dailyMinutes} 分钟 · 预计用时，不记作实际学习时长</p>{tasks.some(t=>t.status==='ready')?<Button disabled={busy} onClick={()=>{const next=tasks.find(t=>t.status==='ready');if(next)openTask(next)}}>开始今日学习</Button>:<p>今天已没有可继续的计划任务。可以重新安排，或从各栏目选择练习。</p>}<Button variant="outline" disabled={busy} onClick={()=>void replan()}>按当前进度重新安排</Button><p className="coach-note">已完成任务保留在今天预算内。漏学任务不会累计成明天的强制欠账。</p>{notes[0]&&<p className="coach-note">{notes[0]}</p>}<details><summary>查看安排依据</summary>{notes.slice(1).map(note=><p className="coach-note" key={note}>{note}</p>)}</details></section><div className="coach-task-list">{tasks.map(t=><button key={t.id} disabled={busy||t.status!=='ready'} className="coach-task" onClick={()=>openTask(t)}><strong>{t.title}</strong><span>{t.minutes} 分钟 · {t.status==='complete'?'已完成':t.status==='unavailable'?'服务暂不可用':'可练习'}</span><p>{t.reason}</p>{t.type==='speaking'&&<p>完成记录需要至少一轮录音获得回复，并结束会话；文字练习另行记录。</p>}</button>)}</div><section className="coach-panel"><h2>到期复习 · {due.length} 条</h2><p>回忆一次，再决定下一次复习时间。这里可继续练习全部到期表达，不属于今日计划额外承诺。</p><Button variant="outline" onClick={()=>setReviewing(due.map(r=>r.id))}>开始复习</Button></section></>}
 {view==='courses'&&<><section className="coach-panel"><h2>词汇与实用表达</h2><p>查看冠词、复数、动词变位与双语例句，把需要的词条加入复习。</p><Button variant="outline" onClick={()=>setVocabulary(true)}>打开当前等级词汇</Button></section><section className="coach-panel"><h2>{profile.goal.level} · {data.lessons.length} 节首批微课</h2><p>每课分别保存文字理解、示例音频与开口小结。语音服务未配置时，先完成文字部分；整课保持未完成。</p><p className="coach-note">原创内容由 AI 辅助编写，尚未经过语言教师人工审核；不代表完整等级课程。</p></section><div className="coach-course-grid">{data.lessons.map(l=><article className="coach-panel" key={l.id}><span className="coach-kicker">{l.topic} · 文字环节约 {l.minutes} 分钟</span><h2>{l.title}</h2><p>{l.objective}</p><p className="coach-note">{data.attempts.some(a=>a.lesson_id===l.id&&a.full_completed_at)?'整课已完成':completed.has(l.id)?'文字已完成，听说待继续':data.attempts.some(a=>a.lesson_id===l.id&&a.status==='in_progress')?'有可继续的草稿':'尚未开始'}</p><Button disabled={busy} onClick={()=>void start(l.id)}>学习本课</Button></article>)}</div></>}
 {view==='profile'&&<section className="coach-panel"><h2>课程记录与复习</h2><Button variant="outline" onClick={()=>setLibrary(true)}>查看全部收藏（{data.reviews.length}）</Button><p>当前语言最近 10 次文字微课记录，包含不同等级和重复练习。各等级汇总见上方报告。</p><Button variant="outline" onClick={()=>setReviewing(due.map(r=>r.id))}>查看到期复习（{due.length}）</Button><div className="coach-history">{data.attempts.filter(a=>a.status==='complete').slice(0,10).map(a=><p key={a.id}>{data.lessons.find(l=>l.id===a.lesson_id)?.title??a.lesson_id} · 理解练习 {a.result?.score}/{a.result?.outOf} · {new Date(a.completed_at!).toLocaleDateString('zh-CN')}</p>)}</div></section>}
 </>;
}
function ReviewQueue({profile,items,allDue,onDirty,onBack,onRefresh}:{profile:CoachProfile;items:Review[];allDue:Review[];onDirty:(dirty:boolean)=>void;onBack:()=>void;onRefresh:()=>Promise<LearningState>}){
 const storage=()=>{try{return typeof window==='undefined'?null:window.sessionStorage}catch{return null}};
 const [recovery]=useState(()=>{const value=recoverReviewQueue(items,allDue,readReviewDraft(storage(),profile.id));if(value.stale)clearReviewDraft(storage(),profile.id);return value});
 const restored=recovery.restored;
 const [queue,setQueue]=useState(recovery.queue);
 const [revealed,setRevealed]=useState(restored?.revealed??false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[response,setResponse]=useState(restored?.response??'');
 const [pending,setPending]=useState<PendingReview|null>(restored?.pending??null),item=queue[0],transfer=Boolean(item?.payload.transferPrompt);
 useEffect(()=>{onDirty(Boolean(response.trim()||pending));return()=>onDirty(false)},[response,pending,onDirty]);
 function saveDraft(nextResponse:string,nextRevealed:boolean,nextPending:PendingReview|null){if(item)writeReviewDraft(storage(),profile.id,{itemId:item.id,revision:item.revision,response:nextResponse,revealed:nextRevealed,pending:nextPending})}
 async function grade(value:'again'|'hard'|'easy'){
  if(!item)return;
  setBusy(true);setError('');
  const request=pending??{eventId:crypto.randomUUID(),grade:value,...(transfer?{response:response.trim()}:{})};
  saveDraft(response,revealed,request);setPending(request);
  try{await api('learning',{action:'review',profileId:profile.id,itemId:item.id,revision:item.revision,...request});await onRefresh();clearReviewDraft(storage(),profile.id);setQueue(q=>q.slice(1));setRevealed(false);setResponse('');setPending(null)}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <section className="coach-panel"><Button variant="outline" disabled={busy||Boolean(pending)||Boolean(response.trim())} onClick={onBack}>返回学习</Button><h2>回忆，再查看答案</h2>{item?<><p>剩余 {queue.length} 条 · 来源：{item.payload.lessonTitle}</p><ReviewFace item={item} revealed={revealed} language={profile.language}/>{transfer&&<><label htmlFor="coach-transfer-response">在新情境中的回答</label><Textarea id="coach-transfer-response" lang={profile.language} value={response} maxLength={3000} disabled={revealed||busy||Boolean(pending)} onChange={e=>{const next=e.target.value;setResponse(next);saveDraft(next,false,null)}} placeholder="先用目标语言自己回答，再看建议。"/><p className="coach-note">这是一道原创迁移练习。查看建议后由你自评；系统不据字数或相似度判断语言水平。未保存回答暂存于当前标签页，最长一天，成功保存或放下草稿后清除。</p>{!pending&&response.trim()&&<Button variant="outline" onClick={()=>{clearReviewDraft(storage(),profile.id);setResponse('');setRevealed(false)}}>放下本次草稿</Button>}</>}{!revealed&&<Button disabled={transfer&&!response.trim()} onClick={()=>{saveDraft(response,true,pending);setRevealed(true)}}>{item.kind==='knowledge'?'查看参考答案与解释':'查看目标语言表达'}</Button>}{pending&&<p role="status" className="coach-note">上次提交结果尚未确认；重试会使用同一请求编号。</p>}<div className="coach-actions">{([['again','忘记了'],['hard','有些模糊'],['easy','记住了']] as const).map(([value,label])=><Button key={value} variant="outline" disabled={!revealed||busy||Boolean(pending&&pending.grade!==value)} onClick={()=>void grade(value)}>{pending?.grade===value?'重试 '+label:label}</Button>)}</div><p className="coach-note">忘记：10 分钟后；模糊：明天；记住：按 1、3、7、14、30 天逐步安排。</p></>:<p>这轮没有待复习的表达。可以先从课程收藏，或稍后再来。</p>}{error&&<p role="alert" className="coach-error">{error}</p>}</section>;
}


