import type {ExamResult} from '@/lib/coach/exam-types';
import {examSkillEvidence} from '@/lib/coach/exam-report';
const names={listening:'听力',reading:'阅读',writing:'写作',speaking:'口语'};
export function ExamEvidenceReport({result}:{result:ExamResult}){
 const evidence=result.skillEvidence??examSkillEvidence(result.items);
 return <section aria-label="分技能证据与下一步"><h3>分技能证据与下一步</h3><p className="coach-note">这里只汇总本次保存的作答，不给未测技能补分，也不生成总体语言等级。</p><div className="coach-course-grid">{evidence.map(entry=><section className="coach-note-box" key={entry.skill}><h4>{names[entry.skill]}</h4><p>{{'not-included':'本卷未包含 · 尚未评估','not-assessed':'未作答 · 尚未评估',partial:'部分作答',provided:'已提供本次作答'}[entry.state]}</p>{entry.total>0&&<p>已作答 {entry.answered} / {entry.total} 项</p>}{entry.correct!==undefined&&entry.answered>0&&<><p>已答题中答对 {entry.correct} / {entry.answered} 题</p><p className="coach-note">首次作答 {entry.firstExposure} 题（答对 {entry.firstCorrect}）；重复练习 {entry.repeated} 题。</p></>}{entry.evidence==='saved-writing'&&<p>证据：已保存的写作文本。质量参考反馈见对应任务，不换算为分数。</p>}{entry.evidence==='confirmed-audio-transcript'&&<p>证据：本题已选定的录音及确认转写记录。原始音频未长期保存，无法回听，不评估发音或有效开口时长。</p>}<p>{entry.nextStep}</p></section>)}</div></section>;
}
