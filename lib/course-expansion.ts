import type {Lesson} from './curriculum';
import type {LearningLanguage} from './languages';

type Phase='transfer'|'integrated'|'readiness';
const phaseFor=(index:number):Phase=>index<30?'transfer':index<45?'integrated':'readiness';
const phaseInfo:Record<Phase,{label:string;goal:string}>={
 transfer:{label:'场景迁移',goal:'在变化后的情境中独立调用已学表达'},
 integrated:{label:'综合任务',goal:'把听读信息整合进口语与写作输出'},
 readiness:{label:'升阶检查',goal:'完成接近下一等级要求的综合表现任务'},
};
const nextLevel:Record<string,string>={A1:'A2',A2:'A2+','A2+':'B1',B1:'B2',B2:'C1',C1:'C2',C2:'高阶精研',N4:'N3',N3:'N2',N2:'N1',N1:'高级真实语料'};

const additions:Record<LearningLanguage,Record<Phase,[string,string]>>={
 fr:{
  transfer:['Je vais reformuler la demande et vérifier un détail supplémentaire.','Si la situation change, je pourrai adapter ma réponse.'],
  integrated:['Je vais relier les informations entendues au texte avant de répondre.','Ma réponse donnera un exemple, une raison et une prochaine étape.'],
  readiness:['Je vais répondre sans modèle, puis justifier mon choix avec précision.','Je vérifierai enfin si mon ton et mes arguments conviennent à la situation.'],
 },
 en:{
  transfer:['I will rephrase the request and check one additional detail.','If the situation changes, I can adapt my response.'],
  integrated:['I will connect the listening and reading information before I respond.','My response will include an example, a reason, and a practical next step.'],
  readiness:['I will respond without a model and justify my choice precisely.','Finally, I will check whether my tone and reasoning suit the situation.'],
 },
 de:{
  transfer:['Ich formuliere die Bitte neu und prüfe ein zusätzliches Detail.','Wenn sich die Situation ändert, kann ich meine Antwort anpassen.'],
  integrated:['Vor meiner Antwort verbinde ich die Informationen aus Hörtext und Lesetext.','Meine Antwort enthält ein Beispiel, eine Begründung und einen konkreten nächsten Schritt.'],
  readiness:['Ich antworte ohne Vorlage und begründe meine Entscheidung genau.','Anschließend prüfe ich, ob Ton und Argumentation zur Situation passen.'],
 },
 ja:{
  transfer:['依頼を別の表現で言い換え、もう一つ必要な情報を確認します。','状況が変わった場合は、答え方も調整します。'],
  integrated:['聞いた情報と読んだ情報を結び付けてから答えます。','例、理由、次の行動を含めて説明します。'],
  readiness:['例文を見ずに答え、自分の判断を具体的に説明します。','最後に、表現の丁寧さと理由が場面に合っているか確認します。'],
 },
};

function expandLesson(lesson:Lesson,index:number):Lesson{
 const language=lesson.language??'fr',phase=phaseFor(index),info=phaseInfo[phase],extra=additions[language][phase],id=`${lesson.id}-stepup`,target=nextLevel[lesson.level]??'下一等级';
 const dialogue=lesson.dialogue.map((line,lineIndex)=>line.speaker===(lesson.learnerSpeaker??'Vous')
  ?{...line,fr:`${line.fr} ${lineIndex<3?extra[0]:extra[1]}`,zh:`${line.zh}${lineIndex<3?'我会换一种说法，并补充确认一个细节。':'如果情况改变，我也会调整回答。'}`}
  :line);
 return {...lesson,id,title:`${info.label}｜${lesson.title}`,fr:`${lesson.fr} ${extra[0]}`,goal:`${info.goal}，为 ${target} 做准备。`,minutes:lesson.minutes+4,dialogue,
  words:lesson.words.map((word,wordIndex)=>({...word,id:`${id}-word-${wordIndex+1}`})),
  grammar:{...lesson.grammar,title:`迁移复习 · ${lesson.grammar.title}`,explanation:`先独立判断，再回看规则：${lesson.grammar.explanation}`},
  readingTask:{prompt:`先综合本课对话，再说明哪两处信息共同支持最终回应。这项任务如何帮助你准备 ${target}？`,answer:`应同时引用场景事实和学习者的理由或条件；只复述单句还不足以完成${info.label}。`},
  writing:{...lesson.writing,prompt:`${info.label}：${lesson.writing.prompt} 不照抄参考答案，并加入一个新条件、一个理由和明确的下一步。`,checklist:[...(lesson.writing.checklist??[]),'是否在新条件下重新组织了表达？','是否同时给出理由和明确的下一步？']},
 };
}

export function expandCoursesToHundred(baseLessons:Lesson[]){
 const groups=new Map<string,Lesson[]>();
 for(const lesson of baseLessons){const key=`${lesson.language??'fr'}:${lesson.level}`;groups.set(key,[...(groups.get(key)??[]),lesson]);}
 const extensions=[...groups.values()].flatMap(group=>group.slice(0,50).map(expandLesson));
 return [...baseLessons,...extensions];
}
