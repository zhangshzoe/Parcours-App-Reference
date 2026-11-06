'use client';
import {useCallback,useState} from 'react';
import {Button} from '@/components/ui/button';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import type {PlanTask} from '@/lib/coach/learning';
import type {CoachProfile} from '@/lib/coach/types';
import {SpeakingWorkspace} from './speaking-workspace';
import {ListeningWorkspace} from './listening-workspace';
export function AudioWorkspace({profile,lessonId,onDirty,plannedTask}:{profile:CoachProfile;lessonId?:string|null;plannedTask?:PlanTask|null;onDirty:(v:boolean)=>void}){
 const [mode,setMode]=useState<'speaking'|'listening'|'free'>(lessonId?'listening':'speaking'),[dirty,setDirty]=useState(false),[next,setNext]=useState<typeof mode|null>(null);
 const changeDirty=useCallback((value:boolean)=>{setDirty(value);onDirty(value)},[onDirty]);
 return <><div className="coach-actions coach-audio-tabs" aria-label="听说练习类别">{([['speaking','情景口语'],['listening','精听与跟读'],['free','自由练习']] as const).map(([key,label])=><Button key={key} variant={mode===key?'default':'outline'} aria-pressed={mode===key} onClick={()=>{if(key===mode)return;if(dirty)setNext(key);else setMode(key)}}>{label}</Button>)}</div>{mode!=='listening'?<SpeakingWorkspace key={mode} profile={profile} onDirty={changeDirty} practiceType={mode==='free'?'free':'scenario'} initialScenarioId={plannedTask?.type==='speaking'?plannedTask.targetId:undefined} initialConversationId={plannedTask?.type==='speaking'?plannedTask.attemptId:undefined}/>:<ListeningWorkspace profile={profile} lessonId={lessonId} initialAttemptId={plannedTask?.type==='listening'?plannedTask.attemptId:undefined} onDirty={changeDirty}/>}<AlertDialog open={next!==null} onOpenChange={open=>{if(!open)setNext(null)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>切换练习？</AlertDialogTitle><AlertDialogDescription>本页有未保存的输入或录音，切换后可能丢失。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="min-h-11">继续当前练习</AlertDialogCancel><AlertDialogAction className="min-h-11" onClick={()=>{if(next)setMode(next);setNext(null)}}>确认切换</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}
