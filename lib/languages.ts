export type LearningLanguage='fr'|'en'|'de';

export const languageOptions=[
 {id:'fr',label:'法语',native:'Français',locale:'fr-FR',short:'FR',welcome:'Bonjour',tagline:'你的法语进阶之路',practiceName:'法语',farewell:'À bientôt !'},
 {id:'en',label:'英语',native:'English',locale:'en-US',short:'EN',welcome:'Hello',tagline:'你的英语进阶之路',practiceName:'英语',farewell:'See you soon!'},
 {id:'de',label:'德语',native:'Deutsch',locale:'de-DE',short:'DE',welcome:'Hallo',tagline:'你的德语进阶之路',practiceName:'德语',farewell:'Bis bald!'},
] as const;

export const languageGuide=(id:string|undefined)=>languageOptions.find(item=>item.id===id)??languageOptions[0];

const examTracks:Record<LearningLanguage,{name:string;levels:Record<string,{label:string;focus:string}>}>={
 fr:{name:'CEFR · DELF / DALF 参考路线',levels:{
  A1:{label:'DELF A1',focus:'理解并使用最基本的日常表达'},A2:{label:'DELF A2',focus:'在熟悉场景中完成简单、直接的信息交换'},'A2+':{label:'DELF A2 → B1 衔接',focus:'把短句组织成有顺序、有理由的完整表达'},B1:{label:'DELF B1',focus:'讲述经历并就熟悉话题解释观点'},B2:{label:'DELF B2',focus:'清楚论证立场，并比较方案与利弊'},C1:{label:'DALF C1',focus:'理解复杂材料，组织细致而连贯的论证'},C2:{label:'DALF C2',focus:'精准处理隐含意义、语体和复杂观点'},
 }},
 en:{name:'CEFR · Cambridge English 参考路线',levels:{
  A1:{label:'CEFR A1 · Cambridge A1 Movers',focus:'理解基础指令、个人信息和高频生活表达'},A2:{label:'Cambridge A2 Key',focus:'在简单日常场景中完成听说读写任务'},'A2+':{label:'A2 Key → B1 Preliminary 衔接',focus:'从信息交换过渡到连贯叙述和理由说明'},B1:{label:'Cambridge B1 Preliminary',focus:'掌握日常实用英语，理解事实、观点和语气'},B2:{label:'Cambridge B2 First',focus:'在英语环境中自信交流并完成结构化论证'},C1:{label:'Cambridge C1 Advanced',focus:'处理大学与职业场景中的复杂、抽象信息'},C2:{label:'Cambridge C2 Proficiency',focus:'以高度精确、灵活的英语表达复杂含义'},
 }},
 de:{name:'CEFR · Goethe-Zertifikat 参考路线',levels:{
  A1:{label:'Goethe-Zertifikat A1',focus:'介绍自己、理解基本信息并表达即时需要'},A2:{label:'Goethe-Zertifikat A2',focus:'在熟悉场景中直接交换信息并描述生活环境'},'A2+':{label:'Goethe A2 → B1 衔接',focus:'把日常短句发展为有顺序、有理由的表达'},B1:{label:'Goethe-Zertifikat B1',focus:'应对旅行与生活场景，讲述经历并解释计划'},B2:{label:'Goethe-Zertifikat B2',focus:'流利参与讨论，清楚说明观点及不同方案的利弊'},C1:{label:'Goethe-Zertifikat C1',focus:'理解较长复杂材料并进行结构严密的表达'},C2:{label:'Goethe-Zertifikat C2',focus:'接近母语水平地辨析含义、语气与复杂论证'},
 }},
};
export const examTrack=(language:LearningLanguage)=>examTracks[language];
export const examGuide=(language:LearningLanguage,level:string)=>examTracks[language].levels[level]??{label:`CEFR ${level}`,focus:'围绕该等级的综合语言能力进行练习'};

const topicNames:Record<LearningLanguage,Record<string,string>>={
 fr:{daily:'Les petits échanges',food:'À table et en ville',travel:'Prendre le large',home:'Un nouveau chez-soi',work:'Apprendre et travailler',stories:'Les histoires de la vie',social:'On se retrouve ?',opinions:'Et vous, qu’en pensez-vous ?'},
 en:{daily:'Everyday conversations',food:'Food and shopping',travel:'Travel and transport',home:'Home and daily life',work:'Study and work',stories:'Life stories',social:'Plans and people',opinions:'Ideas and solutions'},
 de:{daily:'Gespräche im Alltag',food:'Essen und Einkaufen',travel:'Reisen und Verkehr',home:'Wohnen und Alltag',work:'Lernen und Arbeiten',stories:'Geschichten aus dem Leben',social:'Pläne und Begegnungen',opinions:'Meinungen und Lösungen'},
};
export const topicName=(topicId:string,language:LearningLanguage)=>topicNames[language][topicId]??topicId;
