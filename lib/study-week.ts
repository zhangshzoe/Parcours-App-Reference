export function studyDateKey(timestamp:number){
 const d=new Date(timestamp);return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
}
// null is the shared SSR/first-client state; local dates begin after hydration.
export function studyWeek(now:number|null,activeDays:Set<string>){
 return Array.from({length:7},(_,i)=>{
  const label='一二三四五六日'[i];
  if(now===null)return {label,active:false,today:false};
  const d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7)+i);
  return {label,active:activeDays.has(studyDateKey(d.getTime())),today:studyDateKey(d.getTime())===studyDateKey(now)};
 });
}
