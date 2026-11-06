import type {EnglishSession,EnglishTurn} from './types';

type DraftStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type SessionShape=Pick<EnglishSession,'id'|'scenarioVersion'|'status'|'answers'|'revision'|'turns'|'scenario'>;
export type EnglishResponseCommand={id:string;turnId:string;turnRevision:number};
export type EnglishAudioCommand={id:string;recordingId:string;turnCount:number};
export type EnglishTextCommand={id:string;turnCount:number};
export type EnglishSessionDraft={answers:Record<string,number>;text:string;edit:string|null;responseCommand:EnglishResponseCommand|null;audioCommand:EnglishAudioCommand|null;textCommand:EnglishTextCommand|null;restored:boolean};
const maxAge=24*60*60*1000;
const key=(profileId:string,sessionId:string)=>`english-session-draft:${profileId}:${sessionId}`;
const blank=():EnglishSessionDraft=>({answers:{},text:'',edit:null,responseCommand:null,audioCommand:null,textCommand:null,restored:false});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const currentTurn=(session:SessionShape):EnglishTurn|undefined=>session.turns.find(turn=>turn.state!=='replied');
const originalEdit=(turn:EnglishTurn)=>turn.acceptedText??turn.originalTranscript;

export function englishSessionStorage():Storage|null{try{return typeof window==='undefined'?null:window.sessionStorage}catch{return null}}

export function readEnglishSessionDraft(storage:DraftStorage|null,profileId:string,session:SessionShape,now=Date.now()):EnglishSessionDraft{
 if(!storage)return blank();
 try{
  const raw=storage.getItem(key(profileId,session.id));if(!raw)return blank();
  const saved=JSON.parse(raw) as {savedAt?:unknown;scenarioVersion?:unknown;answers?:unknown;text?:unknown;edit?:unknown;responseCommand?:unknown;audioCommand?:unknown;textCommand?:unknown};
  if(typeof saved.savedAt!=='number'||saved.savedAt>now||now-saved.savedAt>=maxAge||saved.scenarioVersion!==session.scenarioVersion){storage.removeItem(key(profileId,session.id));return blank()}
  const draft=blank();
  if(session.status==='listening'&&saved.answers&&typeof saved.answers==='object'&&!Array.isArray(saved.answers)){
   const values=saved.answers as Record<string,unknown>;
   for(const question of session.scenario.questions){const answer=values[question.id];if(Number.isInteger(answer)&&Number(answer)>=0&&Number(answer)<question.options.length)draft.answers[question.id]=Number(answer)}
  }
  const turn=currentTurn(session);
  if(session.status==='speaking'&&!turn&&session.turns.length<3&&typeof saved.text==='string'&&saved.text.length<=3000)draft.text=saved.text;
  if(session.status==='speaking'&&turn&&saved.edit&&typeof saved.edit==='object'){
   const edit=saved.edit as {turnId?:unknown;revision?:unknown;text?:unknown};
   if(edit.turnId===turn.id&&edit.revision===turn.revision&&typeof edit.text==='string'&&edit.text.length<=3000&&edit.text!==originalEdit(turn))draft.edit=edit.text;
  }
  if(session.status==='speaking'&&turn?.state==='ready'&&saved.responseCommand&&typeof saved.responseCommand==='object'){
   const command=saved.responseCommand as Partial<EnglishResponseCommand>;
   if(typeof command.id==='string'&&uuid.test(command.id)&&command.turnId===turn.id&&command.turnRevision===turn.revision)draft.responseCommand=command as EnglishResponseCommand;
  }
  if(session.status==='speaking'&&!turn&&session.turns.length<3&&saved.audioCommand&&typeof saved.audioCommand==='object'){
   const command=saved.audioCommand as Partial<EnglishAudioCommand>;
   if(typeof command.id==='string'&&uuid.test(command.id)&&typeof command.recordingId==='string'&&uuid.test(command.recordingId)&&command.turnCount===session.turns.length)draft.audioCommand=command as EnglishAudioCommand;
  }
  if(session.status==='speaking'&&!turn&&session.turns.length<3&&draft.text.trim()&&saved.textCommand&&typeof saved.textCommand==='object'){
   const command=saved.textCommand as Partial<EnglishTextCommand>;
   if(typeof command.id==='string'&&uuid.test(command.id)&&command.turnCount===session.turns.length)draft.textCommand=command as EnglishTextCommand;
  }
  draft.restored=Object.keys(draft.answers).length>0||Boolean(draft.text)||draft.edit!==null||draft.responseCommand!==null||draft.audioCommand!==null||draft.textCommand!==null;
  if(!draft.restored)storage.removeItem(key(profileId,session.id));
  return draft;
 }catch{return blank()}
}

export function writeEnglishSessionDraft(storage:DraftStorage|null,profileId:string,session:SessionShape,draft:Pick<EnglishSessionDraft,'answers'|'text'|'edit'|'responseCommand'|'audioCommand'|'textCommand'>,now=Date.now()){
 if(!storage)return;
 try{
  const answers:Record<string,number>={};
  if(session.status==='listening')for(const question of session.scenario.questions){const answer=draft.answers[question.id];if(Number.isInteger(answer)&&answer>=0&&answer<question.options.length)answers[question.id]=answer}
  const turn=currentTurn(session);
  const text=session.status==='speaking'&&!turn&&session.turns.length<3?draft.text.slice(0,3000):'';
  const edit=session.status==='speaking'&&turn&&draft.edit!==null&&draft.edit!==originalEdit(turn)?{turnId:turn.id,revision:turn.revision,text:draft.edit.slice(0,3000)}:null;
  const responseCommand=session.status==='speaking'&&turn?.state==='ready'&&draft.responseCommand?.turnId===turn.id&&draft.responseCommand.turnRevision===turn.revision?draft.responseCommand:null;
  const audioCommand=session.status==='speaking'&&!turn&&session.turns.length<3&&draft.audioCommand?.turnCount===session.turns.length?draft.audioCommand:null;
  const textCommand=session.status==='speaking'&&!turn&&session.turns.length<3&&text.trim()&&draft.textCommand?.turnCount===session.turns.length?draft.textCommand:null;
  if(!Object.keys(answers).length&&!text&&!edit&&!responseCommand&&!audioCommand&&!textCommand){storage.removeItem(key(profileId,session.id));return}
  storage.setItem(key(profileId,session.id),JSON.stringify({savedAt:now,scenarioVersion:session.scenarioVersion,answers,text,edit,responseCommand,audioCommand,textCommand}));
 }catch{/* Session storage may be unavailable; the mounted form keeps its input. */}
}

export function clearEnglishSessionDraft(storage:DraftStorage|null,profileId:string,sessionId:string){try{storage?.removeItem(key(profileId,sessionId))}catch{/* Storage may be unavailable. */}}
