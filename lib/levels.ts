export const levelOptions = [
  {id:'A1',label:'A1 入门',description:'用简短句子介绍自己、询问信息、表达日常需要。',minWords:20,maxWords:45,completionWords:15,speaking:'用 3–5 个短句回应。先把人、地点、时间说清楚。',reading:'找出人物、地点、时间或价格，用简单短句回答。'},
  {id:'A2',label:'A2 巩固',description:'巩固熟悉场景中的日常交流和基础表达。',minWords:40,maxWords:90,completionWords:8,speaking:'连贯说清日常需求，并补充一两个具体细节。',reading:'找出人物、时间、地点，再概括主要信息。'},
  {id:'A2+',label:'A2+ 过渡',description:'把短句串起来，逐步增加理由、经历和细节。',minWords:40,maxWords:90,completionWords:8,speaking:'把几句话连起来，补充原因或先后顺序。',reading:'找出事情的先后顺序，说明人物的理由。'},
  {id:'B1',label:'B1 进阶',description:'讲述经历、解释理由，围绕熟悉的话题表达观点。',minWords:40,maxWords:100,completionWords:8,speaking:'围绕一个观点说一段话，加入经历、理由和例子。',reading:'概括主要观点，区分事实、理由和个人看法。'},
  {id:'B2',label:'B2 拓展',description:'比较方案、回应异议，构建有例证的观点。',minWords:100,maxWords:170,completionWords:80,speaking:'用约 2 分钟陈述立场、举例，并回应一种反对意见。',reading:'辨认立场与论据，说明让步或转折如何改变结论。'},
  {id:'C1',label:'C1 深入',description:'组织复杂论证、整合信息，理解隐含态度与语体。',minWords:180,maxWords:265,completionWords:140,speaking:'用约 3 分钟展开论证，概括异议，再用限定条件修正结论。',reading:'分析隐含立场、论证前提与语体；用自己的话重述。'},
  {id:'C2',label:'C2 精研',description:'辨析细微含义、修辞与语气，精准重构复杂表达。',minWords:240,maxWords:350,completionWords:200,speaking:'用约 4 分钟重构双方立场，辨析隐含前提，并根据听众调整措辞。',reading:'辨析反讽、预设和细微差别；比较另一种表达会如何改变含义。'},
] as const;
export type LearningLevel = typeof levelOptions[number]['id'];
export const levelGuide = (level:string) => levelOptions.find(item=>item.id===level) ?? levelOptions[1];
export const countFrenchWords = (text:string) => text.trim() ? text.trim().split(/\s+/u).length : 0;
