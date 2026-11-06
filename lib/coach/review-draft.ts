export type PendingReview={eventId:string;grade:'again'|'hard'|'easy';response?:string};
export type ReviewDraft={itemId:string;revision:number;response:string;revealed:boolean;pending:PendingReview|null;savedAt:number};
type ReviewStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const maxAge=24*60*60*1000;
const key=(profileId:string)=>`coach-review-draft:${profileId}`;

export function readReviewDraft(storage:ReviewStorage|null,profileId:string,now=Date.now()):ReviewDraft|null{
 if(!storage)return null;
 try{
  const raw=storage.getItem(key(profileId));if(!raw)return null;
  const value=JSON.parse(raw) as Partial<ReviewDraft>;
  const pending=value.pending;
  const valid=typeof value.itemId==='string'&&typeof value.revision==='number'&&Number.isInteger(value.revision)&&value.revision>=0&&
   typeof value.response==='string'&&value.response.length<=3000&&typeof value.revealed==='boolean'&&
   typeof value.savedAt==='number'&&value.savedAt<=now&&now-value.savedAt<maxAge&&
   (pending===null||(pending&&typeof pending.eventId==='string'&&['again','hard','easy'].includes(pending.grade)&&
    (pending.response===undefined||pending.response===value.response.trim())));
  if(!valid){storage.removeItem(key(profileId));return null}
  return value as ReviewDraft;
 }catch{return null}
}

export function writeReviewDraft(storage:ReviewStorage|null,profileId:string,draft:Omit<ReviewDraft,'savedAt'>,now=Date.now()){
 if(!storage)return;
 try{if(!draft.response.trim()&&!draft.pending)storage.removeItem(key(profileId));else storage.setItem(key(profileId),JSON.stringify({...draft,savedAt:now}))}catch{/* Private mode or storage full: the mounted form still keeps the answer. */}
}

export function clearReviewDraft(storage:ReviewStorage|null,profileId:string){try{storage?.removeItem(key(profileId))}catch{/* Storage may be unavailable. */}}

export function recoverReviewQueue<T extends {id:string;revision:number}>(selected:readonly T[],allDue:readonly T[],saved:ReviewDraft|null){
 if(!saved)return {queue:[...selected],restored:null,stale:false};
 const current=allDue.find(item=>item.id===saved.itemId&&item.revision===saved.revision);
 if(!current)return {queue:[...selected],restored:null,stale:true};
 return {queue:[current,...selected.filter(item=>item.id!==current.id)],restored:saved,stale:false};
}
