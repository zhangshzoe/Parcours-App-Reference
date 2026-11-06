'use client';
import {DeletePanel} from './delete-panel';
import {dataHeaders} from '@/lib/data-revision';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import type {CoachLanguage} from '@/lib/coach/types';

export function PrivacyPanel({language,onDeleted,onBusy}:{language:CoachLanguage|'en-US';onDeleted:()=>void;onBusy:(busy:boolean)=>void}){
 const [scope,setScope]=useState<'current'|'all'>('current'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const controller=useRef<AbortController|null>(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort()}},[]);
 useEffect(()=>{setNotice('');setError('')},[language]);
 async function download(){
  if(busy)return;setBusy(true);setError('');setNotice('');
  const abort=new AbortController();controller.current=abort;
  try{
   const selected=scope==='all'?'all':language;
   const response=await fetch('/api/coach/privacy',{method:'POST',cache:'no-store',headers:dataHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'export',scope:selected}),signal:abort.signal});
   if(!response.ok){const data=await response.json() as {error?:string};throw new Error(data.error||'导出失败，请稍后重试。')}
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('没有收到完整的导出文件，请重试。');
   const blob=await response.blob();
   const data=JSON.parse(await blob.text()) as {format:string;version:number;scope:string;summary:{totalRecords:number}};
   if(data.format!=='parcours-personal-data'||data.version!==1||data.scope!==selected||!Number.isInteger(data.summary?.totalRecords))throw new Error('导出文件校验失败，请重试。');
   if(!alive.current)return;
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download=`parcours-${selected}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
   setNotice(`已生成 ${data.summary.totalRecords} 条记录并请求下载，请在浏览器下载记录中确认文件。`);
  }catch(e){if(alive.current)setError(e instanceof Error&&e.name==='AbortError'?'导出已取消。':e instanceof TypeError?'连接中断，未取得完整导出文件，请联网后重试。':e instanceof SyntaxError?'导出文件不完整，请稍后重试。':e instanceof Error?e.message:'导出失败，请重试。')}
  finally{controller.current=null;if(alive.current)setBusy(false)}
 }
 return <section className="coach-panel" aria-labelledby="coach-privacy-title"><h2 id="coach-privacy-title">学习数据与隐私</h2>
  <p>下载已保存的学习记录，保留自己的练习、转写、反馈和复习历史。</p>
  <div className="coach-field"><span>导出范围</span><Select value={scope} onValueChange={v=>{setScope(v as 'current'|'all');setNotice('');setError('')}} disabled={busy}><SelectTrigger aria-label="导出范围"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="current">{language==='en-US'?'当前英语听说记录':`当前${language==='fr-FR'?'法语':'德语'}教练记录`}</SelectItem><SelectItem value="all">全部应用记录（含旧版）</SelectItem></SelectContent></Select></div>
  <p className="coach-note">{scope==='all'?'包括法德教练、英语听说，以及旧版全部语言课程与学习记录。':language==='en-US'?'只包含英语听说路线；法德教练与旧版课程记录会保留。':'只包含当前语言的教练数据；英语听说与旧版记录会保留。'}</p>
  <div className="coach-actions"><Button onClick={()=>void download()} disabled={busy}>{busy?'正在生成完整文件…':'下载学习数据（JSON）'}</Button>{busy&&<Button variant="outline" onClick={()=>controller.current?.abort()}>取消导出</Button>}</div>
  {error&&<p className="coach-error" role="alert">{error}</p>}{notice&&<p role="status" className="coach-note">{notice}</p>}
  <details className="coach-privacy-notes"><summary>文件包含什么？</summary><p>档案与目标历史、课程步骤、计划、收藏与复习、听力和测评作答、考试记录、对话转写与修订、AI 参考反馈和服务调用记录。</p><p>不含未保存的本机输入、音频文件、密钥或未提交题目的标准答案。JSON 是个人备份文件，目前不能导入应用恢复进度。</p></details>
  <p className="coach-note">原始录音只用于本次提交处理，应用不长期保存；转写和反馈会随学习记录保存。第三方语音服务的留存规则需在接通服务时另行确认。</p>
 <DeletePanel language={language} onDeleted={onDeleted} onBusy={onBusy}/>
 </section>;
}
