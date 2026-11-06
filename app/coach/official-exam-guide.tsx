import type {OfficialExamOverview} from '@/lib/coach/exam-overview';

export function OfficialExamGuide({overview}:{overview:OfficialExamOverview}) {
 return <details className="coach-official-exam">
  <summary>了解官方考试 · {overview.status==='unverified'?'待核实':'部分已核实'}</summary>
  <p>{overview.scope}</p>
  <p className="coach-note">核对日期：{overview.checkedAt}{overview.documentVersion&&` · 官方文件版本：${overview.documentVersion}`}</p>
  {overview.facts.length>0&&<dl>{overview.facts.map(fact=><div key={fact.label}>
   <dt>{fact.label}</dt><dd>{fact.text} <a className="coach-source-link" href={fact.sourcePage?`${overview.source.url}#page=${fact.sourcePage}`:overview.source.url} target="_blank" rel="noreferrer">{fact.sourcePage?`来源第 ${fact.sourcePage} 页`:`来源：${fact.sourceSection}`}</a></dd>
  </div>)}</dl>}
  <p><a className="coach-source-link" href={overview.source.url} target="_blank" rel="noreferrer">{overview.source.title}</a></p>
  <p className="coach-note"><strong>尚待核实：</strong>{overview.pending.join('；')}。</p>
  <p className="coach-note-box">下方为应用自定的原创专项和缩短训练卷。训练时长、播放限制与计分以各训练卡片为准，练习结果不能换算成官方成绩。</p>
  {overview.language==='fr-FR'&&<p className="coach-note">完整模考尚未开放。要达到可用的模拟考试，还需按已核实的四科时长组织连续作答，核对 FEI 现行任务与评分细则，按实际播放次数限制听力，并完成口试互动、语音及人工审校验证。</p>}
 </details>;
}
