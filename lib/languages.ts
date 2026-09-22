export type LearningLanguage='fr'|'en'|'de';

export const languageOptions=[
 {id:'fr',label:'法语',native:'Français',locale:'fr-FR',short:'FR',welcome:'Bonjour',tagline:'你的法语进阶之路',practiceName:'法语',farewell:'À bientôt !'},
 {id:'en',label:'英语',native:'English',locale:'en-US',short:'EN',welcome:'Hello',tagline:'你的英语进阶之路',practiceName:'英语',farewell:'See you soon!'},
 {id:'de',label:'德语',native:'Deutsch',locale:'de-DE',short:'DE',welcome:'Hallo',tagline:'你的德语进阶之路',practiceName:'德语',farewell:'Bis bald!'},
] as const;

export const languageGuide=(id:string|undefined)=>languageOptions.find(item=>item.id===id)??languageOptions[0];

const topicNames:Record<LearningLanguage,Record<string,string>>={
 fr:{daily:'Les petits échanges',food:'À table et en ville',travel:'Prendre le large',home:'Un nouveau chez-soi',work:'Apprendre et travailler',stories:'Les histoires de la vie',social:'On se retrouve ?',opinions:'Et vous, qu’en pensez-vous ?'},
 en:{daily:'Everyday conversations',food:'Food and shopping',travel:'Travel and transport',home:'Home and daily life',work:'Study and work',stories:'Life stories',social:'Plans and people',opinions:'Ideas and solutions'},
 de:{daily:'Gespräche im Alltag',food:'Essen und Einkaufen',travel:'Reisen und Verkehr',home:'Wohnen und Alltag',work:'Lernen und Arbeiten',stories:'Geschichten aus dem Leben',social:'Pläne und Begegnungen',opinions:'Meinungen und Lösungen'},
};
export const topicName=(topicId:string,language:LearningLanguage)=>topicNames[language][topicId]??topicId;
