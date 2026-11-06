import type {CoachLanguage,CoachLevel} from './types';
export type AssessmentQuestion={id:string;skill:'reading'|'listening';level:CoachLevel;text:string;translation:string;prompt:string;options:string[];answer:number;explanation:string;knowledge:string};
export type AssessmentDefinition={version:number;language:CoachLanguage;questions:AssessmentQuestion[];source:{type:'original';method:'AI-assisted';review:'not-human-reviewed'}};
export type AssessmentAnswers={choices:Record<string,number>;selfRatings:{speaking:number|null;writing:number|null}};
export type AssessmentResult={
 skills:Record<'reading'|'listening',{answered:number;total:number;correct:number|null}>;
 selfRatings:AssessmentAnswers['selfRatings'];
 items:{id:string;correct:boolean|null;answer:number;explanation:string;text:string;translation:string;knowledge:string}[];
 suggestion:'try-a2'|'consolidate-a1'|'insufficient';reason:string;repeated:boolean;ruleVersion:string;notice:string;
};
export type AssessmentAttempt={id:string;language:CoachLanguage;version:number;status:'active'|'submitted'|'skipped';revision:number;answers:AssessmentAnswers;repeated:boolean;playedQuestionIds:string[];createdAt:number;submittedAt:number|null;result:AssessmentResult|null;questions:Omit<AssessmentQuestion,'answer'|'explanation'|'translation'>[]};
export type AssessmentSession={attempt:AssessmentAttempt;capabilities:{configured:boolean;message:string};processing:boolean};
export type AssessmentCatalog={attempts:{id:string;status:AssessmentAttempt['status'];createdAt:number;repeated:boolean}[];capabilities:{configured:boolean;message:string}};
