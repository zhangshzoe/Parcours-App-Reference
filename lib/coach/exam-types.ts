import type {CoachLanguage, CoachLevel} from './types';

export type ExamItem = {
 id:string; version:number; skill:'reading'|'writing'|'listening'|'speaking'; prompt:string;
 passage?:string; options?:string[]; answer?:number; explanation?:string;
 audio?:{key:string;text:string;translation:string;sourceLessonId:string;sourceMaterialId:string};
 oral?:{targetPrompt:string;tasks:string[];maxSeconds:60;practiceScenarioId?:string};
 knowledge:string; rubric?:string[]; suggestedWords?:[number,number];
};
export type PublicExamItem = Omit<ExamItem,'answer'|'explanation'|'rubric'|'audio'> & {audio?:{key:string}};
export type ExamPaper = {
 id:string; version:number; language:CoachLanguage; level:CoachLevel;
 title:string; kind:'reading'|'writing'|'listening'|'speaking'|'integrated'; durationSeconds:number; ruleId:string;
 ruleVersion:string; items:ExamItem[]; audioPolicy?:{maxRequests:number;rate:1;pause:false;label:string};
 source:{type:'original';method:'AI-assisted';review:'not-human-reviewed'};
};
export type PublicExamPaper = Omit<ExamPaper,'items'> & {items:PublicExamItem[]};
export type ExamAnswers = Record<string,number|string>;
export type ExamStudyHelp=Record<string,{hint?:boolean;transcript?:boolean;translation?:boolean;slow?:boolean;extraPlays?:number;deviceVoice?:boolean;reveal?:boolean}>;
export type ExamStudyDetails=Record<string,{hint?:string;transcript?:string;translation?:string;voiceText?:string;answer?:number;explanation?:string;rubric?:string[]}>;
export type ExamSkillEvidence={
 skill:'listening'|'reading'|'writing'|'speaking';state:'not-included'|'not-assessed'|'partial'|'provided';total:number;answered:number;firstExposure:number;repeated:number;correct?:number;firstCorrect?:number;evidence:'none'|'objective-answers'|'saved-writing'|'confirmed-audio-transcript';nextStep:string;
};
export type ExamResult = {
 skillEvidence?:ExamSkillEvidence[];
 objective:{correct:number;total:number;answered:number};
 writing:{provided:number;total:number;status:'not-assessed'};
 speaking?:{provided:number;total:number;status:'not-assessed'};
 items:{id:string;skill:'reading'|'writing'|'listening'|'speaking';answered:boolean;correct?:boolean;answer?:number;explanation?:string;rubric?:string[];wordCount?:number;knowledge:string;repeated:boolean;transcript?:string;translation?:string}[];
 notice:string;
};
export type ExamAttempt = {
 id:string; paper:PublicExamPaper; mode:'timed'|'study';studyHelp:ExamStudyHelp;studyDetails?:ExamStudyDetails;status:'active'|'submitted'|'expired';
 answers:ExamAnswers; revision:number; startedAt:number; deadlineAt:number;
 submittedAt:number|null; result:ExamResult|null; exposedItemIds:string[]; audioState?:import('./exam-audio').ExamAudioState;
};
export type ExamCatalog = {
 officialOverview:import('./exam-overview').OfficialExamOverview;
 papers:PublicExamPaper[]; attempts:{id:string;title:string;level:CoachLevel;kind:ExamPaper['kind'];mode:ExamAttempt['mode'];status:ExamAttempt['status'];startedAt:number;deadlineAt:number}[];
 rule:{id:string;name:string;sourceUrl:string;status:'partially-verified'|'unverified';note:string};
 capabilities?:{configured:boolean;message:string};
 fullPaper:{status:'available';label:string;paperId:string;notice:string};serverTime:number;
};
