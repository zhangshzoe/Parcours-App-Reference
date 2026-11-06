// Current supplementary teaching guidance, not a frozen test or scoring key.
import type {GrammarGuide} from './grammar-types';
const refs={
 negation:{title:'UT Austin · ne…pas 基础否定',url:'https://laits.utexas.edu/tex/gr/neg2.html'},
 future:{title:'UT Austin · 不规则简单将来时',url:'https://www.laits.utexas.edu/tex/gr/taf3.html'},
 verbs:{title:'deutsch.info · 动词与可分结构',url:'https://deutsch.info/grammar/verbs?hl=de'},
 syntax:{title:'deutsch.info · 主句与从句语序',url:'https://deutsch.info/grammar/syntax?hl=de'},
};
type Seed=Omit<GrammarGuide,'id'|'version'|'lessonVersion'|'source'>&{references:(keyof typeof refs)[]};
const seeds:Seed[]=[
 {lessonId:'coach-fr-a1-4',language:'fr-FR',level:'A1',knowledge:'fr.negation.present-ne-pas',title:'把日常活动改成否定句',anchor:'Je ne travaille pas le dimanche.',
  explanation:'先找到表示动作、随主语变化的动词，再用 ne…pas 把它围起来。本课练现在时；在元音或不发音的 h 前，ne 写成 n’。先保留完整的书面否定形式，不把中文“不”的位置直接搬过来。',
  patterns:[{target:'Je travaille le lundi. → Je ne travaille pas le lundi.',zh:'我星期一工作。→ 我星期一不工作。',focus:'ne 在 travaille 前，pas 在它后面；时间不需要放进否定词之间。'},{target:'J’étudie le soir. → Je n’étudie pas le soir.',zh:'我晚上学习。→ 我晚上不学习。',focus:'étudie 以元音开头，因此使用 n’。否定后主语写作 Je。'}],
  practice:'先写“我星期六工作”，再改成否定句；然后换一个日期，写自己的安排。可用虚构信息。',
  reference:{target:'Je travaille le samedi. Je ne travaille pas le samedi.',zh:'我星期六工作。我星期六不工作。'},
  checks:['ne／n’ 和 pas 是否位于同一个变位动词的两侧？','日期是否清楚？如果换了动作，是否也检查了动词形式？'],references:['negation']},
 {lessonId:'coach-fr-a2-4',language:'fr-FR',level:'A2',knowledge:'fr.future.etre-availability',title:'说明明天什么时候在家',anchor:'Je serai chez moi jusqu’à midi.',
  explanation:'serai 是 être 的简单将来时第一人称单数形式，表达“我将会在……”。本课只把它用于说明未来的到访安排，不要求一次记完整套将来时。与 je suis 的当前状态对照，注意这里没有额外的助动词。',
  patterns:[{target:'Je suis chez moi maintenant. → Je serai chez moi demain matin.',zh:'我现在在家。→ 我明天上午会在家。',focus:'现在用 suis；说明明天的安排时使用 serai。'},{target:'Je serai chez moi de neuf heures à midi.',zh:'我会从九点到中午在家。',focus:'de…à… 同时给出起止时间；原文的 jusqu’à midi 只明确到中午为止。'}],
  practice:'你希望对方明天下午来维修。写一句说明自己从十四点到十六点在家，再接上本课的礼貌请求。',
  reference:{target:'Je serai chez moi demain de quatorze heures à seize heures. Pourriez-vous envoyer quelqu’un ?',zh:'我明天十四点到十六点会在家。您能派个人来吗？'},
  checks:['是否把 je suis 和 je serai 的时间含义区分开？','消息是否同时包含问题、可到访时间和礼貌请求？参考表达只是一种写法。'],references:['future']},
 {lessonId:'coach-de-a1-4',language:'de-DE',level:'A1',knowledge:'de.separable.present-v2',title:'换时间时，保留动词和前缀的位置',anchor:'Ich stehe um sieben Uhr auf.',
  explanation:'本课的现在时陈述句中，可分动词的变位部分位于第二个句子成分，前缀放在句末。“第二位”不是第二个单词；一整个时间短语也可以占第一位。先练 aufstehen，再迁移到 einkaufen。',
  patterns:[{target:'Ich stehe um sieben Uhr auf. → Um sieben Uhr stehe ich auf.',zh:'我七点起床。→ 七点我起床。',focus:'时间短语移到句首后，stehe 仍在第二位，ich 放在它后面，auf 留在句末。'},{target:'Ich kaufe am Nachmittag ein. → Am Nachmittag kaufe ich ein.',zh:'我下午购物。→ 下午我购物。',focus:'einkaufen 在这里分成 kaufe…ein；不要遗漏 ein。'}],
  practice:'改成“我八点起床”，分别用 Ich 和 Um acht Uhr 开头写两句。然后换成购物活动再试一次。',
  reference:{target:'Ich stehe um acht Uhr auf. Um acht Uhr stehe ich auf.',zh:'我八点起床。八点我起床。'},
  checks:['变位动词是否仍在第二个句子成分的位置？','auf 或 ein 是否保留在句末？此处规则针对本课主句，不直接套到所有从句。'],references:['verbs','syntax']},
 {lessonId:'coach-de-a2-2',language:'de-DE',level:'A2',knowledge:'de.weil.modal-position',title:'用 weil 解释时间冲突',anchor:'weil ich bis sechs Uhr arbeiten muss',
  explanation:'本课使用标准书面语的 weil 原因从句。主句里 muss 在第二位、arbeiten 在句末；接在 weil 后，变位的 muss 移到从句末尾，arbeiten 放在它前面。不要只加 weil 却保留原主句语序。',
  patterns:[{target:'Ich muss bis sechs Uhr arbeiten. → …, weil ich bis sechs Uhr arbeiten muss.',zh:'我必须工作到六点。→ ……因为我必须工作到六点。',focus:'muss 是变位动词；weil 从句中把它放在最后。'},{target:'Ich kann am Donnerstag nicht kommen, weil ich arbeiten muss.',zh:'我星期四不能来，因为我必须工作。',focus:'主句保持 kann 的第二位；从句保持 muss 的末位，两部分用逗号分开。'}],
  practice:'你星期四要工作到十九点，不能见面。用 weil 解释，再建议星期五十八点见面。',
  reference:{target:'Ich kann am Donnerstag nicht kommen, weil ich bis neunzehn Uhr arbeiten muss. Wie wäre es am Freitag um achtzehn Uhr ?',zh:'我星期四不能来，因为我要工作到十九点。星期五十八点怎么样？'},
  checks:['原因从句中的 muss 是否在末尾，并保留了 arbeiten？','是否提供新的日期和时间？合理的其他表达也可以，不按参考文字逐字判错。'],references:['verbs','syntax']},
];
export const grammarGuides:GrammarGuide[]=seeds.map(({references,...seed})=>({...seed,id:'grammar-'+seed.lessonId,version:1,lessonVersion:1,source:{method:'AI-assisted',review:'not-human-reviewed',checkedAt:'2026-10-03',references:references.map(key=>refs[key])}}));
export function grammarForLesson(lesson:{id:string;version:number;language:string;level:string;text:string}){
 const guide=grammarGuides.find(g=>g.lessonId===lesson.id&&g.lessonVersion===lesson.version&&g.language===lesson.language&&g.level===lesson.level);
 if(!guide)return null;
 if(!lesson.text.includes(guide.anchor))throw Error('Grammar guide anchor does not match lesson '+lesson.id);
 return guide;
}
