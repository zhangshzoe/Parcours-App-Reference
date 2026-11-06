import type {PronunciationGuide} from './pronunciation-types';
import type {CoachLanguage,CoachLevel} from './types';
export type ListeningMaterial={
 pronunciation?:PronunciationGuide|null;
 id:string;version:number;lessonId:string;lessonVersion:number;language:CoachLanguage;level:CoachLevel;title:string;note:string;
 segments:{id:string;text:string;zh:string}[];
 questions:{id:string;prompt:string;options:string[];answer:number;explanation:string;knowledge:string}[];
 dictation:{prompt:string;accepted:string[];explanation:string};
 source:{type:'original';method:'AI-assisted';review:'not-human-reviewed';audio:'on-demand-ai-unverified'};
};
export type PublicListeningMaterial=Omit<ListeningMaterial,'segments'|'questions'|'dictation'|'note'|'lessonVersion'|'pronunciation'>&{
 segmentCount:number;
 questions:Omit<ListeningMaterial['questions'][number],'answer'|'explanation'>[];
 dictation:{prompt:string};
};
export type ListeningAnswers={choices:Record<string,number>;dictation:string};
export type ListeningResult={
 correct:number;total:number;answered:number;items:{id:string;answer:number;correct:boolean;explanation:string;knowledge:string}[];
 dictation:{provided:boolean;correct:boolean|null;accepted:string[];explanation:string};
 evidence:'browser-reported-playback';repeated:boolean;notice:string;
};
export type ListeningAttempt={
 id:string;material:PublicListeningMaterial;status:'active'|'submitted';revision:number;answers:ListeningAnswers;
 played:boolean;repeated:boolean;startedAt:number;submittedAt:number|null;result:ListeningResult|null;
 transcript:null|{segments:ListeningMaterial['segments'];note:string;pronunciation?:PronunciationGuide|null};
};
export type ListeningSession={attempt:ListeningAttempt;capabilities:{configured:boolean;message:string};processing:boolean};
export type ListeningCatalog={
 materials:PublicListeningMaterial[];
 attempts:{id:string;materialId:string;title:string;level:CoachLevel;status:ListeningAttempt['status'];startedAt:number}[];
 capabilities:{configured:boolean;message:string};usage:{used:number;limit:number};
};
