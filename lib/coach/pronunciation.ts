// Independent supplementary teaching content. Never a pronunciation score or an exam answer key.
import type {PronunciationGuide} from './pronunciation-types';
const reference={
 nasal:{title:'UT Austin · 法语鼻化元音',url:'https://laits.utexas.edu/fi/html/pho/10.html'},
 liaison:{title:'UT Austin · 法语联诵',url:'https://laits.utexas.edu/fi/html/pho/12.html'},
 vowels:{title:'UT Austin · 法语语音符号',url:'https://www.laits.utexas.edu/fi/html/pho/02.html'},
 silent:{title:'UT Austin · 不发音的 e',url:'https://www.laits.utexas.edu/fi/html/pho/11.html'},
 accent:{title:'UT Austin · 重音符号与读音',url:'https://www.laits.utexas.edu/fi/html/pho/01.html'},
 rhythm:{title:'UT Austin · 法语节奏与语调',url:'https://www.laits.utexas.edu/fi/html/pho/03.html'},
 german:{title:'Goethe-Institut · 德语发音教学',url:'https://www.goethe.de/ins/it/de/spr/wdl/ded/aut.html'},
 length:{title:'Deutsche Welle · 长短元音教学资料',url:'https://www.dw.com/downloads/26361370/lektion5-lehrer-aussprache.pdf'},
 umlaut:{title:'Deutsche Welle · 字母与元音教学资料',url:'https://www.dw.com/downloads/26294183/lektion1-lerner-aussprache.pdf'},
};
type Seed=[string,string,string,PronunciationGuide['examples'],string,string,(keyof typeof reference)[]];
const seeds:Record<string,Seed>={
 'coach-fr-a1-1':['fr.liaison.subject-verb','把 vous habitez 连起来',
  '在这里，代词 vous 与 habitez 之间要读出连接的 [z]；habitez 的 h 不发音。先把这两个词作为一个小词组练习，不把规则推广到所有以 h 开头的词。',
  [{segmentId:'s3',target:'vous habitez',focus:'听两个词之间的 [z]，不要逐字母念 vous 的 s。'}],
  '重听第 3 句，先跟读 vous habitez，再说完整问题。','两个词之间是否连贯？本页只能供自己对照，不判断你读得是否正确。',['liaison']],
 'coach-fr-a1-2':['fr.vowels.u-ou','分清 du 与 vous 的元音',
  'du 的 u 是 [y]，vous 的 ou 是 [u]，它们不是同一个音。先听两个词，再在请求中保留区别；不靠汉字谐音代替目标语言的声音。',
  [{segmentId:'s2',target:'du lait',focus:'留意 du 的 [y]。'},{segmentId:'s1',target:'vous plaît',focus:'留意 vous 的 [u]。'}],
  '分别重听两句，各选一个短语跟读，再完整说出点单请求。','自己回放时，两个元音听起来是否有区别？不确定时保留问题请教师确认。',['vowels']],
 'coach-fr-a1-3':['fr.nasal.in-an','combien 与 prends 中的鼻化元音',
  'combien 结尾是 [ɛ̃]，prends 中的元音是 [ɑ̃]。鼻化元音让气流同时经过口和鼻；这两个音色不同，也不要在元音后另加一个清晰的 n。',
  [{segmentId:'s1',target:'combien',focus:'听结尾的 [ɛ̃]，不添加独立的 n。'},{segmentId:'s3',target:'prends',focus:'听 [ɑ̃]，再放在 Je prends… 中一起练习。'}],
  '先重听询价，再跟读购买决定，最后换一个物品再说。','是否把鼻化元音拆成了元音加 n？这里只是观察提示，没有自动检测。',['nasal']],
 'coach-fr-a1-4':['fr.enchainement.consonant','une amie：把已有的辅音接下去',
  'une 的 n 本来就发音；在 une amie 中，它与后面的元音自然衔接。这种衔接与 vous habitez 中让原本不读的 s 读作 [z] 的联诵不同。',
  [{segmentId:'s2',target:'une amie',focus:'保持一个 n 的声音，不在两个词之间插入额外停顿。'}],
  '重听第 2 句，跟读短语后再读整句。','能否保留 n 并连贯说出两个词？不要为了连读省掉词义。',['vowels','liaison']],
 'coach-fr-a2-1':['fr.nasal.on-in','mon train：相邻的两种鼻化元音',
  'mon 的 on 是 [ɔ̃]，train 的 ain 是 [ɛ̃]。两者都带鼻化，但音色不同；n 不单独读出。用这组词解释出行变化。',
  [{segmentId:'s1',target:'mon train',focus:'先听 mon，再听 train 的元音变化。'}],
  '用短停顿分别练两个词，再回到完整的延住说明。','是否把两个鼻化元音读成同一个音？听不清时先慢速重听再恢复正常速度。',['nasal']],
 'coach-fr-a2-2':['fr.liaison.nous-avons','用 nous avons 连贯叙述过去',
  '本句两处 nous avons 都有 [z] 联诵。先连起主语与助动词，再接 acheté 或 préparé；不用在每个单词后停顿。',
  [{segmentId:'s2',target:'Nous avons acheté',focus:'注意 nous 与 avons 之间的 [z]。'},{segmentId:'s2',target:'nous avons préparé',focus:'第二次出现仍保留同样的连接。'}],
  '先练第一件事情，再用 puis 接上第二件事情。','两处连接是否都清楚？复述时先保证事件顺序可理解。',['liaison']],
 'coach-fr-a2-3':['fr.rhythm.question','把约时间的问题说成意群',
  '法语句子通常按意义组成小组，组末承载较明显的重音。这里先说新的日期和时间，再用 ça te va ? 确认；不把每个字都读成一样重。',
  [{segmentId:'s3',target:'Mercredi à la même heure, ça te va ?',focus:'听时间信息与确认问题如何分组。'}],
  '重听并模仿两个小组，再替换成自己的日期，保持请求语气。','日期和问题是否容易分辨？允许自然语调变化，不机械复制音高。',['rhythm']],
 'coach-fr-a2-4':['fr.silent-e.phrase','chauffage：词尾 e 不另读一拍',
  'chauffage 的词尾 e 通常不形成独立音节，末尾仍有 [ʒ] 的声音。注意不发音的 e 不等于把它前面的辅音一起删掉；其他位置的 e 要结合语境学习。',
  [{segmentId:'s1',target:'chauffage',focus:'听词尾 [ʒ]，不额外加一个完整的 e。'}],
  '重听故障描述，先跟读 chauffage，再说暖气出了什么问题。','是否多加了一个词尾音节？口音和语速会影响弱读，疑问留给教师核对。',['silent']],
 'coach-de-a1-1':['de.consonants.ich','ich 中的 ch 与 sch 不同',
  'ich 的 ch 通常读作 [ç]。本课 Schwester 开头的 sch 是 [ʃ]；留意两种声音，不把 ich 直接读成带 sch 的形式。',
  [{segmentId:'s1',target:'ich',focus:'听 ich 结尾的轻摩擦音。'},{segmentId:'s2',target:'Schwester',focus:'对照 sch 的声音。'}],
  '先模仿短词，再分别说自我介绍和家人介绍。','自己回放时能否听出 ch 与 sch 的差别？系统不分析你的发音。',['german']],
 'coach-de-a1-2':['de.umlaut.oe','zwölf 中的 ö',
  'zwölf 中的 ö 是短元音 [œ]，不能当成 o 来读。先关注音色，再把数字与 Euro 一起说清楚。',
  [{segmentId:'s1',target:'Zwölf',focus:'听价格数字中的 ö，不用 o 替代。'}],
  '重听报价，先跟读数字，再连上货币名称。','能否保留 ö 的音色，同时让对方听清价格？不确定时重新对照。',['umlaut']],
 'coach-de-a1-3':['de.consonants.ach','nach 中的 ch',
  'nach 的 ch 通常读作 [x]，与 ich 中的 [ç] 不同。本次只练 nach links 这个指路词组，不把两种 ch 都替换成 k。',
  [{segmentId:'s2',target:'nach links',focus:'在 a 后听 ch 的摩擦音，再接方向词。'}],
  '重听指路句，跟读 nach links，再加上前面的直走指示。','有没有为了赶速度漏掉方向词？先表达清楚，再练连接。',['german']],
 'coach-de-a1-4':['de.vowels.long-short-i','sieben 与 beginnt：长短 i',
  'sieben 的 ie 是长元音 [iː]，beginnt 的重读 i 是短元音 [ɪ]。长度与音色都要听；双写辅音常提示前面是短元音，但拼写规律有例外。',
  [{segmentId:'s1',target:'sieben',focus:'听较长的 [iː]。'},{segmentId:'s2',target:'beginnt',focus:'听较短的 [ɪ]。'}],
  '分别跟读两个词，再连同时间说出起床和上课安排。','是否只拉长了声音而没有注意音色？先正常速度听，再慢速模仿。',['length']],
 'coach-de-a2-1':['de.umlaut.ue','Schlüssel 中的短 ü',
  'Schlüssel 中的 ü 通常是短元音 [ʏ]，与 u 不同。不要因为写字时漏了两点，就把口头表达也读成 u。',
  [{segmentId:'s4',target:'Schlüssel',focus:'先听 sch 后面的 ü，再听整个取钥匙请求。'}],
  '跟读关键词，再从 wo ich den Schlüssel… 开始复述请求。','录音中关键词能否清楚辨认？本页没有自动识别或发音打分。',['umlaut']],
 'coach-de-a2-2':['de.umlaut.oe-ue','Können 与 fünf 的变元音',
  'Können 的 ö 是 [œ]，fünf 的 ü 是 [ʏ]。保持这两个元音的区别，先问时间能否配合，再提出新时间。',
  [{segmentId:'s1',target:'Können',focus:'注意 ö 的音色。'},{segmentId:'s3',target:'fünf',focus:'注意 ü，避免读成 u。'}],
  '按“提出时间—说明冲突—换个时间”的顺序复述，重点听这两个词。','时间数字是否清楚？不要把整句都慢到失去交流节奏。',['umlaut']],
 'coach-de-a2-3':['de.vowels.long-short-u','Bus 与 früh 的元音',
  'Bus 的 u 是短 [ʊ]；früh 的 ü 是长 [yː]。这里既有长短区别，也有 u 与 ü 的音色区别，不能只靠延长同一个音来替换。',
  [{segmentId:'s1',target:'Bus',focus:'短促的 u。'},{segmentId:'s3',target:'früh',focus:'较长的 ü。'}],
  '重听去程与回程两句，分别跟读，再连成一段出行叙述。','是否区分了两种元音，又保留了句子的自然节奏？',['length','umlaut']],
 'coach-de-a2-4':['de.rhythm.reason-proposal','把理由和替代方案说清楚',
  '沟通时把改动时间与补偿方案分别说成清楚的意群。先听示例如何突出 zehn Uhr 和 Mittwoch，再根据自己的意思安排重点；不要求复制每一处音高。',
  [{segmentId:'s2',target:'zehn Uhr',focus:'强调最早能开始的时间。'},{segmentId:'s3',target:'Mittwoch',focus:'听替代安排的日期。'}],
  '先慢速听两句，再用正常速度说清“何时开始”和“何时补上”。','听者是否能分清原改动与替代安排？这是自查问题，不是系统判定。',['german']],
};
export const pronunciationGuides:PronunciationGuide[]=Object.entries(seeds).map(([lessonId,s])=>{
 const [knowledge,title,explanation,examples,practice,selfCheck,refs]=s;
 return {id:'pronunciation-'+lessonId,version:1,lessonId,lessonVersion:1,language:lessonId.includes('-fr-')?'fr-FR':'de-DE',level:lessonId.includes('-a1-')?'A1':'A2',knowledge,title,explanation,examples,practice,selfCheck,source:{method:'AI-assisted',review:'not-human-reviewed',checkedAt:'2026-10-03',references:refs.map(k=>reference[k])}};
});
export function pronunciationForLesson(lesson:{id:string;version:number;language:string;level:string}){
 return pronunciationGuides.find(g=>g.lessonId===lesson.id&&g.lessonVersion===lesson.version&&g.language===lesson.language&&g.level===lesson.level)??null;
}
export function withPronunciation<T extends {lessonId:string;lessonVersion:number;language:string;level:string;segments:{id:string;text:string}[]}>(material:T){
 const guide=pronunciationForLesson({id:material.lessonId,version:material.lessonVersion,language:material.language,level:material.level});
 // A new or older audio script must never receive mismatching playback references.
 if(guide&&!guide.examples.every(e=>material.segments.some(s=>s.id===e.segmentId&&s.text.includes(e.target))))throw new Error('Pronunciation guide does not match audio script: '+material.lessonId);
 return {...material,pronunciation:guide};
}
