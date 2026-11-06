'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {api} from '@/lib/coach/client';
import type {CoachProfile,CoachLevel} from '@/lib/coach/types';
import type {ProgressReport} from '@/lib/coach/progress';
export function ProgressPanel({profile}:{profile:CoachProfile}){
 const [level,setLevel]=useState<CoachLevel>(profile.goal.level),[reload,setReload]=useState(0);
 const [loaded,setLoaded]=useState<{key:string;report:ProgressReport|null;error:string}>({key:'',report:null,error:''});
 const key=`${profile.id}:${level}:${reload}`,report=loaded.key===key?loaded.report:null,error=loaded.key===key?loaded.error:'';
 useEffect(()=>{let cancelled=false;api<ProgressReport>('progress?profileId='+profile.id+'&level='+level).then(data=>{if(!cancelled)setLoaded({key,report:data,error:''})}).catch(e=>{if(!cancelled)setLoaded({key,report:null,error:e.message})});return()=>{cancelled=true}},[profile.id,level,key]);
 return <section className="coach-panel coach-progress"><h2>学习记录与技能证据</h2><div className="coach-field"><span>查看等级</span><Select value={level} onValueChange={v=>setLevel(v as CoachLevel)}><SelectTrigger aria-label="学习报告等级"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="A2">A2</SelectItem></SelectContent></Select></div><p className="coach-note">当前{profile.language==='fr-FR'?'法语':'德语'} · {level} · 全部已保存历史。记录练习行为，不认证等级；起点自评单独展示。</p>
 {error?<><p role="alert" className="coach-error">{error}</p><Button variant="outline" onClick={()=>setReload(v=>v+1)}>重新读取报告</Button></>:!report?<p role="status">正在汇总保存的记录…</p>:<>
 <p>文字微课已练 {report.courses.text} 节；整课已完成 {report.courses.complete} 节。重复练同一课不会增加课程数。</p>
 {profile.language==='fr-FR'&&<><h3>法语专项学习模式</h3><div className="coach-progress-grid">{(['listening','reading','writing','speaking'] as const).map(skill=>{const activity=report.study[skill],label={listening:'听力',reading:'阅读',writing:'写作',speaking:'口语'}[skill];return <article key={skill}><h4>{label}</h4><p>开始 {activity.started} 次 · 完成 {activity.completed} 次</p><p>已保存作答 {activity.savedAnswers} 项 · 使用辅助 {activity.assistedAttempts} 次尝试</p></article>})}</div><p className="coach-note">专项学习模式中的作答单独记录，不计入下方听读客观题。下方“首次”仅表示同题第一次保存作答，不能据此判断是否独立完成或达到该等级。</p></>}
 <div className="coach-progress-grid">{(['listening','reading'] as const).map(skill=>{const s=report[skill];return <article key={skill}><h3>{skill==='listening'?'听力':'阅读'}</h3><p>{s.answered===0?'尚无已提交的客观作答':`已答 ${s.answered} 次，答对 ${s.correct} 次`}</p><p>首次题作答 {s.first} 次，其中答对 {s.firstCorrect} 次；重复作答 {s.repeated} 次。</p><p>其中计时模式首次无系统辅助作答 {s.firstIndependent} 次，答对 {s.firstIndependentCorrect} 次。</p><p className="coach-note">{s.firstIndependent<3?'这类作答少于 3 题，数据不足。':'已有计时训练证据，仍不足以判定等级。'}微课和精听缺少完整的辅助使用记录，不计入这项；未记录的外部帮助也无法核验。复用材料和同题再练不视为独立进步证据，未回答的题不算错误。</p></article>})}
 <article><h3>写作</h3><p>课程文字提交 {report.writing.courseTexts} 次；考试文字作答 {report.writing.examTexts} 项。</p><p>另外保存文字对话 {report.writing.textChatTurns} 轮。</p><p className="coach-note">数量说明已练习，不代表质量得分。文字对话不计入口语录音。</p></article>
 <article><h3>口语</h3><p>保存录音记录 {report.speaking.recordings} 段，采样时长 {Math.floor(report.speaking.recordingMs/60000)} 分 {Math.floor(report.speaking.recordingMs%60000/1000)} 秒。</p><p>获得回复的录音 {report.speaking.repliedAudioTurns} 轮；已结束且含录音回复的会话 {report.speaking.finishedAudioConversations} 次；考试已提交口语答案 {report.speaking.examAnswers} 项。</p><p className="coach-note">只统计成功识别后保存的录音记录，包含未选为考试答案的重录。时长来自音频采样，不等于有效开口时间或发音水平；原始音频未长期保存。发音评估暂不支持。</p></article></div>
 {profile.language==='fr-FR'&&<><h3>需复看的听读错题主题</h3>{report.weakPoints.length?<ul>{report.weakPoints.map(point=><li key={`${point.skill}:${point.knowledge}`}>{point.skill==='listening'?'听力':'阅读'} · {point.knowledge}：答错 {point.wrong} / 已答 {point.answered} 次</li>)}</ul>:<p>暂无带知识点标签的已保存听读错题。</p>}<p className="coach-note">按已保存题目标签汇总，包含重复练习；微课使用较宽泛的课程主题。单个错题不构成能力诊断。写作和口语暂未形成可汇总的结构化薄弱点，请查看各任务的具体参考反馈。</p></>}
 <p>已保存 AI 文字参考反馈：对话 {report.feedback.conversationTurns} 轮、考试 {report.feedback.examTasks} 项。反馈不能替代官方成绩或人工审核。</p>
 <details><summary>收藏与复习（当前语言全部等级）</summary><p>收藏 {report.review.saved} 条；完成复习 {report.review.events} 次；到期 {report.review.due} 条。复习按本语言汇总，因为历史复习项未必保存独立等级。</p><p>{report.review.delayed.attempts?`按上一轮安排到期后再次作答 ${report.review.delayed.attempts} 次；其中在新情境保存回答 ${report.review.delayed.transferAnswered} 次，自评能运用 ${report.review.delayed.selfRatedEasy} 次。`:'尚无按上一轮安排到期后再次作答的记录。'}</p><p className="coach-note">这项不计首次收藏后的作答，因为旧记录未保留该次原定到期时间；“能运用”是学习者自评，不代表答案已由 AI、教师或客观题判定正确。</p></details>
 <p className="coach-note">统计截至 {new Date(report.asOf).toLocaleString('zh-CN',{timeZone:profile.goal.timezone})}（{profile.goal.timezone}）。页面停留、计划预计分钟数和播放次数均不计为学习时长。</p><Button variant="outline" onClick={()=>setReload(v=>v+1)}>更新报告</Button>
 </>}
 </section>;
}
