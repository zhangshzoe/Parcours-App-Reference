import {CoachError} from '@/lib/coach/server';
import {aiConfig} from '@/lib/coach/ai';
import {englishScenarios,type EnglishScenario} from './scenarios';
import type {EnglishHelp,EnglishListeningResult,EnglishProfile,EnglishReview,EnglishSession,EnglishTurn} from './types';

export type ProfileRow={id:string;user_id:string;daily_minutes:number;revision:number;last_command:string;created_at:number;updated_at:number};
export type SessionRow={id:string;profile_id:string;scenario_id:string;scenario_version:number;difficulty:'basic'|'advanced';snapshot:string;status:'listening'|'speaking'|'finished';answers:string;help:string;listening_result:string|null;revision:number;last_command:string|null;consent_version:string;created_at:number;submitted_at:number|null;ended_at:number|null};
export type TurnRow={id:string;session_id:string;sequence:number;input_kind:'audio'|'text';original_transcript:string;accepted_text:string|null;revision:number;state:'draft'|'ready'|'replied';feedback:string|null;recording_ms:number;created_at:number};
export const initialHelp=():EnglishHelp=>({plays:0,segments:[],slow:false,text:false,translation:false,deviceVoice:false,speakingHints:[]});
export const publicProfile=(p:ProfileRow):EnglishProfile=>({id:p.id,dailyMinutes:p.daily_minutes as 10|20|30,revision:p.revision,createdAt:p.created_at,updatedAt:p.updated_at});
export async function ownProfile(db:D1Database,userId:string,id:string){const p=await db.prepare('SELECT * FROM english_profiles WHERE id=? AND user_id=?').bind(id,userId).first<ProfileRow>();if(!p)throw new CoachError(404,'找不到英语学习档案。');return p}
export async function ownSession(db:D1Database,profileId:string,id:string){const row=await db.prepare('SELECT * FROM english_sessions WHERE id=? AND profile_id=?').bind(id,profileId).first<SessionRow>();if(!row)throw new CoachError(404,'找不到这次英语练习。');return row}
export async function sessionView(db:D1Database,row:SessionRow):Promise<EnglishSession>{
 const scenario=JSON.parse(row.snapshot) as EnglishScenario;
 const turns=await db.prepare('SELECT * FROM english_turns WHERE session_id=? ORDER BY sequence').bind(row.id).all<TurnRow>();
 const help=JSON.parse(row.help) as EnglishHelp;
 const savedResult=row.listening_result?JSON.parse(row.listening_result) as EnglishListeningResult:null;
 return {id:row.id,scenarioId:row.scenario_id,scenarioVersion:row.scenario_version,difficulty:row.difficulty,status:row.status,
  answers:JSON.parse(row.answers),help,listeningResult:savedResult?{...savedResult,assisted:savedResult.assisted||help.deviceVoice}:null,
  revision:row.revision,createdAt:row.created_at,submittedAt:row.submitted_at,endedAt:row.ended_at,
  scenario:{...scenario,questions:scenario.questions.map(q=>row.submitted_at?{...q}:{id:q.id,focus:q.focus,prompt:q.prompt,options:q.options})},
  turns:turns.results.map((t):EnglishTurn=>({id:t.id,sequence:t.sequence,inputKind:t.input_kind,originalTranscript:t.original_transcript,acceptedText:t.accepted_text,revision:t.revision,state:t.state,feedback:t.feedback?JSON.parse(t.feedback):null,recordingMs:t.recording_ms,createdAt:t.created_at}))};
}
export function listeningResult(s:EnglishScenario,answers:Record<string,number>,help:EnglishHelp):EnglishListeningResult{
 const items=s.questions.map(q=>({id:q.id,correct:answers[q.id]===q.answer,answer:q.answer,why:q.why,focus:q.focus}));
 return {correct:items.filter(i=>i.correct).length,total:items.length,assisted:help.text||help.translation||help.slow||help.deviceVoice||help.plays>s.clip.length,items};
}
export function capabilities(env:Parameters<typeof aiConfig>[0]){const configured=Boolean(aiConfig(env));return {configured,status:configured?'configured_unverified' as const:'not_configured' as const,provider:'OpenAI',message:configured?'语音和对话服务已配置，但英语真实效果尚未验证。':'语音和 AI 追问服务尚未配置；可先浏览场景，不能把设备朗读或固定示例当成真实 AI 反馈。'};}
export function alternativeQuestion(source:EnglishScenario,focus:string){return englishScenarios.flatMap(s=>s.scene===source.scene?[]:s.questions.filter(q=>q.focus===focus).map(q=>({scenario:s,question:q}))).at(0)??null}
export function reviewRow(row:{id:string;kind:string;due_at:number;revision:number;stage:number;payload:string},now=Date.now()):EnglishReview{return {id:row.id,kind:row.kind as EnglishReview['kind'],dueAt:row.due_at,due:row.due_at<=now,revision:row.revision,stage:row.stage,payload:JSON.parse(row.payload)}}
