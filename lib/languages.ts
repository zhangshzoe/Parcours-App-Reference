export type LearningLanguage='fr'|'en'|'de'|'ja';

export const languageOptions=[
 {id:'fr',label:'法语',native:'Français',locale:'fr-FR',short:'FR',welcome:'Bonjour',tagline:'你的法语进阶之路',practiceName:'法语',farewell:'À bientôt !',unit:'词'},
 {id:'en',label:'英语',native:'English',locale:'en-US',short:'EN',welcome:'Hello',tagline:'你的英语进阶之路',practiceName:'英语',farewell:'See you soon!',unit:'词'},
 {id:'de',label:'德语',native:'Deutsch',locale:'de-DE',short:'DE',welcome:'Hallo',tagline:'你的德语进阶之路',practiceName:'德语',farewell:'Bis bald!',unit:'词'},
 {id:'ja',label:'日语',native:'日本語',locale:'ja-JP',short:'JA',welcome:'こんにちは',tagline:'从零开始的日语之路',practiceName:'日语',farewell:'また会いましょう！',unit:'字'},
] as const;

export const languageGuide=(id:string|undefined)=>languageOptions.find(item=>item.id===id)??languageOptions[0];

const examTracks:Record<LearningLanguage,{name:string;levels:Record<string,{label:string;focus:string}>}>={
 fr:{name:'CEFR · DELF / DALF 参考路线',levels:{
  A1:{label:'DELF A1',focus:'理解并使用最基本的日常表达'},A2:{label:'DELF A2',focus:'在熟悉场景中完成简单、直接的信息交换'},'A2+':{label:'DELF A2 → B1 衔接',focus:'把短句组织成有顺序、有理由的完整表达'},B1:{label:'DELF B1',focus:'讲述经历并就熟悉话题解释观点'},B2:{label:'DELF B2',focus:'清楚论证立场，并比较方案与利弊'},C1:{label:'DALF C1',focus:'理解复杂材料，组织细致而连贯的论证'},C2:{label:'DALF C2',focus:'精准处理隐含意义、语体和复杂观点'},
 }},
 en:{name:'CEFR · Cambridge English 参考路线',levels:{
  A1:{label:'CEFR A1 · Cambridge English Scale',focus:'理解基础指令、个人信息和高频生活表达'},A2:{label:'Cambridge A2 Key',focus:'在简单日常场景中完成听说读写任务'},'A2+':{label:'A2 Key → B1 Preliminary 衔接',focus:'从信息交换过渡到连贯叙述和理由说明'},B1:{label:'Cambridge B1 Preliminary',focus:'掌握日常实用英语，理解事实、观点和语气'},B2:{label:'Cambridge B2 First',focus:'在英语环境中自信交流并完成结构化论证'},C1:{label:'Cambridge C1 Advanced',focus:'处理大学与职业场景中的复杂、抽象信息'},C2:{label:'Cambridge C2 Proficiency',focus:'以高度精确、灵活的英语表达复杂含义'},
 }},
 de:{name:'CEFR · Goethe-Zertifikat 参考路线',levels:{
  A1:{label:'Goethe-Zertifikat A1',focus:'介绍自己、理解基本信息并表达即时需要'},A2:{label:'Goethe-Zertifikat A2',focus:'在熟悉场景中直接交换信息并描述生活环境'},'A2+':{label:'Goethe A2 → B1 衔接',focus:'把日常短句发展为有顺序、有理由的表达'},B1:{label:'Goethe-Zertifikat B1',focus:'应对旅行与生活场景，讲述经历并解释计划'},B2:{label:'Goethe-Zertifikat B2',focus:'流利参与讨论，清楚说明观点及不同方案的利弊'},C1:{label:'Goethe-Zertifikat C1',focus:'理解较长复杂材料并进行结构严密的表达'},C2:{label:'Goethe-Zertifikat C2',focus:'接近母语水平地辨析含义、语气与复杂论证'},
 }},
 ja:{name:'JLPT 日本语能力测试参考路线',levels:{
  N4:{label:'零基础 → JLPT N4',focus:'从假名、基础句型和生活表达开始，理解基础日语'},N3:{label:'JLPT N3',focus:'衔接基础与进阶日语，理解日常话题中的概要和关系'},N2:{label:'JLPT N2',focus:'理解真实生活中较广泛场景的文章、对话与观点'},N1:{label:'JLPT N1',focus:'理解结构复杂、抽象度高且含有细微语气的日语材料'},
 }},
};
export const examTrack=(language:LearningLanguage)=>examTracks[language];
export const examGuide=(language:LearningLanguage,level:string)=>examTracks[language].levels[level]??{label:`CEFR ${level}`,focus:'围绕该等级的综合语言能力进行练习'};

export type EnglishStage={stage:string;reference:string;knowledge:string[]};
const englishStages:Record<string,EnglishStage>={
 A1:{stage:'基础起步',reference:'参考《新概念英语》第一册式基础训练',knowledge:['be 与人称代词','冠词、名词与复数','一般现在时','疑问句与否定句','there be 与方位','时间、数字与祈使句']},
 A2:{stage:'日常运用',reference:'参考第一册后半段的情景与语法递进',knowledge:['现在进行时','一般过去时','将来表达','可数与不可数名词','比较级与最高级','情态动词与日常功能表达']},
 'A2+':{stage:'句型与叙事衔接',reference:'参考第一册到第二册的过渡训练',knowledge:['现在完成时','过去进行时','时态衔接','顺序与因果连接','动名词与不定式','关系从句入门']},
 B1:{stage:'叙事与应用',reference:'参考第二册式短文、叙事与应用训练',knowledge:['时态对比','被动语态','间接引语','第一与第二条件句','限定性关系从句','情态推测与短语动词']},
 B2:{stage:'精读与论证',reference:'参考第二册到第三册的能力衔接',knowledge:['复杂条件句','非谓语与分词结构','高级被动结构','衔接与转述','搭配与改写','比较、让步与论证']},
 C1:{stage:'长文分析与语体',reference:'参考第三册式精读、分析与写作训练',knowledge:['倒装与强调结构','名词化','复杂名词短语','正式与非正式语体','立场与限定表达','概括、综合与篇章衔接']},
 C2:{stage:'精准表达与修辞',reference:'参考第四册式流利度、风格与批判阅读训练',knowledge:['含蓄与歧义','语义色彩与搭配','修辞与隐喻','反讽与语用推断','语体切换','批判阅读与精准改写']},
};
export const englishStageGuide=(level:string)=>englishStages[level]??englishStages.A1;

const japaneseStages:Record<string,EnglishStage>={
 N4:{stage:'零基础起步',reference:'假名入门、基础句型与生活日语',knowledge:['平假名与片假名','です／ます','助词 は・が・を・に','动词基础变形','い／な形容词','数字、时间与量词']},
 N3:{stage:'日常衔接',reference:'从短句过渡到连贯叙述与日常阅读',knowledge:['普通形与引用','授受与敬语入门','条件与推量','自动词与他动词','复合句与连接词','短文主旨与信息关系']},
 N2:{stage:'综合理解',reference:'面向真实生活、学习与工作的综合日语',knowledge:['书面语法与句式','观点与因果','长句结构分析','语境词汇与搭配','段落逻辑与改写','中长篇阅读与听力']},
 N1:{stage:'高级精读',reference:'复杂文章、抽象论证与细微语气辨析',knowledge:['高级语法与固定表达','抽象词汇与同义辨析','省略、指代与隐含义','论证结构与作者立场','语体、修辞与语用','综合理解与精准概括']},
};
export const japaneseStageGuide=(level:string)=>japaneseStages[level]??japaneseStages.N4;

const topicNames:Record<LearningLanguage,Record<string,string>>={
 fr:{daily:'Les petits échanges',food:'À table et en ville',travel:'Prendre le large',home:'Un nouveau chez-soi',work:'Apprendre et travailler',stories:'Les histoires de la vie',social:'On se retrouve ?',opinions:'Et vous, qu’en pensez-vous ?'},
 en:{daily:'Everyday conversations',food:'Food and shopping',travel:'Travel and transport',home:'Home and daily life',work:'Study and work',stories:'Life stories',social:'Plans and people',opinions:'Ideas and solutions'},
 de:{daily:'Gespräche im Alltag',food:'Essen und Einkaufen',travel:'Reisen und Verkehr',home:'Wohnen und Alltag',work:'Lernen und Arbeiten',stories:'Geschichten aus dem Leben',social:'Pläne und Begegnungen',opinions:'Meinungen und Lösungen'},
 ja:{daily:'日常の会話',food:'食事と買い物',travel:'旅行と交通',home:'住まいと暮らし',work:'勉強と仕事',stories:'経験を話す',social:'人とのつながり',opinions:'意見と相談'},
};
export const topicName=(topicId:string,language:LearningLanguage)=>topicNames[language][topicId]??topicId;
