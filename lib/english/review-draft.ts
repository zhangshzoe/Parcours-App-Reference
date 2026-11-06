import type {EnglishReview} from './types';

export type EnglishReviewMode='device-voice'|'text-assisted';
export type EnglishReviewPending={itemId:string;eventId:string;revision:number;grade:'again'|'hard'|'easy';answer:string;reviewMode?:EnglishReviewMode};
export type EnglishReviewDraft={
 answers:Record<string,string>;
 revealed:Record<string,boolean>;
 preparation:Record<string,EnglishReviewMode>;
 pending:EnglishReviewPending|null;
 restored:boolean;
};
type ReviewStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type ReviewItem=Pick<EnglishReview,'id'|'revision'|'due'>;
const maxAge=24*60*60*1000;
const key=(profileId:string)=>`english-review-draft:${profileId}`;
const blank=():EnglishReviewDraft=>({answers:{},revealed:{},preparation:{},pending:null,restored:false});
const validMode=(value:unknown):value is EnglishReviewMode=>value==='device-voice'||value==='text-assisted';
export function englishReviewStorage():Storage|null{try{return typeof window==='undefined'?null:window.sessionStorage}catch{return null}}

export function readEnglishReviewDraft(storage:ReviewStorage|null,profileId:string,items:readonly ReviewItem[],now=Date.now()):EnglishReviewDraft{
 if(!storage)return blank();
 try{
  const raw=storage.getItem(key(profileId));if(!raw)return blank();
  const saved=JSON.parse(raw) as {savedAt?:unknown;entries?:Record<string,{revision?:unknown;answer?:unknown;revealed?:unknown;reviewMode?:unknown}>;pending?:unknown};
  if(typeof saved.savedAt!=='number'||saved.savedAt>now||now-saved.savedAt>=maxAge||!saved.entries||typeof saved.entries!=='object'){
   storage.removeItem(key(profileId));return blank();
  }
  const draft=blank();
  for(const item of items.filter(item=>item.due)){
   const entry=saved.entries[item.id];
   if(!entry||entry.revision!==item.revision||typeof entry.answer!=='string'||entry.answer.length>3000||typeof entry.revealed!=='boolean')continue;
   draft.answers[item.id]=entry.answer;
   if(entry.revealed&&entry.answer.trim())draft.revealed[item.id]=true;
   if(validMode(entry.reviewMode))draft.preparation[item.id]=entry.reviewMode;
  }
  const pending=saved.pending as Partial<EnglishReviewPending>|null;
  if(pending&&typeof pending.itemId==='string'&&typeof pending.eventId==='string'&&typeof pending.revision==='number'&&
    ['again','hard','easy'].includes(String(pending.grade))&&typeof pending.answer==='string'&&
    draft.answers[pending.itemId]?.trim()===pending.answer&&items.some(item=>item.due&&item.id===pending.itemId&&item.revision===pending.revision)&&
    (pending.reviewMode===undefined||pending.reviewMode===draft.preparation[pending.itemId]))draft.pending=pending as EnglishReviewPending;
  draft.restored=Object.keys(draft.answers).length>0;
  if(!draft.restored)storage.removeItem(key(profileId));
  return draft;
 }catch{return blank()}
}

export function writeEnglishReviewDraft(storage:ReviewStorage|null,profileId:string,items:readonly ReviewItem[],draft:Omit<EnglishReviewDraft,'restored'>,now=Date.now()){
 if(!storage)return;
 try{
  const entries:Record<string,{revision:number;answer:string;revealed:boolean;reviewMode?:EnglishReviewMode}>={};
  for(const item of items.filter(item=>item.due)){
   const answer=draft.answers[item.id]??'',reviewMode=draft.preparation[item.id];
   if(answer.length>3000||(!answer.trim()&&!reviewMode&&!draft.revealed[item.id]))continue;
   entries[item.id]={revision:item.revision,answer,revealed:Boolean(draft.revealed[item.id]),...(reviewMode?{reviewMode}:{})};
  }
  if(Object.keys(entries).length===0){storage.removeItem(key(profileId));return}
  const pending=draft.pending&&entries[draft.pending.itemId]&&draft.pending.answer===entries[draft.pending.itemId].answer.trim()?draft.pending:null;
  storage.setItem(key(profileId),JSON.stringify({savedAt:now,entries,pending}));
 }catch{/* Private browsing or full storage: the mounted form still keeps the answer. */}
}

export function clearEnglishReviewDraft(storage:ReviewStorage|null,profileId:string){try{storage?.removeItem(key(profileId))}catch{/* Storage may be unavailable. */}}
