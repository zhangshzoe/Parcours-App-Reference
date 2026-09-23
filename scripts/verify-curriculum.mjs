import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cache=new Map();
function readModule(filename){
  const resolved=path.resolve(filename);
  if(cache.has(resolved))return cache.get(resolved).exports;
  const module={exports:{}};cache.set(resolved,module);
  const result=ts.transpileModule(fs.readFileSync(resolved,'utf8'),{fileName:resolved,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.deepEqual(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),[],resolved);
  const output=result.outputText;
  new Function('require','module','exports',output)(specifier=>{
    assert.ok(specifier.startsWith('.'),'Only local curriculum imports are expected');
    return readModule(path.resolve(path.dirname(resolved),specifier+'.ts'));
  },module,module.exports);
  return module.exports;
}
export const {lessons,topics,allWords}=readModule(path.join(root,'lib/curriculum.ts'));
export const {levelGuide,countLearningUnits}=readModule(path.join(root,'lib/levels.ts'));
const expected={A1:100,A2:100,'A2+':100,B1:100,B2:100,C1:100,C2:100};
const japaneseExpected={N4:100,N3:100,N2:100,N1:100};
assert.equal(lessons.length,2500);
assert.equal(new Set(lessons.map(l=>l.id)).size,2500,'Duplicate lesson IDs');
assert.equal(allWords.length,7500);
assert.equal(new Set(allWords.map(w=>w.id)).size,7500,'Duplicate vocabulary IDs');
for(const language of ['fr','en','de'])for(const [level,count] of Object.entries(expected))assert.equal(lessons.filter(l=>l.language===language&&l.level===level).length,count,language+' '+level);
for(const [level,count] of Object.entries(japaneseExpected))assert.equal(lessons.filter(l=>l.language==='ja'&&l.level===level).length,count,'ja '+level);
for(const topic of topics){const topicCount=lessons.filter(l=>l.topic===topic.id).length;assert.ok(topicCount>=28,topic.id+': '+topicCount);}
for(let i=1;i<=56;i++)assert.ok(lessons.some(l=>l.id===`lesson-${String(i).padStart(2,'0')}`));
for(const language of ['fr','en','de'])for(const level of Object.keys(expected))assert.equal(new Set(lessons.filter(l=>l.language===language&&l.level===level).map(l=>l.title)).size,100,language+' '+level+' duplicate titles');
for(const level of Object.keys(japaneseExpected))assert.equal(new Set(lessons.filter(l=>l.language==='ja'&&l.level===level).map(l=>l.title)).size,100,'ja '+level+' duplicate titles');
for(const language of ['fr','en','de','ja'])for(const level of (language==='ja'?Object.keys(japaneseExpected):Object.keys(expected))){
  const route=lessons.filter(l=>l.language===language&&l.level===level);
  assert.equal(route.filter(l=>l.title.startsWith('场景迁移｜')).length,30,language+' '+level+' transfer phase');
  assert.equal(route.filter(l=>l.title.startsWith('综合任务｜')).length,15,language+' '+level+' integrated phase');
  assert.equal(route.filter(l=>l.title.startsWith('升阶检查｜')).length,5,language+' '+level+' readiness phase');
}
for(const level of Object.keys(expected))assert.ok(new Set(lessons.filter(l=>l.language==='en'&&l.level===level).map(l=>l.grammar.title)).size>=6,'English '+level+' needs a varied knowledge sequence');
for(const level of Object.keys(japaneseExpected))assert.ok(new Set(lessons.filter(l=>l.language==='ja'&&l.level===level).map(l=>l.grammar.title)).size>=6,'Japanese '+level+' needs a varied knowledge sequence');
const errors=[];
for(const l of lessons){
  assert.ok(topics.some(t=>t.id===l.topic),l.id);
  for(const q of [l.quiz,l.grammar]){
    assert.equal(q.options.length,3,l.id);assert.equal(new Set(q.options).size,3,l.id);
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,l.id);
    assert.ok(q.question&&q.why,l.id);
  }
  if(l.language==='fr'&&/^lesson-(?:0[1-9]|1\d|2[0-4])(?:-stepup)?$/.test(l.id))continue;
  assert.equal(l.dialogue.length,6,l.id);
  const learner=l.learnerSpeaker??'Vous';
  l.dialogue.forEach((line,i)=>{assert.ok(line.fr&&line.zh,l.id);assert.equal(line.speaker===learner,i%2===1,l.id);});
  const guide=levelGuide(l.level),count=countLearningUnits(l.writing.example,l.language);
  if(count<guide.minWords||count>guide.maxWords)errors.push(`${l.id} (${l.level}): reference has ${count} words, expected ${guide.minWords}–${guide.maxWords}`);
  assert.ok(count>=guide.completionWords,l.id);
  assert.ok(l.writing.example.length<=6000,l.id);
  if(l.level!=='A1'){assert.ok(l.readingTask?.prompt&&l.readingTask?.answer,l.id);assert.ok(l.writing.checklist.length>=2,l.id);}
}
assert.deepEqual(errors,[],'Reference answers should model their suggested length');
console.log('PASS: 2500 unique lessons across French, English, German and Japanese, 7500 vocabulary cards, 100-lesson progression phases, bilingual dialogue pairs, answer indices and reference writing lengths.');
