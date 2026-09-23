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
export const {levelGuide,countFrenchWords}=readModule(path.join(root,'lib/levels.ts'));
const expected={A1:50,A2:50,'A2+':50,B1:50,B2:50,C1:50,C2:50};
assert.equal(lessons.length,1050);
assert.equal(new Set(lessons.map(l=>l.id)).size,1050,'Duplicate lesson IDs');
assert.equal(allWords.length,3150);
assert.equal(new Set(allWords.map(w=>w.id)).size,3150,'Duplicate vocabulary IDs');
for(const language of ['fr','en','de'])for(const [level,count] of Object.entries(expected))assert.equal(lessons.filter(l=>l.language===language&&l.level===level).length,count,language+' '+level);
for(const topic of topics){const topicCount=lessons.filter(l=>l.topic===topic.id).length;assert.ok(topicCount>=28,topic.id+': '+topicCount);}
for(let i=1;i<=56;i++)assert.ok(lessons.some(l=>l.id===`lesson-${String(i).padStart(2,'0')}`));
for(const language of ['fr','en','de'])for(const level of Object.keys(expected))assert.equal(new Set(lessons.filter(l=>l.language===language&&l.level===level).map(l=>l.title)).size,50,language+' '+level+' duplicate titles');
for(const level of Object.keys(expected))assert.ok(new Set(lessons.filter(l=>l.language==='en'&&l.level===level).map(l=>l.grammar.title)).size>=6,'English '+level+' needs a varied knowledge sequence');
const errors=[];
for(const l of lessons){
  assert.ok(topics.some(t=>t.id===l.topic),l.id);
  for(const q of [l.quiz,l.grammar]){
    assert.equal(q.options.length,3,l.id);assert.equal(new Set(q.options).size,3,l.id);
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,l.id);
    assert.ok(q.question&&q.why,l.id);
  }
  if(l.language==='fr'&&/^lesson-(?:0[1-9]|1\d|2[0-4])$/.test(l.id))continue;
  assert.equal(l.dialogue.length,6,l.id);
  const learner=l.learnerSpeaker??'Vous';
  l.dialogue.forEach((line,i)=>{assert.ok(line.fr&&line.zh,l.id);assert.equal(line.speaker===learner,i%2===1,l.id);});
  const guide=levelGuide(l.level),count=countFrenchWords(l.writing.example);
  if(count<guide.minWords||count>guide.maxWords)errors.push(`${l.id} (${l.level}): reference has ${count} words, expected ${guide.minWords}–${guide.maxWords}`);
  assert.ok(count>=guide.completionWords,l.id);
  assert.ok(l.writing.example.length<=6000,l.id);
  if(l.level!=='A1'){assert.ok(l.readingTask?.prompt&&l.readingTask?.answer,l.id);assert.ok(l.writing.checklist.length>=2,l.id);}
}
assert.deepEqual(errors,[],'Reference answers should model their suggested length');
console.log('PASS: 1050 unique lessons across French, English and German, 3150 vocabulary cards, bilingual dialogue pairs, answer indices and reference writing lengths.');
