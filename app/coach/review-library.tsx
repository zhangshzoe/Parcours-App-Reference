'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {PronunciationNotes} from './pronunciation-notes';
import {filterReviews,reviewLabels,reviewCue,type SavedReview,type ReviewFilter} from '@/lib/coach/review-library';

export function ReviewLibrary({items,serverTime,language,onBack,onReview}:{items:SavedReview[];serverTime:number;language:string;onBack:()=>void;onReview:(ids:string[])=>void}){
 const [kind,setKind]=useState<ReviewFilter['kind']>('all'),[timing,setTiming]=useState<ReviewFilter['timing']>('all'),[query,setQuery]=useState(''),[limit,setLimit]=useState(20);
 const filtered=filterReviews(items,{kind,timing,query},serverTime),due=filtered.filter(item=>item.due_at<=serverTime);
 return <section className="coach-panel coach-review-library">
  <Button variant="outline" onClick={onBack}>返回我的</Button>
  <h2>生词、表达与考点收藏</h2>
  <p>当前语言共 {items.length} 条，包含各等级收藏。查看内容不会改变复习时间；只有提交回忆结果才会重新安排。</p>
  <div className="coach-review-filters">
   <label className="coach-field">内容类型<select value={kind} onChange={e=>{setKind(e.target.value as ReviewFilter['kind']);setLimit(20)}}><option value="all">全部类型</option>{Object.entries(reviewLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
   <label className="coach-field">复习时间<select value={timing} onChange={e=>{setTiming(e.target.value as ReviewFilter['timing']);setLimit(20)}}><option value="all">全部时间</option><option value="due">已到期</option><option value="later">尚未到期</option></select></label>
   <label className="coach-field coach-review-search">搜索收藏<input type="search" value={query} placeholder="词句、中文解释或来源" onChange={e=>{setQuery(e.target.value);setLimit(20)}}/></label>
  </div>
  <p role="status">找到 {filtered.length} 条，其中 {due.length} 条已到期。</p>
  <Button disabled={!due.length} onClick={()=>onReview(due.map(item=>item.id))}>复习筛选后的到期内容（{due.length}）</Button>
  {!items.length?<p className="coach-note">还没有收藏。可从课程、词汇、听力、口语反馈或考试复盘中加入。</p>:!filtered.length?<p className="coach-note">没有符合条件的收藏，请调整类型、时间或搜索词。</p>:filtered.slice(0,limit).map(item=><details className="coach-saved-review" key={item.id}>
   <summary><strong>{reviewLabels[item.kind]??'收藏'} · {item.kind==='knowledge'?item.payload.lessonTitle:item.payload.target}</strong><span>{item.due_at<=serverTime?'已到期':'下次复习：'+new Date(item.due_at).toLocaleString('zh-CN')} · 阶段 {item.stage}</span></summary>
   <p>来源：{item.payload.lessonTitle}</p>
   {item.kind==='knowledge'&&<p className="coach-note">这里保存的是考点与参考答案，可能包含你主动收藏的正确题；查看不计作重新答对。</p>}
   <blockquote lang={language}>{item.payload.target}</blockquote><p className="coach-review-explanation">{item.payload.zh}</p>
   <SavedReviewDetails item={item} language={language}/>
  </details>)}
  {filtered.length>limit&&<Button variant="outline" onClick={()=>setLimit(n=>n+20)}>再显示 20 条</Button>}
 </section>;
}

export function SavedReviewDetails({item,language}:{item:SavedReview;language:string}){
 const entry=item.payload.entrySnapshot;
 return <>{item.payload.knowledge&&<p className="coach-note">考点：{item.payload.knowledge} · 内容 v{item.payload.taskVersion}</p>}{item.payload.userAnswer&&<p className="coach-note">上次回答：<span lang={language}>{item.payload.userAnswer}</span></p>}{item.payload.pronunciation&&<PronunciationNotes guide={item.payload.pronunciation}/>} {entry&&<div className="coach-note-box"><p lang={language}>{entry.example}</p><p>{entry.exampleZh}</p>{entry.grammar.plural&&<p>复数：{entry.grammar.plural}</p>}{entry.grammar.forms&&<p>变位：{entry.grammar.forms}</p>}</div>}</>;
}

export function ReviewFace({item,revealed,language}:{item:SavedReview;revealed:boolean;language:string}){
 return <><h3>{reviewCue(item)}</h3>{revealed&&<><blockquote lang={language}>{item.payload.target}</blockquote>{item.kind==='knowledge'&&<p className="coach-review-explanation">{item.payload.zh}</p>}<SavedReviewDetails item={item} language={language}/></>}</>;
}
