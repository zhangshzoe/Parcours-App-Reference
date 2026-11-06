import type {CoachLanguage,CoachLevel} from './types';

// Read-only guidance, deliberately separate from frozen application paper rules.
export type OfficialExamOverview = {
 version:string; language:CoachLanguage; level:CoachLevel; audience:'adult';
 checkedAt:string; documentVersion:string|null; status:'partially-verified'|'unverified';
 scope:string; facts:{label:string;text:string;sourcePage?:number;sourceSection?:string}[];
 pending:string[]; source:{title:string;url:string};
};
export function officialExamOverview(language:CoachLanguage,level:CoachLevel):OfficialExamOverview {
 const base={version:`official-overview-${language}-${level}-${language==='fr-FR'?'2026-10-04':'2026-10-03'}`,language,level,audience:'adult' as const,checkedAt:language==='fr-FR'?'2026-10-04':'2026-10-03'};
 if(language==='fr-FR'){
  const a1=level==='A1';
  return {...base,documentVersion:'2020-10-02 起施行的第 1 附件；2026-10-04 在效文本',status:'partially-verified',
   scope:`DELF tout public ${level} 成人普通考试。以下仅是法国法规中可直接核实的框架；FEI 考务细则和现行评分量表尚未核实。`,
   facts:[
    {label:'集体考试',text:a1?'听力 20 分钟、阅读 30 分钟、写作 30 分钟，共 1 小时 20 分钟。':'听力 25 分钟、阅读 30 分钟、写作 45 分钟，共 1 小时 40 分钟。',sourceSection:`附件 1 · DELF ${level}`},
    {label:'听力材料',text:a1?'多个日常生活场景的极短录音；最多听两次，全部录音材料合计最长 3 分钟。':'多个日常生活场景的短录音；最多听两次，全部录音材料合计最长 5 分钟。',sourceSection:`附件 1 · DELF ${level}`},
    {label:'笔试任务',text:a1?'阅读多个日常生活文件；写作涉及个人信息和简单句。':'阅读多个日常生活短文件；写作涉及经历描述及邀请、感谢、道歉、建议等互动。',sourceSection:`附件 1 · DELF ${level}`},
    {label:'口试',text:a1?'交流个人信息，5—7 分钟；准备 10 分钟。':'提供描述性信息并互动，6—8 分钟；准备 10 分钟。',sourceSection:`附件 1 · DELF ${level}`},
    {label:'分值与通过条件',text:'四项各 25 分；总分至少 50/100，且每项不低于 5/25。实际结果由考试评审委员会裁定。',sourceSection:'附件 1 与第 6 条'}
   ],
   pending:['FEI 现行任务数量、题目细分与考场播放流程','FEI 现行评分量表及口试互动操作','官方样题复制与分发许可','本应用原创材料与真实语音的质量审核'],
   source:{title:'法国政府 Légifrance：2020-1196 号法令（在效文本）',url:'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000042382849/'}};
 }
 const a1=level==='A1';
 return {...base,documentVersion:'2025-09-01',status:'partially-verified',
  scope:'成人考试的常规安排摘要。特殊需求安排及数字／在线考试附录尚未逐项核对；具体安排请以考点和官方现行文件为准。',
  facts:[
   {label:'笔试时长',text:a1?'共 65 分钟，无中场休息：听力约 20 分钟、阅读 25 分钟、写作 20 分钟。':'共 90 分钟，无中场休息：阅读 30 分钟、听力约 30 分钟、写作 30 分钟。',sourcePage:4},
   {label:'口试形式',text:a1?'最多 4 人的小组口试，共 15 分钟，无准备时间。':'通常为双人口试，共 15 分钟；特殊情况下可安排单人口试，10 分钟。均无准备时间。',sourcePage:4},
   {label:'分值与通过条件',text:a1?'满分 100 分，笔试 75 分、口试 25 分。总分至少 60 分，且必须参加全部考试部分。':'满分 100 分，笔试 75 分、口试 25 分。须参加全部考试部分，总分至少 60 分，同时笔试至少 45 分、口试至少 15 分。',sourcePage:a1?10:11}
  ],
  pending:['各部分详细评分量表','听力各题段播放次数与操作细则','特殊需求安排、数字／在线考试附录','官方样题复制与分发许可'],
  source:{title:a1?'Goethe A1 Start Deutsch 1 实施细则':'Goethe A2 实施细则（本文采用成人版本）',url:`https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_${a1?'A1_Start_Deutsch_1':'A2'}.pdf`}
 };
}
