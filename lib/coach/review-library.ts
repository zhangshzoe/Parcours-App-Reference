import type {PronunciationGuide} from './pronunciation-types';
import type {VocabularyEntry} from './vocabulary-types';

export const reviewLabels={vocabulary:'生词',sentence:'句子',expression:'常用表达',knowledge:'考点与错题'} as const;
export type SavedReview={id:string;source_key:string;kind:keyof typeof reviewLabels;stage:number;due_at:number;revision:number;payload:{target:string;zh:string;lessonTitle:string;language:string;pronunciation?:PronunciationGuide|null;entrySnapshot?:VocabularyEntry;skill?:'writing'|'speaking';knowledge?:string;taskVersion?:number;sourceAttemptId?:string;sourceItemId?:string|null;userAnswer?:string|null;reviewFocus?:'task';transferPrompt?:string|null}};
export type ReviewFilter={kind:'all'|SavedReview['kind'];timing:'all'|'due'|'later';query:string};
const normalize=(value:string)=>value.normalize('NFKC').toLocaleLowerCase().trim();
export function filterReviews(items:SavedReview[],filter:ReviewFilter,serverTime:number){
 const query=normalize(filter.query);
 return items.filter(item=>(filter.kind==='all'||item.kind===filter.kind)&&(filter.timing==='all'||(filter.timing==='due'?item.due_at<=serverTime:item.due_at>serverTime))&&(!query||normalize([item.payload.target,item.payload.zh,item.payload.lessonTitle].join(' ')).includes(query))).sort((a,b)=>a.due_at-b.due_at||a.id.localeCompare(b.id));
}
// Historical knowledge cards store prompt and explanation together. Never display
// that combined field before reveal or guess where the explanation starts.
export function reviewCue(item:SavedReview){return item.payload.transferPrompt??(item.payload.reviewFocus==='task'?'回想上次遗漏了哪一步，先自己补答，再查看建议。':item.kind==='knowledge'?'回想这次练习需要注意的考点，再查看参考答案与解释。':item.payload.zh)}
