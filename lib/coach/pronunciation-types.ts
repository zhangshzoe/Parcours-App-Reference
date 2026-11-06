import type {CoachLanguage,CoachLevel} from './types';
export type PronunciationGuide={
 id:string;version:number;lessonId:string;lessonVersion:number;language:CoachLanguage;level:CoachLevel;knowledge:string;title:string;
 explanation:string;examples:{segmentId:string;target:string;focus:string}[];practice:string;selfCheck:string;
 source:{method:'AI-assisted';review:'not-human-reviewed';checkedAt:string;references:{title:string;url:string}[]};
};
