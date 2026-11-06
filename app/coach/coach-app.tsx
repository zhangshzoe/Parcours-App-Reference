'use client';
import {useEffect,useState} from 'react';
import {BookOpen,CalendarDays,Headphones,GraduationCap,UserRound} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import type {PlanTask} from '@/lib/coach/learning';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {coachLanguages,goalLabels,initialGoal,type CoachGoal,type CoachProfile,type CoachLanguage} from '@/lib/coach/types';
import {LearningWorkspace} from './learning-workspace';
import {AudioWorkspace} from './audio-workspace';
import {ExamWorkspace} from './exam-workspace';
import {api} from '@/lib/coach/client';
import {AssessmentWorkspace,AssessmentEntry} from './assessment-workspace';

import {PwaSupport} from './pwa-support';
import {PrivacyPanel} from './privacy-panel';
import {ProgressPanel} from './progress-panel';

type View='today'|'courses'|'speaking'|'exam'|'profile'|'assessment';
const nav=[{id:'today',label:'今日',icon:CalendarDays},{id:'courses',label:'课程',icon:BookOpen},{id:'speaking',label:'听说',icon:Headphones},{id:'exam',label:'考证',icon:GraduationCap},{id:'profile',label:'我的',icon:UserRound}] as const;
export default function CoachApp({signedIn,signInHref}:{signedIn:boolean;signInHref:string}){
 const [dataDeleted,setDataDeleted]=useState(false),[privacyBusy,setPrivacyBusy]=useState(false);
 const [profiles,setProfiles]=useState<CoachProfile[]>([]),[language,setLanguage]=useState<CoachLanguage>('fr-FR'),[view,setView]=useState<View>('today');
 const [loading,setLoading]=useState(signedIn),[error,setError]=useState(''),[editing,setEditing]=useState(false);
 const [plannedTask,setPlannedTask]=useState<PlanTask|null>(null);
 const [listeningLesson,setListeningLesson]=useState<string|null>(null);
 const [dirty,setDirty]=useState(false),[navigation,setNavigation]=useState(0);
 const [pendingNavigation,setPendingNavigation]=useState<(()=>void)|null>(null);
 function navigate(action:()=>void){if(privacyBusy)return;if(dirty)setPendingNavigation(()=>action);else action()}
 const profile=profiles.find(p=>p.language===language),meta=coachLanguages.find(l=>l.id===language)!;
 async function refresh(){setError('');try{setProfiles((await api<{profiles:CoachProfile[]}>('profiles')).profiles)}catch(e){setError((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{if(signedIn)void refresh()},[signedIn]);
 if(dataDeleted)return <div className="coach-shell"><main className="coach-main"><section className="coach-panel"><h1>所选学习数据已清理</h1><p>旧页面的保存请求已失效。请刷新后读取保留的记录，或重新建立学习档案。</p><Button asChild><a href="/coach">刷新并继续</a></Button><p className="coach-note">登录账号仍保留。已下载的文件、其他页面内存、第三方及备份留存不在本次应用清理范围内。</p></section></main></div>;
 return <div className="coach-shell"><header className="coach-header"><a className="coach-brand" href="/coach">parcours<span>.</span></a><span className="coach-release">法德学习教练 · 内测开发中</span><Select disabled={privacyBusy} value={language} onValueChange={v=>navigate(()=>{setLanguage(v as CoachLanguage);setListeningLesson(null);setPlannedTask(null);setEditing(false);setDirty(false)})}><SelectTrigger aria-label="选择学习语言"><SelectValue/></SelectTrigger><SelectContent>{coachLanguages.map(l=><SelectItem key={l.id} value={l.id}>{l.label} · {l.native}</SelectItem>)}</SelectContent></Select></header>
 <main className="coach-main"><div className="coach-title"><p>{meta.native} · A1 / A2</p><h1>{profile?`${meta.label}，每天用起来。`:'从一个能完成的小目标开始。'}</h1><p>{profile?`${goalLabels[profile.goal.mode]} · ${profile.goal.level} · 每天 ${profile.goal.dailyMinutes} 分钟`:'为每种语言单独设置目标，让练习适合你的时间。'}</p></div>


 {error&&<div className="coach-error" role="alert">{error}<Button variant="outline" onClick={()=>void refresh()}>重新读取</Button></div>}
 {!signedIn?<section className="coach-panel"><h2>保存你的学习路线</h2><p>登录后设置法语或德语目标，学习记录按语言分别保存。</p><Button asChild><a href={signInHref} target="_top">登录并设置目标</a></Button><a className="coach-text-link" href="/">浏览原有课程</a></section>:loading?<p role="status">正在读取学习档案…</p>:!profile||editing?<GoalForm key={profile?.id??language} language={language} profile={profile} onSaved={async()=>{await refresh();setEditing(false);setView('today')}} onCancel={profile?()=>setEditing(false):undefined}/>:<>
 {view==='profile'&&<ProgressPanel key={profile.id+':'+profile.revision} profile={profile}/>}
 {(view==='today'||view==='courses'||view==='profile')&&<LearningWorkspace key={profile.id+':'+profile.revision+':'+navigation} profile={profile} view={view} onDirty={setDirty} onTask={task=>navigate(()=>{setPlannedTask(task);setListeningLesson(task.type==='listening'?task.lessonId??null:null);setView(task.type==='exam'?'exam':'speaking');setNavigation(v=>v+1);setDirty(false)})} onListen={lessonId=>navigate(()=>{setPlannedTask(null);setListeningLesson(lessonId);setView('speaking');setNavigation(v=>v+1);setDirty(false)})}/>}
 {(view==='today'||view==='profile')&&<AssessmentEntry profile={profile} onOpen={()=>navigate(()=>{setView('assessment');setDirty(false)})}/>}
 {view==='assessment'&&<AssessmentWorkspace key={profile.id+':'+navigation} profile={profile} onDirty={setDirty} onBack={()=>navigate(()=>{setView('today');setDirty(false)})} onSettings={()=>navigate(()=>{setEditing(true);setDirty(false)})}/>}
 {view==='speaking'&&<AudioWorkspace key={profile.id+':'+navigation} profile={profile} lessonId={listeningLesson} plannedTask={plannedTask} onDirty={setDirty}/>}
 {view==='exam'&&<ExamWorkspace key={profile.id+':'+profile.revision+':'+navigation} profile={profile} initialPaperId={plannedTask?.type==='exam'?plannedTask.targetId:undefined} initialAttemptId={plannedTask?.type==='exam'?plannedTask.attemptId:undefined} onDirty={setDirty} onRoleplay={scenarioId=>navigate(()=>{setPlannedTask({id:scenarioId,type:'speaking',targetId:scenarioId,title:'法语口语角色互动',minutes:10,reason:'与当前等级口语专项对应'});setListeningLesson(null);setView('speaking');setNavigation(v=>v+1);setDirty(false)})}/>}
 
 {view==='profile'&&<section className="coach-panel"><h2>我的{meta.label}档案</h2><dl><dt>学习目标</dt><dd>{goalLabels[profile.goal.mode]}</dd><dt>目标考试</dt><dd>{language==='fr-FR'?(profile.goal.targetExam??'DELF tout public'):'Goethe 成人考试'}</dd><dt>当前路线</dt><dd>{profile.goal.level}</dd><dt>每日时间</dt><dd>{profile.goal.dailyMinutes} 分钟</dd><dt>个人目标日期</dt><dd>{profile.goal.targetDate||'尚未设置'}</dd><dt>能力记录</dt><dd>见起点检查与练习记录，按技能分别查看</dd></dl><Button onClick={()=>setEditing(true)}>修改学习目标</Button><p className="coach-note">日期是你的学习计划，不代表官方考试日期。法语和德语分别保存。</p></section>}
 </>}
 {signedIn&&view==='profile'&&<PrivacyPanel key={language} language={language} onBusy={setPrivacyBusy} onDeleted={()=>{setProfiles([]);setDirty(false);setDataDeleted(true)}}/>}
 <PwaSupport showPanel={view==='profile' || !signedIn}/>
 </main><nav className="coach-nav" aria-label="学习导航">{nav.map(n=><button key={n.id} disabled={privacyBusy} aria-current={view===n.id?'page':undefined} onClick={()=>navigate(()=>{setView(n.id);setListeningLesson(null);setPlannedTask(null);setNavigation(v=>v+1);setEditing(false);setDirty(false)})}><n.icon size={21}/><span>{n.label}</span></button>)}</nav><AlertDialog open={pendingNavigation!==null} onOpenChange={open=>{if(!open)setPendingNavigation(null)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>离开当前练习？</AlertDialogTitle><AlertDialogDescription>有未提交的练习或录音。未保存内容可能丢失；已开始的计时训练仍会继续计时。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="min-h-11">继续练习</AlertDialogCancel><AlertDialogAction className="min-h-11" onClick={()=>{const action=pendingNavigation;setPendingNavigation(null);action?.()}}>确认离开</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}
function GoalForm({language,profile,onSaved,onCancel}:{language:CoachLanguage;profile?:CoachProfile;onSaved:()=>Promise<void>;onCancel?:()=>void}){
 const [goal,setGoal]=useState<CoachGoal>(language==='fr-FR'?{...(profile?.goal??initialGoal),targetExam:'DELF tout public'}:(profile?.goal??initialGoal)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [commandId,setCommandId]=useState(()=>crypto.randomUUID());
 function update<K extends keyof CoachGoal>(key:K,value:CoachGoal[K]){setGoal(g=>({...g,[key]:value}));setCommandId(crypto.randomUUID())}
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await api('profiles',profile?{profileId:profile.id,expectedRevision:profile.revision,goal,commandId}:{language,goal,commandId},profile?'PATCH':'POST');await onSaved()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <form className="coach-panel coach-form" onSubmit={save}><h2>{profile?'调整学习目标':'建立'+(language==='fr-FR'?'法语':'德语')+'档案'}</h2><fieldset disabled={busy}><Choice label="学习目标" value={goal.mode} items={Object.entries(goalLabels)} onChange={v=>update('mode',v as CoachGoal['mode'])}/>{language==='fr-FR'&&<p className="coach-note">本轮目标考试：DELF tout public（成人版）。选择 A1 或 A2 只是安排练习，不代表系统已评定你的水平。</p>}<Choice label="自评起点" value={goal.start} items={[["zero","零基础"],["a1","A1 学习中"],["a2","A2 学习中"],["unsure","不确定"]]} onChange={v=>update('start',v as CoachGoal['start'])}/><Choice label="学习等级" value={goal.level} items={[["A1","A1 入门"],["A2","A2 基础"]]} onChange={v=>update('level',v as CoachGoal['level'])}/><Choice label="每天可用时间" value={String(goal.dailyMinutes)} items={[10,20,30,45].map(n=>[String(n),n+' 分钟'])} onChange={v=>update('dailyMinutes',Number(v) as CoachGoal['dailyMinutes'])}/><label>个人目标日期（可跳过）<Input type="date" value={goal.targetDate??''} onChange={e=>update('targetDate',e.target.value||null)}/></label><div className="coach-field"><span>兴趣场景（可多选，至少保留一项）</span>{['旅行','生活','留学','基础工作交流'].map(interest=><label className="coach-inline" key={interest}><Checkbox checked={goal.interests.includes(interest)} disabled={goal.interests.length===1&&goal.interests.includes(interest)} onCheckedChange={checked=>update('interests',checked?[...goal.interests,interest]:goal.interests.filter(i=>i!==interest))}/>{interest}</label>)}</div><p className="coach-note">可以跳过起点测评；未测评的技能显示“尚未评估”。</p>{error&&<p role="alert" className="coach-error">{error}</p>}<div className="coach-actions"><Button type="submit">{busy?'保存中…':'保存学习目标'}</Button>{onCancel&&<Button type="button" variant="outline" onClick={onCancel}>取消</Button>}</div></fieldset></form>
}
function Choice({label,value,items,onChange}:{label:string;value:string;items:string[][];onChange:(v:string)=>void}){return <div className="coach-field"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{items.map(([v,label])=><SelectItem key={v} value={v}>{label}</SelectItem>)}</SelectContent></Select></div>}
