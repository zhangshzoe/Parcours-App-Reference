'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';

type InstallEvent = Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
type Support = 'preparing'|'ready'|'failed'|'unsupported';

export function PwaSupport({showPanel}:{showPanel:boolean}) {
 const [offline,setOffline]=useState(false),[reconnected,setReconnected]=useState(false);
 const [support,setSupport]=useState<Support>('preparing'),[retry,setRetry]=useState(0);
 const [install,setInstall]=useState<InstallEvent|null>(null),[installed,setInstalled]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  const media=window.matchMedia('(display-mode: standalone)');
  const syncInstalled=()=>setInstalled(media.matches || (navigator as Navigator & {standalone?:boolean}).standalone===true);
  const disconnected=()=>{setOffline(true);setReconnected(false)};
  const connected=()=>{setOffline(false);setReconnected(true)};
  const offered=(event:Event)=>{event.preventDefault();setInstall(event as InstallEvent)};
  const completed=()=>{setInstalled(true);setInstall(null);setMessage('')};
  setOffline(!navigator.onLine);syncInstalled();
  window.addEventListener('offline',disconnected);window.addEventListener('online',connected);
  window.addEventListener('beforeinstallprompt',offered);window.addEventListener('appinstalled',completed);
  media.addEventListener('change',syncInstalled);
  return ()=>{window.removeEventListener('offline',disconnected);window.removeEventListener('online',connected);window.removeEventListener('beforeinstallprompt',offered);window.removeEventListener('appinstalled',completed);media.removeEventListener('change',syncInstalled)};
 },[]);
 useEffect(()=>{
  let cancelled=false;
  const cleanups:Array<()=>void>=[];
  if(!window.isSecureContext || !('serviceWorker' in navigator)){setSupport('unsupported');return}
  setSupport('preparing');
  void navigator.serviceWorker.register('/coach-sw.js',{scope:'/coach',updateViaCache:'none'}).then(registration=>{
   if(cancelled)return;
   const observe=(worker:ServiceWorker|null)=>{
    if(!worker)return;
    const changed=()=>{
     if(cancelled)return;
     if(worker.state==='activated')setSupport('ready');
     else if(worker.state==='redundant'&&!registration.active)setSupport('failed');
    };
    worker.addEventListener('statechange',changed);cleanups.push(()=>worker.removeEventListener('statechange',changed));changed();
   };
   if(registration.active)setSupport('ready');
   observe(registration.installing);observe(registration.waiting);
   const found=()=>observe(registration.installing);
   registration.addEventListener('updatefound',found);cleanups.push(()=>registration.removeEventListener('updatefound',found));
  }).catch(()=>{if(!cancelled)setSupport('failed')});
  return ()=>{cancelled=true;cleanups.forEach(cleanup=>cleanup())};
 },[retry]);
 async function requestInstall(){
  if(!install || busy)return;
  const offer=install;setInstall(null);setBusy(true);setMessage('');
  try{await offer.prompt();const choice=await offer.userChoice;setMessage(choice.outcome==='accepted'?'已确认安装，请按浏览器提示完成。':'已取消安装，仍可在浏览器中继续学习。')}
  catch{setMessage('暂时无法打开安装提示，请使用下方的浏览器安装方法。')}
  finally{setBusy(false)}
 }
 return <>
  {offline&&<div className="coach-error" role="status"><strong>当前设备处于离线状态</strong><span>云端 AI 和保存暂不可用。请保留当前页面，联网后检查保存状态；计时训练不会暂停。</span></div>}
  {!offline&&reconnected&&<div className="coach-note-box" role="status">网络连接已恢复。请检查当前练习的保存状态，再继续操作；尚未提交的内容不会自动上传。<Button variant="outline" onClick={()=>setReconnected(false)}>知道了</Button></div>}
  {showPanel&&<section className="coach-panel coach-install" aria-labelledby="coach-install-title">
   <div className="coach-install-heading"><img src="/coach/icon-192.png" width="48" height="48" alt=""/><div><p className="coach-kicker">手机上的学习入口</p><h2 id="coach-install-title">{installed?'已添加 Parcours':'把 Parcours 放到主屏幕'}</h2></div></div>
   <p>{installed?'以后可从应用图标打开，继续你的法语或德语练习。':'添加后可从手机图标快速进入学习，记录仍保存在同一个账号中。'}</p>
   {!installed&&install&&<Button onClick={()=>void requestInstall()} disabled={busy}>添加到主屏幕</Button>}
   {message&&<p role="status">{message}</p>}
   {!installed&&<details><summary>查看手机安装方法</summary><ol><li><strong>iPhone：</strong>在 Safari 打开此页面，通过浏览器的分享菜单选择“添加到主屏幕”。</li><li><strong>Android：</strong>在手机浏览器菜单中查找“安装应用”或“添加到主屏幕”，名称依浏览器而异。</li><li>若在聊天软件内无法找到入口，请先在系统浏览器打开。没有安装选项时，仍可直接在浏览器学习。</li></ol></details>}
   <div className="coach-note-box"><strong>离线时能做什么？</strong><p>显示连接提示。登录、学习记录和云端 AI 需要网络；本版不下载课程或私人录音供离线使用。</p><p role="status">{support==='ready'?'离线提示已准备好，重新打开应用后生效。':support==='preparing'?'正在准备离线提示…':support==='failed'?'离线提示准备失败，请联网后重试。':'当前浏览器或连接不支持离线提示，仍可联网学习。'}</p>{support==='failed'&&<Button variant="outline" onClick={()=>setRetry(n=>n+1)} disabled={offline}>重试准备离线提示</Button>}</div>
   <a className="coach-text-link" href="/coach/offline.html">预览连接提示页</a>
  </section>}
 </>;
}
