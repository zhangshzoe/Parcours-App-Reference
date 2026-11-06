import type {CoachLanguage,CoachLevel} from './types';
export type VocabularyEntry={
 id:string;version:number;language:CoachLanguage;level:CoachLevel;topic:string;kind:'noun'|'verb'|'expression';
 target:string;zh:string;example:string;exampleZh:string;collocation:string;
 grammar:{article?:string;gender?:'m'|'f'|'n';plural?:string;forms?:string;separablePrefix?:string;note?:string};
 source:{type:'original';method:'AI-assisted';review:'not-human-reviewed'};
};
export type VocabularyState={entries:VocabularyEntry[];savedIds:string[];capabilities:{configured:boolean;message:string};usage:{used:number;limit:number}};
