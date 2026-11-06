'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {dataHeaders,knownDataRevision} from '@/lib/data-revision';
import type {CoachLanguage} from '@/lib/coach/types';
type Confirmation={token:string;scope:'all'|CoachLanguage|'en-US';revision:number;expiresAt:number;phrase:string;totalRecords:number;sections:{label:string;count:number}[]};
async function command<T>(body:unknown):Promise<T>{
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),20000);
 try{
  const response=await fetch('/api/coach/privacy',{method:'POST',cache:'no-store',headers:dataHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body),signal:abort.signal});
  let data:T&{error?:string};try{data=await response.json()}catch{throw new Error('服务未返回确认结果，请检查状态后再操作。')}
  if(!response.ok)throw new Error(data.error||'操作未完成，请检查后重试。');return data;
 }catch(error){if(error instanceof TypeError||error instanceof Error&&error.name==='AbortError')throw new Error('连接中断，结果尚未确认。请检查处理状态；重试同一请求不会重复删除。');throw error}
 finally{clearTimeout(timer)}
}
export function DeletePanel({language,onDeleted,onBusy}:{language:CoachLanguage|'en-US';onDeleted:()=>void;onBusy:(busy:boolean)=>void}){
 const [scope,setScope]=useState<'current'|'all'>('current'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [confirmation,setConfirmation]=useState<Confirmation|null>(null),[account,setAccount]=useState(''),[phrase,setPhrase]=useState(''),[ack,setAck]=useState(false),[uncertain,setUncertain]=useState(false),[now,setNow]=useState(Date.now());
 useEffect(()=>{onBusy(busy);return()=>onBusy(false)},[busy,onBusy]);
 useEffect(()=>{if(!confirmation)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[confirmation]);
 function close(){if(busy)return;setConfirmation(null);setPhrase('');setAck(false);setUncertain(false);setError('')}
 async function prepare(){
  setBusy(true);setError('');
  try{
   const revision=knownDataRevision();if(revision===null)throw new Error('请等待档案读取完成，或刷新后再操作。');
   const result=await command<{confirmation:Confirmation;account:string}>({action:'prepare-delete',scope:scope==='all'?'all':language,revision});
   setConfirmation(result.confirmation);setAccount(result.account);setNow(Date.now());setPhrase('');setAck(false);setUncertain(false);
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function remove(){
  if(!confirmation||phrase!==confirmation.phrase||!ack)return;
  setBusy(true);setError('');
  try{const result=await command<{deleted:boolean}>({action:'delete',token:confirmation.token,scope:confirmation.scope,revision:confirmation.revision,phrase});if(!result.deleted)throw new Error('尚未确认完成。');onDeleted()}
  catch(e){setUncertain(true);setError((e as Error).message)}finally{setBusy(false)}
 }
 async function check(){
  if(!confirmation)return;setBusy(true);setError('');
  try{const result=await command<{deleted:boolean;notice?:string}>({action:'deletion-status',token:confirmation.token});if(result.deleted)onDeleted();else setError(result.notice||'尚未确认完成，可以重试相同请求。')}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 const expired=confirmation!==null&&now>=confirmation.expiresAt;
 return <div className="coach-delete-data"><h3>删除已保存的学习记录</h3><p>可清理当前路线数据，或连同旧版一起清空。此操作无法在应用内撤销。</p>
  <div className="coach-field"><span>删除范围</span><Select value={scope} disabled={busy} onValueChange={v=>{setScope(v as 'current'|'all');setError('')}}><SelectTrigger aria-label="删除范围"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="current">{language==='en-US'?'仅当前英语听说数据':`仅当前${language==='fr-FR'?'法语':'德语'}教练数据`}</SelectItem><SelectItem value="all">全部应用学习数据（含旧版）</SelectItem></SelectContent></Select></div>
  <p className="coach-note">{scope==='all'?'会清理法德教练、英语听说与旧版全部语言学习记录。':'其他语言和旧版学习记录会保留。'}清理后，所有已打开的学习页面需要刷新。</p>
  <Button variant="outline" disabled={busy} onClick={()=>void prepare()}>{busy&&!confirmation?'正在核对范围…':'查看删除范围并确认'}</Button>
  {!confirmation&&error&&<p className="coach-error" role="alert">{error}</p>}
  <AlertDialog open={confirmation!==null} onOpenChange={open=>{if(!open)close()}}><AlertDialogContent className="coach-delete-dialog"><AlertDialogHeader><AlertDialogTitle>确认清理学习数据</AlertDialogTitle><AlertDialogDescription>请核对账号和范围。只有输入确认文字并点击最后的删除按钮，才会清理记录。</AlertDialogDescription></AlertDialogHeader>
   {confirmation&&<><p>当前账号：<strong>{account}</strong></p><p><strong>{confirmation.scope==='all'?'全部应用学习数据（含旧版）':confirmation.scope==='fr-FR'?'仅法语教练数据':confirmation.scope==='de-DE'?'仅德语教练数据':'仅英语听说数据'}</strong> · 当前 {confirmation.totalRecords} 条记录</p><p className="coach-note">数量在确认前可能变化，删除涵盖执行时该范围内的全部记录。确认在 5 分钟后过期。</p>
   <details><summary>查看各类记录数量</summary><ul>{confirmation.sections.filter(s=>s.count>0).map(s=><li key={s.label}>{s.label}：{s.count}</li>)}</ul></details>
   <p>不会注销登录账号，或删除你已下载的文件、其他页面内存中的内容、服务商及备份中的留存。应用保留最小的数据版本与清理回执，用来阻止旧请求恢复数据。</p>
   <label className="coach-field">输入“{confirmation.phrase}”<Input aria-label="删除确认文字" value={phrase} disabled={busy} autoComplete="off" onChange={e=>setPhrase(e.target.value)}/></label>
   <label className="coach-inline"><Checkbox checked={ack} disabled={busy} onCheckedChange={value=>setAck(value===true)}/><span>我已确认范围，并了解应用内无法撤销。</span></label>
   {expired&&!uncertain&&<p role="status" className="coach-error">确认已过期，请取消后重新核对范围。</p>}{error&&<p role="alert" className="coach-error">{error}</p>}
   <AlertDialogFooter><AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>{uncertain&&<Button variant="outline" disabled={busy} onClick={()=>void check()}>检查处理状态</Button>}<Button variant="destructive" disabled={busy||!ack||phrase!==confirmation.phrase||(expired&&!uncertain)} onClick={()=>void remove()}>{busy?'处理中…':uncertain?'重试相同删除请求':'永久删除所选学习数据'}</Button></AlertDialogFooter></>}
  </AlertDialogContent></AlertDialog>
 </div>;
}
