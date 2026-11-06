import type {CoachLanguage,CoachLevel} from './types';
export type GrammarGuide={
 id:string;version:number;lessonId:string;lessonVersion:number;language:CoachLanguage;level:CoachLevel;knowledge:string;title:string;
 anchor:string;explanation:string;patterns:{target:string;zh:string;focus:string}[];
 practice:string;reference:{target:string;zh:string};checks:string[];
 source:{method:'AI-assisted';review:'not-human-reviewed';checkedAt:string;references:{title:string;url:string}[]};
};
