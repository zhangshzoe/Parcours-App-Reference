export const levelOptions = [
  {id:'A1',label:'A1 入门',description:'用简短句子介绍自己、询问信息、表达日常需要。',minWords:20,maxWords:45,completionWords:15,speaking:'用 3–5 个短句回应。先把人、地点、时间说清楚。',reading:'找出人物、地点、时间或价格，用简单短句回答。'},
  {id:'A2',label:'A2 巩固',description:'巩固熟悉场景中的日常交流和基础表达。',minWords:40,maxWords:90,completionWords:8,speaking:'连贯说清日常需求，并补充一两个具体细节。',reading:'找出人物、时间、地点，再概括主要信息。'},
  {id:'A2+',label:'A2+ 过渡',description:'把短句串起来，逐步增加理由、经历和细节。',minWords:40,maxWords:90,completionWords:8,speaking:'把几句话连起来，补充原因或先后顺序。',reading:'找出事情的先后顺序，说明人物的理由。'},
  {id:'B1',label:'B1 进阶',description:'讲述经历、解释理由，围绕熟悉的话题表达观点。',minWords:40,maxWords:100,completionWords:8,speaking:'围绕一个观点说一段话，加入经历、理由和例子。',reading:'概括主要观点，区分事实、理由和个人看法。'},
  {id:'B2',label:'B2 拓展',description:'比较方案、回应异议，构建有例证的观点。',minWords:100,maxWords:170,completionWords:80,speaking:'用约 2 分钟陈述立场、举例，并回应一种反对意见。',reading:'辨认立场与论据，说明让步或转折如何改变结论。'},
  {id:'C1',label:'C1 深入',description:'组织复杂论证、整合信息，理解隐含态度与语体。',minWords:180,maxWords:265,completionWords:140,speaking:'用约 3 分钟展开论证，概括异议，再用限定条件修正结论。',reading:'分析隐含立场、论证前提与语体；用自己的话重述。'},
  {id:'C2',label:'C2 精研',description:'辨析细微含义、修辞与语气，精准重构复杂表达。',minWords:240,maxWords:350,completionWords:200,speaking:'用约 4 分钟重构双方立场，辨析隐含前提，并根据听众调整措辞。',reading:'辨析反讽、预设和细微差别；比较另一种表达会如何改变含义。'},
  {id:'N4',label:'N4 零基础',description:'从假名和基础句型开始，完成简单的生活交流。',minWords:25,maxWords:100,completionWords:15,speaking:'用基础句型完成 3–5 句日语回应。',reading:'识别假名、基础汉字和时间地点等关键信息。'},
  {id:'N3',label:'N3 衔接',description:'理解日常话题的概要，把短句组织成连贯表达。',minWords:70,maxWords:180,completionWords:50,speaking:'连贯说明经历、原因和下一步。',reading:'概括短文主旨，找出人物关系、原因与结果。'},
  {id:'N2',label:'N2 进阶',description:'处理生活、学习和工作中的较复杂材料与观点。',minWords:130,maxWords:300,completionWords:100,speaking:'比较观点并用具体根据说明立场。',reading:'分析长句结构、段落逻辑和作者的主要判断。'},
  {id:'N1',label:'N1 高级',description:'理解抽象论证、隐含态度和细微语气差别。',minWords:200,maxWords:450,completionWords:150,speaking:'重构复杂观点，辨析语气并根据听众调整表达。',reading:'辨析省略、指代、修辞与作者未直接说明的立场。'},
] as const;
export type LearningLevel = typeof levelOptions[number]['id'];
export const levelGuide = (level:string) => levelOptions.find(item=>item.id===level) ?? levelOptions[1];
export const countLearningUnits = (text:string,language:string='fr') => language==='ja'?[...text.replace(/[\s\p{P}\p{S}]/gu,'')].length:(text.trim()?text.trim().split(/\s+/u).length:0);
export const countFrenchWords = (text:string) => countLearningUnits(text,'fr');
