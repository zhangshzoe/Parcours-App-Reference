type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type SavedRetry={id:string;accepted_text:string|null};
export type ExamRetryTextDraft={text:string;pending:{retryId:string;text:string}|null;restored:boolean};
export type ExamRetryAudioTicket={recordingId:string;commandId:string};
const ttl=24*60*60*1000,uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const key=(profileId:string,attemptId:string,itemId:string)=>`coach-exam-retry:${profileId}:${attemptId}:${itemId}`;
const audioKey=(profileId:string,attemptId:string,itemId:string)=>`coach-exam-retry-audio:${profileId}:${attemptId}:${itemId}`;
const blank=():ExamRetryTextDraft=>({text:'',pending:null,restored:false});
export function examRetryStorage():Store|null{try{return typeof window==='undefined'?null:window.sessionStorage}catch{return null}}
export function readExamRetryTextDraft(store:Store|null,profileId:string,attemptId:string,itemId:string,retries:readonly SavedRetry[],now=Date.now()):ExamRetryTextDraft{
 if(!store)return blank();let saved:unknown;
 try{saved=JSON.parse(store.getItem(key(profileId,attemptId,itemId))??'null')}catch{return blank()}
 if(!saved||typeof saved!=='object')return blank();
 if(retries.length>=3){try{store.removeItem(key(profileId,attemptId,itemId))}catch{}return blank()}
 const value=saved as Record<string,unknown>;
 if(value.profileId!==profileId||value.attemptId!==attemptId||value.itemId!==itemId||typeof value.savedAt!=='number'||value.savedAt>now||now-value.savedAt>ttl){try{store.removeItem(key(profileId,attemptId,itemId))}catch{}return blank()}
 let text=typeof value.text==='string'&&value.text.length<=6000?value.text:'';
 let pending:ExamRetryTextDraft['pending']=null;
 const command=value.pending;
 if(command&&typeof command==='object'){
  const item=command as Record<string,unknown>;
  if(typeof item.retryId==='string'&&uuid.test(item.retryId)&&typeof item.text==='string'&&item.text.length<=6000&&item.text.trim()&&text===item.text){
   const recorded=retries.find(r=>r.id===item.retryId);
   if(recorded){if(recorded.accepted_text===text)text=''}else pending={retryId:item.retryId,text:item.text};
  }
 }
 const draft={text,pending,restored:Boolean(text||pending)};
 if(!draft.restored)try{store.removeItem(key(profileId,attemptId,itemId))}catch{}
 return draft;
}
export function writeExamRetryTextDraft(store:Store|null,profileId:string,attemptId:string,itemId:string,draft:Pick<ExamRetryTextDraft,'text'|'pending'>,now=Date.now()){
 if(!store)return;try{
  if(!draft.text&&!draft.pending){store.removeItem(key(profileId,attemptId,itemId));return}
  store.setItem(key(profileId,attemptId,itemId),JSON.stringify({profileId,attemptId,itemId,savedAt:now,text:draft.text.slice(0,6000),pending:draft.pending}));
 }catch{}
}

// Keep only the receipt identifiers across a refresh. Recording bytes remain in memory.
export function readExamRetryAudioTicket(store:Store|null,profileId:string,attemptId:string,itemId:string,retries:readonly SavedRetry[],now=Date.now()):ExamRetryAudioTicket|null{
 if(!store)return null;const storageKey=audioKey(profileId,attemptId,itemId);let saved:unknown;
 try{saved=JSON.parse(store.getItem(storageKey)??'null')}catch{return null}
 if(!saved||typeof saved!=='object')return null;
 const value=saved as Record<string,unknown>;
 if(value.profileId!==profileId||value.attemptId!==attemptId||value.itemId!==itemId||typeof value.savedAt!=='number'||value.savedAt>now||now-value.savedAt>ttl||typeof value.recordingId!=='string'||!uuid.test(value.recordingId)||typeof value.commandId!=='string'||!uuid.test(value.commandId)||retries.length>=3||retries.some(r=>r.id===value.recordingId)){
  try{store.removeItem(storageKey)}catch{}return null;
 }
 return {recordingId:value.recordingId,commandId:value.commandId};
}
export function writeExamRetryAudioTicket(store:Store|null,profileId:string,attemptId:string,itemId:string,ticket:ExamRetryAudioTicket|null,now=Date.now()){
 if(!store)return;try{
  if(!ticket){store.removeItem(audioKey(profileId,attemptId,itemId));return}
  store.setItem(audioKey(profileId,attemptId,itemId),JSON.stringify({profileId,attemptId,itemId,savedAt:now,...ticket}));
 }catch{}
}
