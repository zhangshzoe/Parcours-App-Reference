import type {ExamResult,ExamSkillEvidence} from './exam-types';
// Deterministic summary of this saved attempt only; no inferred skill scores.
export function examSkillEvidence(items:ExamResult['items']):ExamSkillEvidence[]{
 return (['listening','reading','writing','speaking'] as const).map(skill=>{
  const group=items.filter(i=>i.skill===skill),answered=group.filter(i=>i.answered),objective=skill==='listening'||skill==='reading';
  const fresh=answered.filter(i=>!i.repeated),repeated=answered.length-fresh.length,wrong=answered.filter(i=>i.correct===false),knowledge=[...new Set(wrong.map(i=>i.knowledge))];
  const state=group.length===0?'not-included':answered.length===0?'not-assessed':answered.length<group.length?'partial':'provided';
  let nextStep=group.length===0?'本卷未包含此技能，后续需单独练习。':answered.length===0?'尚无本次作答证据，先完成一项对应练习。':objective?(knowledge.length?`先复盘本次答错的考点：${knowledge.slice(0,3).join('、')}。`:'本次已答题中没有发现错误；继续用新的材料检查迁移运用。'):'按任务要点自查，再查看考后文字参考反馈并重新表达。';
  if(objective&&answered.length&&fresh.length<3)nextStep+=' 首次作答样本少于 3 题，不能据此判定技能强弱。';
  if(repeated)nextStep+=` ${repeated} 项为重复练习，不能当作独立进步证据。`;
  return {skill,state,total:group.length,answered:answered.length,firstExposure:fresh.length,repeated,...(objective?{correct:answered.filter(i=>i.correct).length,firstCorrect:fresh.filter(i=>i.correct).length}:{}),evidence:group.length===0||answered.length===0?'none':objective?'objective-answers':skill==='writing'?'saved-writing':'confirmed-audio-transcript',nextStep};
 });
}
