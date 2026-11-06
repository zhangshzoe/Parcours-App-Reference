export type ObjectiveEvent={skill:'reading'|'listening';id:string;at:number;correct:boolean;repeated:boolean};

// Exam listening items retain the identity of their original listening question.
// Version changes to the same item are not a new independent ability sample.
export const listeningEvidenceId=(materialId:string,questionId:string)=>`exam-listen-${materialId}-${questionId}`;

export function firstObjectiveSamples(events:ObjectiveEvent[],since:number,until:number){
 const seen=new Set<string>(),samples:ObjectiveEvent[]=[];
 // Keep older events in the scan: moving outside the recommendation window does
 // not make a later attempt at that question a first attempt again.
 for(const event of [...events].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))){
  if(!Number.isFinite(event.at)||event.at>until)continue;
  const key=event.skill+':'+event.id;
  if(!event.repeated&&!seen.has(key)&&event.at>=since)samples.push(event);
  seen.add(key);
 }
 return samples;
}
