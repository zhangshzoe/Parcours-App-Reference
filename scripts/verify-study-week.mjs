import assert from 'node:assert/strict';
import {studyDateKey,studyWeek} from '../lib/study-week.ts';
const originalTZ=process.env.TZ;
try{
 const instant=Date.UTC(2026,10,6,17);
 process.env.TZ='UTC';
 const server=studyWeek(null,new Set());
 assert.equal(studyWeek(instant,new Set()).find(d=>d.today).label,'五');
 process.env.TZ='Asia/Shanghai';
 assert.deepEqual(studyWeek(null,new Set()),server,'Initial client calendar matches SSR across a date boundary');
 const local=studyWeek(instant,new Set([studyDateKey(instant)]));
 assert.equal(local.find(d=>d.today).label,'六');
 assert.equal(local.filter(d=>d.active).length,1);
 assert.equal(local.find(d=>d.active).label,'六');
 assert.equal(server.some(d=>d.today||d.active),false);
 console.log('PASS study week: deterministic hydration placeholder across UTC/Shanghai midnight; local weekday and real activity preserved after mount.');
}finally{if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ}
