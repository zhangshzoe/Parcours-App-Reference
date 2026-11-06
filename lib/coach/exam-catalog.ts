// Server-only catalog. Never import this file from a client component.
import type {CoachLanguage,CoachLevel} from './types';
import type {ExamItem,ExamPaper} from './exam-types';
import {listeningMaterials} from './listening-catalog';

type QuestionSeed=[string,[string,string,string],number,string,string];
type ReadingSeed=[string,QuestionSeed,QuestionSeed];
const readings:Record<string,ReadingSeed[]>={
 'fr-FR-A1':[
  ['La bibliothèque est ouverte du mardi au samedi, de 10 h à 18 h. Le dimanche et le lundi, elle est fermée.',
   ['图书馆星期一是否开放？',['开放到十八点','不开放','只在上午开放'],1,'Le dimanche et le lundi, elle est fermée：星期日和星期一关闭。','营业时间与否定'],
   ['星期六什么时候开门？',['十点','十八点','八点'],0,'du mardi au samedi, de 10 h à 18 h 包含星期六，十点是开始时间。','时间范围']],
  ['Bonjour Emma, notre cours de français commence à neuf heures dans la salle 12. Apporte un cahier et un stylo. À demain ! Paul',
   ['这条消息要求 Emma 带什么？',['一本小说','本子和笔','一张车票'],1,'Apporte un cahier et un stylo 是携带物品的要求。','学习用品'],
   ['上课地点在哪里？',['九号教室','十二号教室','图书馆'],1,'dans la salle 12 表示十二号教室；neuf heures 是时间。','地点与数字']],
  ['À vendre : vélo bleu, 60 euros. Le vélo est à Nantes. Téléphonez après 17 h. Demandez Julie.',
   ['这则广告出售什么？',['自行车','汽车','蓝色书包'],0,'vélo bleu 是蓝色自行车。À vendre 表示出售。','分类广告'],
   ['应该何时打电话？',['十七点之前','任何时间','十七点之后'],2,'après 17 h 表示十七点之后，不是之前。','时间介词']],
  ['Salut ! Je suis au supermarché avec Lucas. Nous achetons du pain et des pommes. Nous rentrons à la maison à midi. Léa',
   ['Léa 现在在哪里？',['家里','超市','学校'],1,'Je suis au supermarché 说明当前所在地点。','当前位置'],
   ['他们打算什么时候回家？',['早上','晚上','中午'],2,'à midi 表示中午；rentrons à la maison 表示回家。','日常安排']],
 ],
 'fr-FR-A2':[
  ['Bonjour Madame, le cours de cuisine de samedi est déplacé à dimanche à 14 h, car le professeur est malade. Si ce nouvel horaire ne vous convient pas, nous pouvons vous rembourser. Merci de nous répondre avant vendredi.',
   ['课程为什么改期？',['老师生病了','报名人数太少','教室装修'],0,'car le professeur est malade 明确给出原因，不能根据改期推断其他原因。','原因关系'],
   ['新时间不合适时可以怎么办？',['必须参加','申请退款','换到周五上午'],1,'nous pouvons vous rembourser 表示可以退款；星期五是回复期限。','通知与条件']],
  ['Chère Inès, hier, j’ai visité le musée avec mon frère. Nous voulions déjeuner au restaurant, mais il était complet. Nous avons donc acheté des sandwichs et mangé dans le parc. La prochaine fois, nous réserverons une table. Amicalement, Nora',
   ['他们最终在哪里午餐？',['博物馆','餐厅','公园'],2,'mangé dans le parc 是实际发生的行动；餐厅只是原计划。','计划与实际结果'],
   ['Nora 下次准备怎么做？',['提前订位','不再去博物馆','独自用餐'],0,'nous réserverons une table 是未来计划，原因是此次餐厅已满。','未来计划']],
  ['Bonjour, je cherche une personne pour arroser mes plantes pendant mon absence, du 12 au 18 juillet. Il suffit de venir deux fois dans la semaine. Je laisserai les clés chez ma voisine, au deuxième étage. Merci de me contacter ce soir. Malik',
   ['Malik 希望别人帮什么忙？',['每天喂宠物','给植物浇水','打扫整栋楼'],1,'arroser mes plantes 是任务；每周来两次，不是每天。','生活求助'],
   ['钥匙会放在哪里？',['门口','Malik 的办公室','二楼邻居家'],2,'chez ma voisine, au deuxième étage 给出领取钥匙的位置。','地点线索']],
  ['Suite aux travaux, le bus 8 ne s’arrêtera pas à la place du Marché du 3 au 6 mai. Pour aller à la gare, prenez le bus à l’arrêt Mairie, à cinq minutes à pied. Les horaires restent les mêmes.',
   ['施工期间去车站应该在哪里乘车？',['Mairie 站','place du Marché 站','车站内部'],0,'prenez le bus à l’arrêt Mairie 是替代乘车地点。','交通变更'],
   ['哪些信息保持不变？',['停靠站点','运行时刻','施工日期'],1,'Les horaires restent les mêmes 表示时刻不变，不能把站点变化误读为时间变化。','变化与不变']],
 ],
 'de-DE-A1':[
  ['Die Bäckerei Weber ist von Montag bis Freitag ab 7 Uhr geöffnet. Am Samstag öffnen wir um 8 Uhr. Am Sonntag haben wir geschlossen.',
   ['面包店星期六几点开门？',['七点','八点','九点'],1,'Am Samstag öffnen wir um 8 Uhr：星期六八点开门。','营业时间'],
   ['哪一天不营业？',['星期五','星期六','星期日'],2,'Am Sonntag haben wir geschlossen 表示星期日关闭。','星期与状态']],
  ['Hallo Ben, ich warte um 15 Uhr vor dem Kino auf dich. Der Film beginnt um 15:30 Uhr. Bitte kauf noch keine Karten. Ich habe zwei. Anna',
   ['两人约在哪里见面？',['电影院前面','火车站','咖啡馆里'],0,'vor dem Kino 表示电影院前面。','见面地点'],
   ['Ben 需要买电影票吗？',['买两张','不需要','只买自己的'],1,'Ich habe zwei 说明 Anna 已有两张票；Bitte kauf noch keine Karten 是明确要求。','请求与数量']],
  ['Zimmer frei! Ein kleines Zimmer in Bonn, 350 Euro im Monat. Küche und Bad benutzen wir zusammen. Das Zimmer ist ab Juni frei. Kontakt: Frau Klein.',
   ['每月房租是多少？',['三百五十欧元','三十五欧元','五百三十欧元'],0,'350 Euro im Monat 给出每月价格。','价格与周期'],
   ['哪些空间共同使用？',['卧室','阳台','厨房和浴室'],2,'Küche und Bad benutzen wir zusammen 说明共用厨房和浴室。','住房信息']],
  ['Liebe Eltern, morgen gehen wir mit der Klasse in den Zoo. Die Kinder brauchen Wasser und ein Brot. Wir sind um 14 Uhr wieder an der Schule. Ihre Frau Braun',
   ['孩子们明天去哪里？',['公园','动物园','游泳池'],1,'morgen … in den Zoo 是明天的目的地。','学校活动'],
   ['下午两点孩子们会在哪里？',['家里','车站','学校'],2,'um 14 Uhr wieder an der Schule 表示两点返回学校。','返回时间和地点']],
 ],
 'de-DE-A2':[
  ['Liebe Kursteilnehmende, unser Ausflug findet am Freitag statt. Wegen einer Baustelle treffen wir uns nicht am Haupteingang, sondern vor der Sporthalle. Bitte seid um 8:45 Uhr dort. Der Bus fährt um 9 Uhr ab.',
   ['集合地点为什么改变？',['公交取消了','有施工','体育馆关闭了'],1,'Wegen einer Baustelle 说明因施工改变集合地点。','原因与变更'],
   ['参加者应当几点到场？',['八点四十五分','九点','九点十五分'],0,'Bitte seid um 8:45 Uhr dort 是到场时间，九点是发车时间。','集合与出发']],
  ['Hallo Sara, ich habe gestern dein Buch bei mir gefunden. Morgen muss ich länger arbeiten, deshalb kann ich es dir erst am Donnerstag bringen. Wenn du es vorher brauchst, kann mein Bruder es heute Abend vorbeibringen. Sag mir bitte Bescheid. Tom',
   ['Tom 为什么明天不能送书？',['书丢了','要去旅行','要工作更久'],2,'muss ich länger arbeiten 后用 deshalb 引出不能及时送书的结果。','原因与结果'],
   ['如果 Sara 急需这本书，有什么办法？',['去书店另买一本','让 Tom 的兄弟今晚送来','只能等到星期四'],1,'Wenn du es vorher brauchst 引出替代方案：mein Bruder … heute Abend。','条件和替代方案']],
  ['Sehr geehrte Frau Wolf, meine Waschmaschine funktioniert seit Dienstag nicht mehr. Ich habe bereits den Filter gereinigt, aber das hat nicht geholfen. Könnten Sie am Freitag einen Techniker schicken? Ich bin ab 13 Uhr zu Hause. Mit freundlichen Grüßen, Mei Chen',
   ['写信人已经尝试了什么？',['换洗衣机','清洁过滤器','预约周二上门'],1,'Ich habe bereits den Filter gereinigt 是已完成的尝试，但没有解决问题。','已采取的行动'],
   ['她何时可以在家等维修人员？',['周五十三点以后','周二十三点以前','周五整个上午'],0,'am Freitag … ab 13 Uhr 表示星期五十三点开始可在家。','预约时间范围']],
  ['Im Bürgerzentrum beginnt nächste Woche ein Computerkurs für Anfänger. Der Kurs findet dienstags und donnerstags von 18 bis 19:30 Uhr statt. Die Teilnahme ist kostenlos, aber eine Anmeldung ist notwendig. Eigene Laptops müssen nicht mitgebracht werden.',
   ['参加课程前必须做什么？',['购买笔记本电脑','支付学费','报名'],2,'eine Anmeldung ist notwendig 表示必须报名；免费不等于无需报名。','条件与义务'],
   ['关于设备，通知说了什么？',['必须自带电脑','不必带自己的电脑','只允许使用手机'],1,'müssen nicht mitgebracht werden 表示没有必须自带的要求，并非禁止携带。','否定的情态表达']],
 ],
};
type WritingSeed=[string,[number,number]|null,string[],string,string?];
const writings:Record<string,WritingSeed[]>={
 'fr-FR-A1':[
  ['为虚构的法语读书会填写报名表。请逐栏用法语填写虚构信息，不要写真实姓名或联系方式；此项练习不设词数要求。',null,['姓与名是否分别填写？','城市和国籍是否各自清楚？','可参加的星期与喜欢的活动是否具体？','每栏信息是否易于理解，法语词形是否影响辨认？'],'表格填写与个人信息','Fiche d’inscription — Nom de famille : ____ ; Prénom : ____ ; Ville : ____ ; Nationalité : ____ ; Jour disponible : ____ ; Activité préférée : ____'],
  ['给朋友写邀请：说明星期六一起做什么、几点在哪里见面，并请对方回复。',[40,60],['是否写明活动？','日期、时间和地点是否完整？','是否请求回复？','邀请是否容易理解？'],'邀请与时间地点'],
 ],
 'fr-FR-A2':[
  ['你预订了两晚酒店，但火车晚点。给酒店写消息：说明预订，解释晚到情况，询问如何办理入住，并留下一个便于联系的方式（使用虚构信息）。',[60,90],['预订信息和晚到情况是否清楚？','是否有原因与具体请求？','是否提供了虚构联系方式？','称呼、结束语和连接词是否合适？'],'说明变化与礼貌请求'],
  ['向一位朋友讲述一次周末活动：说明和谁去了哪里，按顺序描述两件事，写出感受，并提出下次一起活动的建议。',[60,90],['人物地点是否明确？','事件顺序与过去表达是否一致？','感受是否有具体内容？','是否提出下次活动建议？'],'过去叙述与未来建议'],
 ],
 'de-DE-A1':[
  ['给德语班的新同学写短消息：介绍姓名、住处和一个爱好，并问对方何时有空。可以虚构信息。',[25,40],['是否包含姓名、住处和爱好？','是否询问了对方的时间？','动词位置是否清楚？','称呼与结束语是否适合短消息？'],'个人信息与询问时间'],
  ['你不能参加明天的学习小组。给同学写消息：表示歉意，说明一个简单原因，提出一个新的日期和时间。',[25,40],['是否表示歉意？','是否给出原因？','是否提出具体新日期和时间？','信息是否容易理解？'],'取消与重新约定'],
 ],
 'de-DE-A2':[
  ['给房东写消息：描述一个家居设备故障，说明从什么时候开始、你已尝试了什么，请求维修，并给出方便上门的时间。',[60,90],['故障与开始时间是否清楚？','是否说明已经采取的行动？','是否礼貌提出维修请求？','上门时间与句子衔接是否清楚？'],'描述故障与请求帮助'],
  ['给朋友写信介绍一次出行：说明交通方式和同行者，描述两项活动及一个计划变化，解释原因，并表达感受。',[60,90],['交通、同行者和活动是否具体？','过去事件是否有顺序？','是否解释计划变化？','原因表达和感受是否清楚？'],'过去经历与因果关系'],
 ],
};
// One new, independent reading passage per language and level.
const additionalReadings:Record<string,ReadingSeed>={
 "fr-FR-A1": [
  "Bonjour Sara, ton livre est chez moi. Je suis à la maison vendredi après 16 h. Tu peux venir chercher le livre. Mon adresse : 8, rue Victor-Hugo. À bientôt ! Alice",
  [
   "Sara 可以什么时候来拿书？",
   [
    "星期五十六点前",
    "星期六下午",
    "星期五十六点后"
   ],
   2,
   "vendredi après 16 h 给出星期五十六点后的时间；après 不是 avant。",
   "来访时间"
  ],
  [
   "书现在在哪里？",
   [
    "Alice 家里",
    "Sara 的学校",
    "图书馆"
   ],
   0,
   "消息由 Alice 发出，chez moi 表示在 Alice 家里；地址是取书地点。",
   "人称与所在地点"
  ]
 ],
 "fr-FR-A2": [
  "Bonjour, vous avez choisi de retirer votre commande dans notre magasin. Elle sera prête mercredi à partir de 15 h. Apportez votre numéro de commande ; vous pouvez le montrer sur votre téléphone. Si vous ne pouvez pas venir cette semaine, répondez à ce message. Nous garderons vos articles jusqu’au mardi suivant.",
  [
   "领取商品时需要出示什么？",
   [
    "打印出的银行账单",
    "订单编号",
    "朋友的电话号码"
   ],
   1,
   "Apportez votre numéro de commande 是领取要求；可在手机上出示，不要求打印。",
   "领取条件"
  ],
  [
   "这周不能到店时应该怎么办？",
   [
    "回复这条消息",
    "重新购买所有商品",
    "直接等到下个月"
   ],
   0,
   "Si … cette semaine 引出条件，répondez à ce message 是对应行动；保留期限是下周二。",
   "条件与应对行动"
  ]
 ],
 "de-DE-A1": [
  "Hallo Mila, dein roter Schal ist noch bei mir. Ich bin heute bis 18 Uhr zu Hause. Du kannst ihn abholen. Meine Wohnung ist im zweiten Stock. Bitte klingele bei Sommer. Viele Grüße, Eva",
  [
   "Mila 要去拿什么？",
   [
    "一顶红帽子",
    "一条红围巾",
    "一件蓝外套"
   ],
   1,
   "dein roter Schal 表示你的红围巾；Schal 不是帽子或外套。",
   "物品与颜色"
  ],
  [
   "到达后应按哪个名字的门铃？",
   [
    "Mila",
    "Eva",
    "Sommer"
   ],
   2,
   "Bitte klingele bei Sommer 是明确的门铃指示；不能只根据署名 Eva 选择门铃。",
   "简单行动指示"
  ]
 ],
 "de-DE-A2": [
  "Liebe Kursteilnehmende, wegen eines Wasserschadens können wir Raum 4 diese Woche nicht benutzen. Der Kurs findet deshalb im Raum 7 im ersten Stock statt. Die Anfangszeit bleibt bei 18 Uhr. Bitte bringen Sie das Arbeitsbuch mit. Am Freitag informieren wir Sie per E-Mail, ob der Kurs nächste Woche wieder in Raum 4 stattfinden kann.",
  [
   "本周需要改变什么？",
   [
    "上课时间",
    "上课教室",
    "使用的教材"
   ],
   1,
   "课程移到 Raum 7，时间仍是 18 Uhr；不能把地点变化误读为时间变化。",
   "通知中的变化"
  ],
  [
   "学生什么时候会得到下周教室的信息？",
   [
    "星期五通过电子邮件",
    "今天上课前通过电话",
    "下周一在门口"
   ],
   0,
   "Am Freitag informieren wir Sie per E-Mail 给出时间和方式；下周是否回 Raum 4 尚未确定。",
   "后续通知安排"
  ]
 ]
};
for(const [key,passage] of Object.entries(additionalReadings))readings[key].push(passage);
export function examRule(language:CoachLanguage,level:CoachLevel){
 return language==='fr-FR'?{id:`delf-tout-public-${level}-pending`,name:`DELF tout public · ${level}`,sourceUrl:`https://www.legifrance.gouv.fr/loda/id/JORFTEXT000042382849/`,status:'partially-verified' as const,note:'法国在效法规的四科时长、听力上限与通过条件已核实；FEI 考务细则仍待核对。以下时长与任务是本应用的原创专项练习设置。'}:
 {id:`goethe-adult-${level}-overview-2026-10-02`,name:level==='A1'?'Goethe-Zertifikat A1: Start Deutsch 1':'Goethe-Zertifikat A2 · 成人',sourceUrl:level==='A1'?'https://www.goethe.de/ins/de/de/prf/prf/gzsd1/inf.html':'https://www.goethe.de/ins/de/de/m/prf/prf/gzsd2/wi2.html',status:'partially-verified' as const,note:'已核对官方实施细则中的时长、口试形式和通过条件；详细评分及播放规则仍待核实。以下为应用自定专项，不能换算官方成绩。'};
}
export const examPapers:ExamPaper[]=[];
for(const language of ['fr-FR','de-DE'] as const)for(const level of ['A1','A2'] as const){
 const key=`${language}-${level}`,prefix=`exam-${language.slice(0,2)}-${level.toLowerCase()}`;
 const base={version:1,language,level,ruleId:examRule(language,level).id,ruleVersion:'app-specialist-v1',source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'} as const};
 const items:ExamItem[]=readings[key].flatMap(([passage,...questions],i)=>questions.map(([prompt,options,answer,explanation,knowledge],j)=>({id:`${prefix}-r${i*2+j+1}`,version:1,skill:'reading',prompt,passage,options,answer,explanation,knowledge})));
 examPapers.push({...base,version:2,id:`${prefix}-reading`,title:`${level} 阅读专项 · 日常信息`,kind:'reading',durationSeconds:level==='A1'?720:1080,items});
 const frenchA2=language==='fr-FR'&&level==='A2',writingVersion=language==='fr-FR'&&level==='A1'?3:frenchA2?2:1;
 const writingItems:ExamItem[]=writings[key].map(([prompt,suggestedWords,rubric,knowledge,passage],i)=>({id:`${prefix}-w${i+1}`,version:frenchA2?1:language==='fr-FR'&&level==='A1'&&i===1?2:writingVersion,skill:'writing',prompt,...(suggestedWords?{suggestedWords}:{}),...(passage?{passage}:{}),rubric,knowledge}));
 if(frenchA2)writingItems.reverse();
 examPapers.push({...base,version:writingVersion,id:`${prefix}-writing`,title:`${level} 写作专项 · 生活沟通`,kind:'writing',durationSeconds:level==='A1'?1200:1800,items:writingItems});
}

// Original familiar materials; source links are used for cross-mode exposure tracking.
for(const language of ['fr-FR','de-DE'] as const)for(const level of ['A1','A2'] as const){
 const materials=listeningMaterials.filter(m=>m.language===language&&m.level===level);
 examPapers.push({id:`exam-${language.slice(0,2)}-${level.toLowerCase()}-listening`,version:2,language,level,title:`${level} 听力专项 · 生活信息`,kind:'listening',durationSeconds:level==='A1'?600:900,ruleId:examRule(language,level).id,ruleVersion:'app-listening-v1',source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'},audioPolicy:{maxRequests:2,rate:1,pause:false,label:'应用自定训练规则：每段最多请求两次音频，正常速度，不提供暂停或变速；提交前不显示原文。生成成功即占用一次机会，断网不延长计时。'},items:materials.flatMap(m=>m.questions.map(q=>({id:`exam-listen-${m.id}-${q.id}`,version:m.version,skill:'listening' as const,prompt:q.prompt,options:q.options,answer:q.answer,explanation:q.explanation,knowledge:q.knowledge,audio:{key:m.id,text:m.segments.map(s=>s.text).join(' '),translation:m.segments.map(s=>s.zh).join(' '),sourceLessonId:m.lessonId,sourceMaterialId:m.id}})))});
}

// Original short oral response tasks, not an official interactive speaking exam.
const oralSeeds:Record<string,{prompt:string;targetPrompt:string;tasks:string[];rubric:string[];knowledge:string}[]>={
 'fr-FR-A1':[
  {prompt:'参加法语社团的首次见面。用虚构信息介绍自己，说明住处和一个爱好，再提出一个简单问题。',targetPrompt:'Bonjour ! Présentez-vous : comment vous appelez-vous, où habitez-vous et qu’est-ce que vous aimez faire ? Posez aussi une question à une nouvelle personne du groupe.',tasks:['介绍姓名与住处','说明一个爱好','向新同伴提一个问题'],rubric:['个人信息是否清楚？','是否用完整短句表达爱好？','是否提出可以回答的问题？','动词、冠词和疑问表达是否影响理解？'],knowledge:'自我介绍与建立交流'},
  {prompt:'在面包店买早餐。你想要两个可颂和一杯咖啡。请礼貌提出要求、询问总价，再说明带走。',targetPrompt:'Vous êtes dans une boulangerie. Vous voulez deux croissants et un café. Demandez poliment votre petit déjeuner, le prix total et précisez que c’est à emporter.',tasks:['说出食品与数量','询问总价','说明带走并礼貌致谢'],rubric:['食品和数量是否完整？','是否能询问价格？','带走的意思是否明确？','礼貌表达是否适合购买场景？'],knowledge:'数量、价格与礼貌请求'}
 ],
 'fr-FR-A2':[
  {prompt:'给朋友留语音：讲述一次周末活动，按顺序说两件事，解释为什么喜欢其中一件事，并提出下次一起活动的建议。',targetPrompt:'Laissez un message à votre ami. Racontez votre week-end : présentez deux activités dans l’ordre, expliquez pourquoi vous avez aimé une activité et proposez une sortie ensemble.',tasks:['按顺序叙述两件过去的事','用原因支持一个感受','提出下次活动建议'],rubric:['人物、地点和先后顺序是否清楚？','过去表达是否与情境一致？','感受是否有具体原因？','建议是否明确且容易回应？'],knowledge:'过去叙述、原因与建议'},
  {prompt:'你在酒店发现房间没有热水。向前台说明问题和已经做过的检查，礼貌请求解决，并询问需要等多久。',targetPrompt:'Dans votre chambre d’hôtel, il n’y a pas d’eau chaude. Expliquez le problème et ce que vous avez déjà essayé. Demandez une solution et combien de temps il faut attendre.',tasks:['描述问题与已做的检查','礼貌请求解决','询问等待时间'],rubric:['问题和检查是否具体？','已发生与当前状态是否分清？','请求是否清楚且礼貌？','是否提出相关追问？'],knowledge:'说明故障与协商帮助'}
 ],
 'de-DE-A1':[
  {prompt:'第一次参加德语学习小组。用虚构信息介绍姓名、住处和学习时间，再询问对方的一个爱好。',targetPrompt:'Sie sind neu in einer Lerngruppe. Sagen Sie Ihren Namen, Ihren Wohnort und wann Sie Deutsch lernen. Fragen Sie eine andere Person nach einem Hobby.',tasks:['介绍姓名与住处','说明何时学德语','询问对方爱好'],rubric:['个人信息是否明确？','时间表达是否易懂？','是否构成有效问句？','主句与疑问句的动词位置是否清楚？'],knowledge:'个人信息、时间与疑问句'},
  {prompt:'在文具店买东西。你需要一本笔记本和两支笔。请礼貌提出要求，询问价格，并询问能否刷卡。',targetPrompt:'Sie sind in einem Schreibwarengeschäft. Sie brauchen ein Heft und zwei Stifte. Fragen Sie nach dem Preis und ob Sie mit Karte bezahlen können.',tasks:['说出物品和数量','询问价格','询问刷卡并礼貌表达'],rubric:['物品和数量是否清楚？','是否问到价格？','付款问题是否易懂？','名词、冠词和动词是否影响沟通？'],knowledge:'购买物品与简单询问'}
 ],
 'de-DE-A2':[
  {prompt:'给同学留语音介绍上周的一次出行：说明交通方式，讲述两项活动，解释一次计划变化，并表达感受。',targetPrompt:'Erzählen Sie einer Person aus Ihrem Kurs von einem Ausflug letzte Woche. Nennen Sie das Verkehrsmittel und zwei Aktivitäten. Erklären Sie eine Planänderung und sagen Sie, wie Sie den Ausflug fanden.',tasks:['说明交通与两项活动','解释计划改变的原因','表达具体感受'],rubric:['过去经历是否有清楚顺序？','完成时或适当过去表达是否可理解？','原因是否与变化相关？','连接词和语序是否支持表达？'],knowledge:'过去经历与因果关系'},
  {prompt:'你约好了周五搬家，但搬家公司要改时间。留一段语音：说明原约定、解释一个时间限制，提出替代时间，并请求确认。',targetPrompt:'Die Umzugsfirma möchte Ihren Termin am Freitag ändern. Erklären Sie den ursprünglichen Termin und wann Sie keine Zeit haben. Schlagen Sie einen anderen Termin vor und bitten Sie um Bestätigung.',tasks:['说明原约定与时间限制','提出可行替代时间','礼貌请求确认'],rubric:['原约定和限制是否清楚？','替代时间是否具体？','请求与理由是否连贯？','情态动词与礼貌表达是否合适？'],knowledge:'协调时间与提出替代方案'}
 ]
};
for(const language of ['fr-FR','de-DE'] as const)for(const level of ['A1','A2'] as const){
 const prefix=`exam-${language.slice(0,2)}-${level.toLowerCase()}`;
 examPapers.push({id:`${prefix}-speaking`,version:1,language,level,title:`${level} 口语专项 · 任务回应`,kind:'speaking',durationSeconds:level==='A1'?600:900,ruleId:examRule(language,level).id,ruleVersion:'app-oral-v1',source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'},items:oralSeeds[`${language}-${level}`].map((s,i)=>({id:`${prefix}-o${i+1}`,version:1,skill:'speaking',prompt:s.prompt,knowledge:s.knowledge,rubric:s.rubric,oral:{targetPrompt:s.targetPrompt,tasks:s.tasks,maxSeconds:60,...(language==='fr-FR'?{practiceScenarioId:`scene-fr-${level.toLowerCase()}-oral-${i+1}`}:{})}}))});
}

// Reuse original IDs and versions so practice and combined papers share exposure history.
for(const language of ['fr-FR','de-DE'] as const)for(const level of ['A1','A2'] as const){
 const sources=examPapers.filter(p=>p.language===language&&p.level===level);
 const listening=sources.find(p=>p.kind==='listening')!,reading=sources.find(p=>p.kind==='reading')!,writing=sources.find(p=>p.kind==='writing')!,speaking=sources.find(p=>p.kind==='speaking')!;
 const combinedVersion=language==='fr-FR'&&level==='A1'?3:language==='fr-FR'&&level==='A2'?2:1;
 examPapers.push({id:'exam-'+language.slice(0,2)+'-'+level.toLowerCase()+'-integrated',version:combinedVersion,language,level,title:level+' 四技能缩短训练卷',kind:'integrated',durationSeconds:level==='A1'?1800:2400,ruleId:examRule(language,level).id,ruleVersion:`app-shortened-v${combinedVersion}`,source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'},audioPolicy:{...listening.audioPolicy!},items:[...listening.items.slice(0,4),...reading.items.slice(0,4),writing.items[0],speaking.items[0]]});
}
