import type {Lesson} from './curriculum';
import type {LearningLanguage} from './languages';

type Scenario={topic:string;title:string;en:string;de:string;zh:string};
const scenarios:Scenario[]=[
 {topic:'daily',title:'介绍自己',en:'My name is Lin, and I live in Shanghai.',de:'Ich heiße Lin und wohne in Shanghai.',zh:'我叫林，住在上海。'},
 {topic:'daily',title:'询问姓名',en:'Could you tell me your name, please?',de:'Wie heißen Sie bitte?',zh:'请问您叫什么名字？'},
 {topic:'daily',title:'交换联系方式',en:'Could I have your phone number?',de:'Kann ich Ihre Telefonnummer haben?',zh:'我可以留一下您的电话号码吗？'},
 {topic:'daily',title:'询问营业时间',en:'What time do you open tomorrow?',de:'Wann öffnen Sie morgen?',zh:'你们明天几点开门？'},
 {topic:'daily',title:'在邮局寄包裹',en:'I would like to send this package.',de:'Ich möchte dieses Paket verschicken.',zh:'我想寄这个包裹。'},
 {topic:'daily',title:'在药店说明需要',en:'I need something for a headache.',de:'Ich brauche etwas gegen Kopfschmerzen.',zh:'我需要治头痛的药。'},
 {topic:'daily',title:'修改预约时间',en:'I would like to change my appointment.',de:'Ich möchte meinen Termin ändern.',zh:'我想修改预约时间。'},
 {topic:'food',title:'在咖啡馆点单',en:'I would like a coffee and a croissant.',de:'Ich möchte einen Kaffee und ein Croissant.',zh:'我想要一杯咖啡和一个羊角面包。'},
 {topic:'food',title:'询问推荐菜',en:'What dish do you recommend?',de:'Welches Gericht empfehlen Sie?',zh:'您推荐哪道菜？'},
 {topic:'food',title:'说明食物过敏',en:'I am allergic to peanuts.',de:'Ich bin allergisch gegen Erdnüsse.',zh:'我对花生过敏。'},
 {topic:'food',title:'购买水果',en:'I would like one kilo of apples.',de:'Ich möchte ein Kilo Äpfel.',zh:'我想买一公斤苹果。'},
 {topic:'food',title:'询问价格',en:'How much does this cost?',de:'Wie viel kostet das?',zh:'这个多少钱？'},
 {topic:'food',title:'申请退换商品',en:'I would like to return this item.',de:'Ich möchte diesen Artikel zurückgeben.',zh:'我想退掉这件商品。'},
 {topic:'food',title:'预订餐桌',en:'I would like to book a table for two.',de:'Ich möchte einen Tisch für zwei reservieren.',zh:'我想预订一张两人桌。'},
 {topic:'travel',title:'询问车站位置',en:'Where is the train station?',de:'Wo ist der Bahnhof?',zh:'火车站在哪里？'},
 {topic:'travel',title:'购买车票',en:'I need a ticket to the city center.',de:'Ich brauche eine Fahrkarte ins Stadtzentrum.',zh:'我需要一张去市中心的票。'},
 {topic:'travel',title:'确认发车时间',en:'What time does the train leave?',de:'Wann fährt der Zug ab?',zh:'火车几点出发？'},
 {topic:'travel',title:'处理火车晚点',en:'My train is delayed. What can I do?',de:'Mein Zug hat Verspätung. Was kann ich tun?',zh:'我的火车晚点了，我该怎么办？'},
 {topic:'travel',title:'酒店办理入住',en:'I have a reservation under the name Lin.',de:'Ich habe eine Reservierung auf den Namen Lin.',zh:'我用林这个名字预订了房间。'},
 {topic:'travel',title:'询问旅游路线',en:'How can I get to the museum?',de:'Wie komme ich zum Museum?',zh:'我怎么去博物馆？'},
 {topic:'travel',title:'租一辆自行车',en:'I would like to rent a bicycle.',de:'Ich möchte ein Fahrrad mieten.',zh:'我想租一辆自行车。'},
 {topic:'home',title:'介绍自己的房间',en:'My room is small but very bright.',de:'Mein Zimmer ist klein, aber sehr hell.',zh:'我的房间很小，但非常明亮。'},
 {topic:'home',title:'寻找出租房',en:'I am looking for a quiet apartment.',de:'Ich suche eine ruhige Wohnung.',zh:'我在找一套安静的公寓。'},
 {topic:'home',title:'报告维修问题',en:'The heating is not working.',de:'Die Heizung funktioniert nicht.',zh:'暖气坏了。'},
 {topic:'home',title:'询问垃圾分类',en:'Where should I put the glass bottles?',de:'Wohin kommen die Glasflaschen?',zh:'玻璃瓶应该放在哪里？'},
 {topic:'home',title:'和邻居打招呼',en:'Hello, I am your new neighbor.',de:'Hallo, ich bin Ihr neuer Nachbar.',zh:'您好，我是您的新邻居。'},
 {topic:'home',title:'购买生活用品',en:'I need a lamp for my desk.',de:'Ich brauche eine Lampe für meinen Schreibtisch.',zh:'我的书桌需要一盏灯。'},
 {topic:'work',title:'介绍自己的工作',en:'I work in a small design team.',de:'Ich arbeite in einem kleinen Designteam.',zh:'我在一个小型设计团队工作。'},
 {topic:'work',title:'询问课程信息',en:'I would like some information about the course.',de:'Ich hätte gern Informationen über den Kurs.',zh:'我想了解这门课程的信息。'},
 {topic:'work',title:'安排会议时间',en:'Can we meet on Tuesday morning?',de:'Können wir uns am Dienstagmorgen treffen?',zh:'我们可以周二上午见面吗？'},
 {topic:'work',title:'请求重复说明',en:'Could you explain that again, please?',de:'Könnten Sie das bitte noch einmal erklären?',zh:'您可以再解释一遍吗？'},
 {topic:'work',title:'发送工作邮件',en:'I am sending you the updated document.',de:'Ich schicke Ihnen das aktualisierte Dokument.',zh:'我把更新后的文件发给您。'},
 {topic:'work',title:'申请一天假期',en:'I would like to take Friday off.',de:'Ich möchte am Freitag frei nehmen.',zh:'我想周五请一天假。'},
 {topic:'stories',title:'讲述日常作息',en:'I usually start work at nine.',de:'Ich fange normalerweise um neun Uhr an zu arbeiten.',zh:'我通常九点开始工作。'},
 {topic:'stories',title:'描述昨天做的事',en:'Yesterday I visited a friend.',de:'Gestern habe ich einen Freund besucht.',zh:'昨天我去看望了一位朋友。'},
 {topic:'stories',title:'介绍周末计划',en:'This weekend I am going to the park.',de:'Dieses Wochenende gehe ich in den Park.',zh:'这个周末我要去公园。'},
 {topic:'stories',title:'讲述一次旅行',en:'Last summer I traveled to Berlin.',de:'Letzten Sommer bin ich nach Berlin gereist.',zh:'去年夏天我去了柏林。'},
 {topic:'stories',title:'说明学习经历',en:'I started learning this language last year.',de:'Ich habe letztes Jahr angefangen, diese Sprache zu lernen.',zh:'我去年开始学习这门语言。'},
 {topic:'stories',title:'描述喜欢的电影',en:'My favorite film is a comedy.',de:'Mein Lieblingsfilm ist eine Komödie.',zh:'我最喜欢的电影是一部喜剧。'},
 {topic:'social',title:'邀请朋友见面',en:'Would you like to meet on Saturday?',de:'Möchtest du dich am Samstag treffen?',zh:'你周六想见面吗？'},
 {topic:'social',title:'接受邀请',en:'Yes, I would love to come.',de:'Ja, ich komme sehr gern.',zh:'好的，我很愿意来。'},
 {topic:'social',title:'礼貌拒绝邀请',en:'Thank you, but I am not free that evening.',de:'Danke, aber an diesem Abend habe ich keine Zeit.',zh:'谢谢，但那天晚上我没空。'},
 {topic:'social',title:'商量见面地点',en:'Shall we meet in front of the library?',de:'Treffen wir uns vor der Bibliothek?',zh:'我们在图书馆门口见好吗？'},
 {topic:'social',title:'祝贺朋友',en:'Congratulations on your new job!',de:'Herzlichen Glückwunsch zu deiner neuen Arbeit!',zh:'祝贺你找到新工作！'},
 {topic:'social',title:'提出周末建议',en:'We could go for a walk by the river.',de:'Wir könnten am Fluss spazieren gehen.',zh:'我们可以去河边散步。'},
 {topic:'opinions',title:'表达喜欢',en:'I really like this idea.',de:'Diese Idee gefällt mir sehr.',zh:'我很喜欢这个想法。'},
 {topic:'opinions',title:'表达不同意见',en:'I understand, but I have a different opinion.',de:'Ich verstehe, aber ich bin anderer Meinung.',zh:'我理解，但我有不同意见。'},
 {topic:'opinions',title:'比较两个选择',en:'The first option is cheaper and simpler.',de:'Die erste Möglichkeit ist günstiger und einfacher.',zh:'第一个选择更便宜，也更简单。'},
 {topic:'opinions',title:'说明原因',en:'I prefer this plan because it saves time.',de:'Ich bevorzuge diesen Plan, weil er Zeit spart.',zh:'我更喜欢这个计划，因为它节省时间。'},
 {topic:'opinions',title:'提出解决办法',en:'We could try a simpler solution first.',de:'Wir könnten zuerst eine einfachere Lösung versuchen.',zh:'我们可以先尝试一个更简单的办法。'},
];

type CourseLevel='A1'|'A2'|'A2+'|'B1'|'B2'|'C1'|'C2';
const courseLevels:CourseLevel[]=['A1','A2','A2+','B1','B2','C1','C2'];
const levelSlug=(level:CourseLevel)=>level==='A2+'?'a2plus':level.toLowerCase();
const partner=(language:LearningLanguage,topic:string)=>language==='en'?(topic==='work'?'Colleague':'Conversation partner'):(topic==='work'?'Kollegin':'Gesprächspartnerin');
const learner=(language:LearningLanguage)=>language==='en'?'You':'Du';

const levelDesign:Record<CourseLevel,{title:string;goal:string;minutes:number;writing:string;checklist:string[]}>= {
 A1:{title:'基础沟通',goal:'说清基本信息和即时需要',minutes:12,writing:'说明基本信息，并加入一句礼貌请求。',checklist:[]},
 A2:{title:'日常任务',goal:'在熟悉场景中交换信息并补充细节',minutes:14,writing:'描述已经发生的事情，补充时间、地点和下一步。',checklist:['是否写清人物、时间或地点？','是否使用了一个完整的请求或回应？']},
 'A2+':{title:'衔接表达',goal:'用连接词组织顺序、原因和结果',minutes:15,writing:'按顺序说明情况，并用连接词写出原因和结果。',checklist:['是否用连接词组织了先后顺序？','是否补充了原因或结果？']},
 B1:{title:'经历与观点',goal:'讲述经历、解释理由并提出实际方案',minutes:17,writing:'说明经历与看法，给出理由和一个可执行建议。',checklist:['是否区分事实和个人看法？','是否用例子或经历支持理由？','是否提出了明确建议？']},
 B2:{title:'论证与协商',goal:'比较方案、回应异议并达成协商',minutes:20,writing:'比较两种方案，回应一种反对意见，并给出有条件的结论。',checklist:['是否比较了利弊？','是否回应了可能的异议？','结论是否与论据一致？']},
 C1:{title:'整合与分析',goal:'整合信息、识别前提并形成严密论证',minutes:24,writing:'分析问题背后的前提与长期影响，综合不同立场后提出结论。',checklist:['是否指出了隐含前提？','是否综合了至少两种立场？','是否使用准确的衔接和限定表达？']},
 C2:{title:'精确与重构',goal:'辨析语气与隐含意义，并为不同听众重构表达',minutes:28,writing:'辨析细微立场与语气，为审慎的听众重构论证并限定结论。',checklist:['是否辨析了语气和隐含立场？','是否根据听众调整了措辞？','是否准确限定了结论的适用范围？']},
};

const englishTargets:Record<CourseLevel,(base:string)=>string>={
 A1:base=>base,
 A2:base=>`${base} I have checked the basic information, but I still need a few details.`,
 'A2+':base=>`${base} First, I would like to confirm the details, and then decide what to do next.`,
 B1:base=>`${base} I would like to explain the situation, compare the options, and agree on a practical next step.`,
 B2:base=>`${base} To communicate effectively, I would also like to clarify the context, compare the relevant options, and explain the reasons for my preferred approach.`,
 C1:base=>`${base} A complete response should also distinguish established facts from assumptions, consider longer-term consequences, and make the reasoning explicit.`,
 C2:base=>`${base} That initial formulation is useful, yet a more precise response would also acknowledge competing interpretations, adapt the tone to the audience, and qualify the conclusion.`,
};
const germanTargets:Record<CourseLevel,(base:string)=>string>={
 A1:base=>base,
 A2:base=>`${base} Ich habe die wichtigsten Informationen schon geprüft, brauche aber noch einige Details.`,
 'A2+':base=>`${base} Zuerst möchte ich die Einzelheiten klären und danach über den nächsten Schritt entscheiden.`,
 B1:base=>`${base} Ich möchte die Situation erklären, die Möglichkeiten vergleichen und einen praktischen nächsten Schritt vereinbaren.`,
 B2:base=>`${base} Für eine wirksame Verständigung möchte ich außerdem den Kontext klären, die relevanten Möglichkeiten vergleichen und meine bevorzugte Lösung begründen.`,
 C1:base=>`${base} Eine vollständige Antwort sollte außerdem gesicherte Fakten von Annahmen trennen, langfristige Folgen berücksichtigen und die Begründung offenlegen.`,
 C2:base=>`${base} Diese erste Formulierung ist nützlich; eine präzisere Antwort sollte jedoch konkurrierende Deutungen berücksichtigen, den Ton an das Publikum anpassen und die Schlussfolgerung angemessen einschränken.`,
};

const learnerReplies:Record<LearningLanguage,Record<CourseLevel,string>>={
 fr:{A1:'',A2:'','A2+':'',B1:'',B2:'',C1:'',C2:''},
 en:{
  A1:'Yes, please. Could you explain the next step?',
  A2:'I have checked the basic information, but I still need a few details.',
  'A2+':'First, let us confirm the facts; then we can choose the next step.',
  B1:'I think this option is practical because it saves time, although I am open to alternatives.',
  B2:'If we compared the benefits and drawbacks more carefully, we could find a solution that works for both sides.',
  C1:'What matters most is that we distinguish the immediate problem from its longer-term consequences.',
  C2:'Granted, the obvious solution is attractive; nevertheless, its underlying assumptions warrant closer scrutiny.',
 },
 de:{
  A1:'Ja, bitte. Können Sie den nächsten Schritt erklären?',
  A2:'Ich habe die wichtigsten Informationen schon geprüft, brauche aber noch einige Details.',
  'A2+':'Zuerst klären wir die Fakten; danach können wir den nächsten Schritt wählen.',
  B1:'Ich halte diese Möglichkeit für praktisch, weil sie Zeit spart, obwohl ich für Alternativen offen bin.',
  B2:'Wenn wir die Vor- und Nachteile genauer vergleichen würden, könnten wir eine Lösung finden, die für beide Seiten passt.',
  C1:'Entscheidend ist, dass wir das unmittelbare Problem von seinen langfristigen Folgen unterscheiden.',
  C2:'Zugegeben, die naheliegende Lösung wirkt überzeugend; dennoch sollten ihre Voraussetzungen genauer geprüft werden.',
 },
};
const learnerReplyZh:Record<CourseLevel,string>={
 A1:'需要，请说明一下下一步。',A2:'我已经核对了基本信息，但还需要确认几个细节。','A2+':'我们先确认事实，然后再选择下一步。',B1:'我认为这个方案很实际，因为它节省时间，不过我也愿意考虑其他办法。',B2:'如果更仔细地比较利弊，我们就能找到兼顾双方的方案。',C1:'最重要的是区分眼前的问题和它的长期影响。',C2:'诚然，最直接的方案很有吸引力；不过，它背后的假设仍值得仔细审视。',
};

const partnerQuestions:Record<LearningLanguage,Record<CourseLevel,string>>={
 fr:{A1:'',A2:'','A2+':'',B1:'',B2:'',C1:'',C2:''},
 en:{A1:'Of course. Do you need anything else?',A2:'What have you already done?', 'A2+':'How would you like to organize the next steps?',B1:'Why do you think this option would work?',B2:'What would you say to someone who disagrees?',C1:'Which assumptions should we examine before deciding?',C2:'How would you reformulate your position for a skeptical audience?'},
 de:{A1:'Natürlich. Brauchen Sie noch etwas?',A2:'Was haben Sie bereits erledigt?', 'A2+':'Wie möchten Sie die nächsten Schritte ordnen?',B1:'Warum halten Sie diese Möglichkeit für sinnvoll?',B2:'Wie würden Sie auf einen Einwand reagieren?',C1:'Welche Annahmen sollten wir vor der Entscheidung prüfen?',C2:'Wie würden Sie Ihre Position für ein skeptisches Publikum neu formulieren?'},
};
const partnerQuestionZh:Record<CourseLevel,string>={
 A1:'当然。您还需要别的帮助吗？',A2:'您已经完成了哪些准备？','A2+':'您希望怎样安排接下来的步骤？',B1:'您为什么认为这个方案可行？',B2:'如果有人不同意，您会怎样回应？',C1:'在决定之前，我们应该审视哪些假设？',C2:'面对持怀疑态度的听众，您会怎样重新表述自己的立场？',
};
const targetTranslation=(level:CourseLevel,base:string)=>level==='A1'?base:level==='A2'?`${base}我已经核对了基本信息，但还需要确认几个细节。`:level==='A2+'?`${base}我想先确认细节，然后再决定下一步。`:level==='B1'?`${base}我希望说明情况、比较选择，并商定一个切实可行的下一步。`:level==='B2'?`${base}为了更有效地沟通，我还会说明背景、比较相关选择，并解释自己倾向某种方案的理由。`:level==='C1'?`${base}完整的回应还应区分已知事实与假设，考虑长期影响，并把论证过程明确说出来。`:`${base}这句初步表达虽然有用，但更准确的回应还应考虑不同解读、根据听众调整语气，并适当限定结论。`;

const englishGrammar=(title:string,explanation:string,example:string,translation:string,wrong1:string,wrong2:string):Lesson['grammar']=>({
 title,explanation,example,translation,question:`选择最符合“${title}”的表达。`,options:[example,wrong1,wrong2],answer:0,why:`“${example}”结构完整，准确体现了本课的知识点。`,
});
const englishKnowledgeGuide:Record<CourseLevel,Lesson['grammar'][]>= {
 A1:[
  englishGrammar('be 动词与人称代词','用 am、is、are 介绍人物、身份和状态。','I am new here.','我是新来的。','I is new here.','I be new here.'),
  englishGrammar('a、an、the 与名词','第一次提到单数可数名词时常用 a 或 an，明确所指时用 the。','I need a ticket.','我需要一张票。','I need ticket a.','I need an ticket.'),
  englishGrammar('一般现在时','一般现在时表达习惯、事实和固定安排；第三人称单数需注意词尾。','She works near the station.','她在车站附近工作。','She work near the station.','She working near station.'),
  englishGrammar('基础疑问句与否定句','用 do、does 或 be 动词构成常用疑问句和否定句。','Do you live nearby?','你住在附近吗？','You do live nearby?','Does you live nearby?'),
  englishGrammar('there is / there are','用 there is 和 there are 表示某处存在某人或某物。','There are two cafés on this street.','这条街上有两家咖啡馆。','There is two cafés on this street.','There two cafés are on this street.'),
  englishGrammar('时间、数字与祈使句','用准确的时间、数字和简短祈使句完成基础指令。','Please arrive at nine o’clock.','请九点到达。','Please arriving at nine o’clock.','Arrives at nine please.'),
 ],
 A2:[
  englishGrammar('现在进行时','用 be + -ing 描述正在发生或已安排的近期活动。','I am waiting for the bus.','我正在等公交车。','I waiting for the bus.','I am wait for the bus.'),
  englishGrammar('一般过去时','用过去式讲述已经完成并有明确过去时间的事件。','We visited the museum yesterday.','我们昨天参观了博物馆。','We visit the museum yesterday.','We have visit the museum yesterday.'),
  englishGrammar('will 与 be going to','will 常用于即时决定或预测，be going to 常用于已有计划。','I am going to call them this afternoon.','我打算今天下午给他们打电话。','I going call them this afternoon.','I am go to call them this afternoon.'),
  englishGrammar('可数与不可数名词','注意 much、many、some 以及量词与不同名词的搭配。','How much information do we need?','我们需要多少信息？','How many information do we need?','How much informations do we need?'),
  englishGrammar('比较级与最高级','比较两者用比较级，比较三者或以上通常用最高级。','This route is shorter than the other one.','这条路线比另一条短。','This route is more short than the other one.','This route shorter that the other one.'),
  englishGrammar('情态动词与日常功能表达','用 can、could、should 等表达能力、请求或建议。','Could I change my appointment?','我可以更改预约吗？','Could I changed my appointment?','I could to change my appointment?'),
 ],
 'A2+':[
  englishGrammar('现在完成时','用 have/has + 过去分词连接过去的动作和现在的结果。','I have checked the information.','我已经核对了信息。','I has checked the information.','I have check the information.'),
  englishGrammar('过去进行时','用 was/were + -ing 描述过去某个时刻正在进行的动作。','I was waiting when you called.','你打来电话时我正在等。','I waited when you were call.','I was wait when you called.'),
  englishGrammar('过去时与现在完成时对比','有明确过去时间时常用过去时，强调当前经验或结果时用现在完成时。','I visited Berlin last year, but I have never visited Vienna.','我去年去过柏林，但从未去过维也纳。','I have visited Berlin last year.','I visited never Vienna.'),
  englishGrammar('顺序与因果连接','用 first、then、because、so 等连接步骤和原因。','First we check the facts; then we decide.','我们先核对事实，然后作决定。','First we checking, because decide.','Then first we have decide.'),
  englishGrammar('动名词与不定式入门','不同动词后接 -ing 或 to + 动词原形，需要按搭配使用。','I decided to take the earlier train.','我决定乘较早的那班火车。','I decided taking the earlier train.','I decide to took the earlier train.'),
  englishGrammar('关系从句入门','用 who、which、that 补充说明人物或事物。','The colleague who called me was very helpful.','给我打电话的同事很热心。','The colleague which called me was helpful.','The colleague who call me were helpful.'),
 ],
 B1:[
  englishGrammar('叙事中的时态对比','用一般过去时推进事件，用过去进行时交代背景。','I was walking home when it started to rain.','我走路回家时开始下雨了。','I walked home when it was start to rain.','I was walked home when it rained.'),
  englishGrammar('被动语态','用 be + 过去分词突出动作或结果，而非执行者。','The meeting was moved to Friday.','会议被改到了周五。','The meeting moved to Friday.','The meeting was move to Friday.'),
  englishGrammar('间接引语','转述别人的话时需调整人称、时态和时间表达。','She said that she needed more time.','她说她需要更多时间。','She said that I needs more time.','She said she need more time yesterday.'),
  englishGrammar('第一与第二条件句','第一条件句谈现实可能，第二条件句谈假设情况。','If we left earlier, we could avoid the traffic.','如果早点出发，我们或许能避开拥堵。','If we would leave earlier, we avoided traffic.','If we leave earlier yesterday, we could avoided traffic.'),
  englishGrammar('限定性关系从句','关系从句限定所指人物、地点或事物，使信息更准确。','I chose the option that offered more flexibility.','我选择了更灵活的方案。','I chose the option who offered flexibility.','I chose the option that offer more flexible.'),
  englishGrammar('情态推测与短语动词','用 might、must、can’t 表达推测，并在语境中掌握常用短语动词。','They might have run out of tickets.','他们可能已经没有票了。','They might ran out of tickets.','They must to run out tickets.'),
 ],
 B2:[
  englishGrammar('复杂条件句','灵活组合条件和结果，讨论过去与现在之间的影响。','If we had booked earlier, we would have paid less.','如果早点预订，我们本会少花些钱。','If we booked earlier, we would have paid yesterday.','If we had book earlier, we will pay less.'),
  englishGrammar('非谓语与分词结构','用分词或不定式压缩从句，使表达更紧凑。','Having reviewed the evidence, we changed our plan.','审阅证据后，我们改变了计划。','Having review the evidence, we changed plan.','Reviewed having evidence, we change the plan.'),
  englishGrammar('高级被动结构','用被动报告结构保持客观、正式的语气。','The proposal is expected to reduce delays.','预计该提议会减少延误。','The proposal expects to reduce delays.','The proposal is expect reducing delays.'),
  englishGrammar('衔接、转述与限定','用 however、whereas、according to 等组织来源和观点。','The first option is faster, whereas the second is more reliable.','第一个方案更快，而第二个更可靠。','The first option faster, whereas second reliable.','Whereas the first option is fastest because second.'),
  englishGrammar('搭配与精准改写','选择自然搭配，并用同义结构重述原意。','We need to reach a balanced decision.','我们需要作出一个平衡的决定。','We need to do a balanced decision.','We need to arrive a decision balanced.'),
  englishGrammar('让步与结构化论证','先承认另一观点，再用证据说明自己的判断。','Although speed matters, accuracy should remain our priority.','虽然速度重要，准确性仍应优先。','Although speed matters, but accuracy is priority.','Despite speed matters, accuracy priority.'),
 ],
 C1:[
  englishGrammar('倒装与强调结构','用倒装、cleft sentence 或 what-clause 突出论证焦点。','What matters most is whether the evidence is reliable.','最重要的是证据是否可靠。','What most matters whether evidence reliable.','It matters most is the evidence reliable.'),
  englishGrammar('名词化','把动作转化为名词，使正式分析更紧凑、客观。','A careful evaluation of the risks is essential.','对风险进行仔细评估至关重要。','Carefully evaluate of risks is essential.','An evaluate careful the risks is essential.'),
  englishGrammar('复杂名词短语','在中心名词前后加入限定信息，精确压缩复杂概念。','The recently revised long-term funding plan needs review.','最近修订的长期资金计划需要审查。','The revised recently plan funding long-term needs review.','The plan recently long funding revised need review.'),
  englishGrammar('正式与非正式语体','根据听众和场景调整词汇、句式与礼貌程度。','We would appreciate further clarification of the criteria.','如能进一步说明这些标准，我们将不胜感激。','We want you explain those criteria more.','Clarify the criteria to us now.'),
  englishGrammar('立场与限定表达','用 appears、suggests、to some extent 等避免无依据的绝对判断。','The evidence suggests that the policy was partly effective.','证据表明这项政策在一定程度上有效。','The evidence proves the policy always works.','The evidence suggest policy was effect.'),
  englishGrammar('概括、综合与篇章衔接','整合多个来源的共同点和差异，形成连贯结论。','Taken together, these findings support a cautious revision.','综合来看，这些发现支持谨慎修订。','Taking together, these finding supports revise cautious.','Together taken, the findings supports a caution revision.'),
 ],
 C2:[
  englishGrammar('含蓄、歧义与言外之意','辨别字面意义之外的暗示，并在改写时消除不必要的歧义。','Her response was measured rather than enthusiastic.','她的回应很克制，并不热烈。','Her response measured instead enthusiastic.','She response was measure not enthusiasm.'),
  englishGrammar('语义色彩与高级搭配','区分近义词的语气、搭配和隐含评价。','The decision was pragmatic, though hardly visionary.','这个决定很务实，但谈不上有远见。','The decision was practicality, though not vision.','The decision did pragmatic but hardly visionary.'),
  englishGrammar('修辞、隐喻与论证效果','分析形象表达如何影响读者对论点的理解。','The proposal offers a bridge, not a final destination.','这项提议提供了一座桥梁，而非最终目的地。','The proposal offer a bridge, no final destination.','The proposal is bridging not destination final.'),
  englishGrammar('反讽与语用推断','结合语境、语气和共同知识判断说话人的真实意图。','Calling the three-hour delay “minor” was clearly ironic.','把三小时的延误称为“小问题”显然是反讽。','Calling the delay minor clearly irony.','To call delay minor was clear ironically.'),
  englishGrammar('语体切换与受众适配','保持核心事实不变，同时为不同听众调整密度、措辞和语气。','For a public audience, the conclusion should be stated more plainly.','面对公众听众，结论应表达得更直白。','For public audience, conclusion should stating plain.','To a public, conclusion more plainly state.'),
  englishGrammar('批判阅读与精准改写','识别前提、证据和修辞框架，再以更审慎的语言重构结论。','The claim is plausible, provided that its underlying assumptions hold.','如果其基础假设成立，这一说法是合理的。','The claim plausible, provide its assumptions holds.','The claim is plausibly if assumptions holding.'),
 ],
};

const grammarGuide:Record<Exclude<LearningLanguage,'en'>,Record<CourseLevel,Lesson['grammar']>>={
 fr:{} as Record<CourseLevel,Lesson['grammar']>,
 de:{
  A1:{title:'用 können 礼貌提出请求',explanation:'Können Sie…? 使用尊称 Sie，适合向陌生人或服务人员礼貌请求帮助。',example:'Können Sie mir bitte helfen?',translation:'您可以帮我吗？',question:'选择更礼貌的请求。',options:['Hilf mir.','Können Sie mir bitte helfen?','Du helfen.'],answer:1,why:'Können Sie…? 加 bitte 是常用的礼貌请求结构。'},
  A2:{title:'用完成时说明已经发生的事',explanation:'haben/sein + 第二分词是日常口语中讲述过去事件的常用结构。',example:'Ich habe die Informationen geprüft.',translation:'我已经核对了信息。',question:'选择正确的完成时。',options:['Ich habe die Informationen geprüft.','Ich bin die Informationen prüfen.','Ich habe prüfen die Informationen.'],answer:0,why:'prüfen 使用 haben，第二分词 geprüft 放在句末。'},
  'A2+':{title:'用 zuerst、danach、schließlich 组织顺序',explanation:'顺序连接词能清楚说明事件的发展和下一步。',example:'Zuerst prüfen wir die Fakten, danach entscheiden wir.',translation:'我们先核对事实，然后作决定。',question:'选择顺序最清楚的表达。',options:['Zuerst prüfen wir; danach entscheiden wir.','Danach zuerst wir entscheiden.','Wir zuerst weil danach.'],answer:0,why:'zuerst 与 danach 清楚标示了先后顺序。'},
  B1:{title:'掌握 weil 与 obwohl 的从句语序',explanation:'weil 和 obwohl 引导从句时，变位动词放在句末。',example:'Ich bevorzuge diese Lösung, weil sie Zeit spart, obwohl sie mehr kostet.',translation:'我更倾向这个方案，因为它节省时间，尽管成本更高。',question:'选择语序正确的句子。',options:['Ich wähle sie, weil sie spart Zeit.','Ich wähle sie, weil sie Zeit spart.','Ich wähle weil Zeit sie spart.'],answer:1,why:'weil 从句中变位动词 spart 放在句末。'},
  B2:{title:'用第二虚拟式讨论假设方案',explanation:'Wenn + 第二虚拟式，主句用 würde/könnte，可用于审慎协商。',example:'Wenn wir beide Möglichkeiten vergleichen würden, könnten wir fair entscheiden.',translation:'如果比较两个方案，我们就能公平决定。',question:'选择正确的假设条件句。',options:['Wenn wir vergleichen würden, könnten wir entscheiden.','Wenn wir würden vergleichen, wir können entschieden.','Wenn wir verglichen, könnten entschieden.'],answer:0,why:'从句 würde 放在句末，主句 könnte 后接动词原形。'},
  C1:{title:'用名词化压缩复杂信息',explanation:'名词化可以把过程转化为论证对象，常见于正式分析与学术语体。',example:'Die sorgfältige Prüfung der Annahmen ist entscheidend.',translation:'对假设进行仔细审查至关重要。',question:'选择自然的名词化表达。',options:['Die sorgfältige Prüfung der Annahmen ist notwendig.','Die sorgfältig prüfen Annahmen ist notwendig.','Das Annahmen sorgfältig Prüfung.'],answer:0,why:'Prüfung 是 prüfen 的名词化形式，并用属格 der Annahmen 补充对象。'},
  C2:{title:'用 zwar … jedoch 精确表达让步',explanation:'zwar 先承认一方面，jedoch 引出限制或反向判断，适合严谨论证。',example:'Der Vorschlag ist zwar überzeugend, jedoch nicht ausreichend belegt.',translation:'这项提议虽有说服力，但证据并不充分。',question:'选择最准确的让步结构。',options:['Der Vorschlag ist zwar attraktiv, jedoch kaum belegt.','Zwar jedoch der Vorschlag belegt.','Der Vorschlag jedoch zwar attraktiv.'],answer:0,why:'zwar 与 jedoch 构成对应结构，准确表达承认与限制。'},
 },
};

function dialogue(language:LearningLanguage,level:CourseLevel,target:string,targetZh:string,topic:string){
 const p=partner(language,topic),you=learner(language),question=partnerQuestions[language][level],reply=learnerReplies[language][level];
 if(language==='en')return [
  {speaker:p,fr:level==='A1'?'Hello. How can I help you?':'Let us look at the situation carefully. What would you like to achieve?',zh:level==='A1'?'您好，我可以怎么帮助您？':'我们仔细看看这个情况。您希望达成什么目标？'},
  {speaker:you,fr:target,zh:targetZh},
  {speaker:p,fr:question,zh:partnerQuestionZh[level]},
  {speaker:you,fr:reply,zh:learnerReplyZh[level]},
  {speaker:p,fr:level==='A1'?'Certainly. Let us check the details together.':'That gives us a clearer basis for a balanced decision.',zh:level==='A1'?'当然，我们一起核对细节吧。':'这样我们就有了更清楚、平衡的决策基础。'},
  {speaker:you,fr:level==='A1'?'Thank you. That is very helpful.':'Thank you. I can now state the conclusion more precisely and adapt it if the circumstances change.',zh:level==='A1'?'谢谢，这很有帮助。':'谢谢。现在我可以更准确地表述结论，并根据情况变化作出调整。'},
 ];
 return [
  {speaker:p,fr:level==='A1'?'Guten Tag. Wie kann ich Ihnen helfen?':'Betrachten wir die Situation genauer. Was möchten Sie erreichen?',zh:level==='A1'?'您好，我可以怎么帮助您？':'我们仔细看看这个情况。您希望达成什么目标？'},
  {speaker:you,fr:target,zh:targetZh},
  {speaker:p,fr:question,zh:partnerQuestionZh[level]},
  {speaker:you,fr:reply,zh:learnerReplyZh[level]},
  {speaker:p,fr:level==='A1'?'Gern. Wir prüfen die Details zusammen.':'Damit haben wir eine klarere Grundlage für eine ausgewogene Entscheidung.',zh:level==='A1'?'好的，我们一起核对细节。':'这样我们就有了更清楚、平衡的决策基础。'},
  {speaker:you,fr:level==='A1'?'Vielen Dank. Das hilft mir sehr.':'Vielen Dank. Nun kann ich das Ergebnis präziser formulieren und bei veränderten Bedingungen anpassen.',zh:level==='A1'?'非常感谢，这对我很有帮助。':'谢谢。现在我可以更准确地表述结论，并根据条件变化作出调整。'},
 ];
}

function writingExample(language:LearningLanguage,level:CourseLevel,target:string){
 const examples:Record<LearningLanguage,Record<CourseLevel,(value:string)=>string>>={
  fr:{} as Record<CourseLevel,(value:string)=>string>,
  en:{
   A1:v=>`Hello. ${v} Could you help me with the next step, please? I would also like to know the time and place. Thank you for your help.`,
   A2:v=>`Hello. ${v} I have already checked the main information and noted the time, place, and contact details. I still need to confirm one point before I continue. Could you tell me what I should bring and when I should arrive? Thank you for your help.`,
   'A2+':v=>`Hello. ${v} First, I will check the information I already have. Then I will confirm the time, place, and people involved. After that, I can compare the available options and choose the next step. Please let me know if I have missed an important detail.`,
   B1:v=>`Hello. ${v} In my experience, the best approach is to clarify the facts before making a decision. I prefer this option because it is practical and easy to explain, although it may require a little more time. We could confirm the details today and review the result tomorrow. This would give everyone a clear next step and enough time to respond.`,
   B2:v=>`${v} The first option would be faster and easier to organize, whereas the second might produce a more reliable result. Supporters of the first approach may argue that speed is the main priority. However, a quick decision could create extra work later if the information is incomplete. If we checked the evidence, responsibilities, and likely consequences before acting, we could reduce that risk. I would therefore choose the second option, provided that we set a clear deadline and review the outcome together. This compromise respects the need for efficiency while leaving room to correct the plan if new information appears.`,
   C1:v=>`${v} At first sight, the immediate question seems to concern a simple practical choice. Yet that interpretation overlooks two assumptions: that all participants have access to the same information, and that the short-term result is the only relevant measure of success. A more robust analysis should separate verified facts from expectations, identify who bears each risk, and consider how the decision will affect later stages. One view favors rapid action because delay has a visible cost. Another favors additional review because an early error may be difficult to reverse. Both positions contain a legitimate concern, but neither is sufficient on its own. I would recommend a staged decision: agree on a limited first step, define the evidence that will be collected, and set a fixed moment for reassessment. This approach preserves momentum without pretending that uncertainty has disappeared. It also makes the reasoning transparent, so that the conclusion can be revised if the underlying conditions change. The responsibilities and review criteria should also be recorded clearly for everyone involved.`,
   C2:v=>`${v} The apparent simplicity of the choice is partly rhetorical: by presenting the matter as a contest between speed and caution, the discussion quietly excludes other criteria, including reversibility, distribution of risk, and the credibility of the evidence. A skeptical audience may therefore resist a conclusion that sounds decisive but leaves those premises unexamined. One could concede that immediate action has practical value, particularly when delay imposes measurable costs. Nevertheless, that concession does not establish that the fastest option is proportionate, fair, or sustainable. The stronger case begins by distinguishing what is known from what is merely plausible, then asks which consequences would be hardest to undo. It should also acknowledge that different participants may use the same words while assigning them different meanings. I would frame the recommendation as conditional rather than absolute: proceed with a limited, reversible measure if the agreed evidence threshold is met; otherwise pause and gather the missing information. This formulation neither disguises uncertainty nor turns it into an excuse for inaction. It clarifies who must decide, what would justify revision, and how the language of the conclusion should change for a technical, public, or directly affected audience. Finally, it gives future reviewers a transparent record of the judgment, the remaining doubt, and the precise conditions under which a different conclusion would become reasonable.`,
  },
  de:{
   A1:v=>`Guten Tag. ${v} Können Sie mir bitte beim nächsten Schritt helfen? Ich möchte auch Zeit und Ort wissen. Vielen Dank für Ihre Hilfe.`,
   A2:v=>`Guten Tag. ${v} Ich habe die wichtigsten Angaben schon geprüft und Zeit, Ort sowie Kontaktdaten notiert. Einen Punkt muss ich noch klären, bevor ich weitermache. Können Sie mir sagen, was ich mitbringen soll und wann ich kommen muss? Vielen Dank für Ihre Unterstützung.`,
   'A2+':v=>`Guten Tag. ${v} Zuerst prüfe ich die Informationen, die ich schon habe. Danach bestätige ich Zeit, Ort und beteiligte Personen. Anschließend kann ich die Möglichkeiten vergleichen und den nächsten Schritt wählen. Bitte sagen Sie mir, falls ich ein wichtiges Detail übersehen habe.`,
   B1:v=>`Guten Tag. ${v} Meiner Erfahrung nach sollten wir zuerst die Fakten klären und erst danach entscheiden. Ich bevorzuge diese Möglichkeit, weil sie praktisch und leicht zu erklären ist, obwohl sie etwas mehr Zeit benötigt. Wir könnten die Einzelheiten heute bestätigen und das Ergebnis morgen gemeinsam prüfen. So hätten alle Beteiligten einen klaren nächsten Schritt und genügend Zeit für eine Rückmeldung.`,
   B2:v=>`${v} Die erste Möglichkeit wäre schneller und leichter zu organisieren, während die zweite ein verlässlicheres Ergebnis liefern könnte. Befürworter der ersten Lösung werden einwenden, dass vor allem die Zeit zählt. Eine vorschnelle Entscheidung kann jedoch später zusätzliche Arbeit verursachen, wenn wichtige Informationen fehlen. Wenn wir Belege, Zuständigkeiten und mögliche Folgen vorab prüfen würden, könnten wir dieses Risiko verringern. Deshalb würde ich die zweite Möglichkeit wählen, sofern wir eine klare Frist setzen und das Ergebnis gemeinsam auswerten. Dieser Kompromiss berücksichtigt den Wunsch nach Effizienz und lässt zugleich Korrekturen zu, falls neue Informationen auftauchen.`,
   C1:v=>`${v} Auf den ersten Blick scheint es lediglich um eine praktische Entscheidung zu gehen. Diese Deutung übersieht jedoch zwei Voraussetzungen: dass alle Beteiligten über dieselben Informationen verfügen und dass nur das kurzfristige Ergebnis als Erfolg gilt. Eine belastbare Analyse sollte bestätigte Fakten von Erwartungen trennen, die Verteilung der Risiken benennen und mögliche Folgen für spätere Schritte berücksichtigen. Die eine Position fordert rasches Handeln, weil Verzögerungen sichtbare Kosten verursachen. Die andere verlangt eine zusätzliche Prüfung, weil sich ein früher Fehler nur schwer korrigieren ließe. Beide Sichtweisen greifen einen berechtigten Punkt auf, reichen für sich genommen aber nicht aus. Ich empfehle daher ein gestuftes Vorgehen: Wir vereinbaren zunächst eine begrenzte Maßnahme, legen die benötigten Nachweise fest und bestimmen einen festen Zeitpunkt für die erneute Bewertung. So bleibt der Prozess in Bewegung, ohne Unsicherheit zu verschweigen. Gleichzeitig wird die Begründung transparent und kann angepasst werden, wenn sich die Ausgangsbedingungen ändern. Zusätzlich sollten Zuständigkeiten dokumentiert werden, damit spätere Entscheidungen nachvollziehbar bleiben und nicht von wechselnden Erwartungen abhängen.`,
   C2:v=>`${v} Die scheinbare Einfachheit der Wahl ist zum Teil ein sprachlicher Effekt: Indem die Frage als Gegensatz zwischen Schnelligkeit und Vorsicht dargestellt wird, geraten andere Kriterien aus dem Blick, etwa Umkehrbarkeit, Risikoverteilung und die Belastbarkeit der Belege. Ein skeptisches Publikum dürfte deshalb eine Schlussfolgerung zurückweisen, die entschieden klingt, ihre Voraussetzungen aber nicht offenlegt. Man kann einräumen, dass sofortiges Handeln einen praktischen Wert besitzt, besonders wenn Verzögerungen messbare Kosten verursachen. Daraus folgt jedoch noch nicht, dass die schnellste Lösung verhältnismäßig, gerecht oder dauerhaft tragfähig ist. Eine überzeugendere Argumentation trennt zunächst gesicherte Erkenntnisse von bloß plausiblen Annahmen und fragt anschließend, welche Folgen am schwersten rückgängig zu machen wären. Außerdem muss sie berücksichtigen, dass verschiedene Beteiligte dieselben Begriffe verwenden, ihnen aber unterschiedliche Bedeutungen geben können. Ich würde die Empfehlung daher bewusst an Bedingungen knüpfen: Eine begrenzte und umkehrbare Maßnahme sollte umgesetzt werden, wenn die vereinbarte Belegschwelle erreicht ist; andernfalls sind die fehlenden Informationen zuerst zu beschaffen. Diese Formulierung verschleiert weder die Unsicherheit noch benutzt sie sie als Vorwand für Untätigkeit. Sie macht vielmehr deutlich, wer entscheidet, welche Erkenntnisse eine Korrektur rechtfertigen und wie die Schlussfolgerung für ein fachliches, öffentliches oder unmittelbar betroffenes Publikum sprachlich angepasst werden muss. Abschließend sollte festgehalten werden, welche Zweifel fortbestehen und unter welchen konkreten Bedingungen eine abweichende Bewertung sachlich gerechtfertigt wäre. Diese Dokumentation bleibt für spätere Prüfungen verfügbar.`,
  },
 };
 return examples[language][level](target);
}

function makeLesson(language:'en'|'de',level:CourseLevel,s:Scenario,index:number):Lesson{
 const base=language==='en'?s.en:s.de,target=(language==='en'?englishTargets:germanTargets)[level](base),targetZh=targetTranslation(level,s.zh),design=levelDesign[level];
 const you=learner(language),id=`${language}-${levelSlug(level)}-${String(index+1).padStart(2,'0')}`;
 const response=learnerReplies[language][level],connector=language==='en'?(level==='A1'?'the next step':level==='A2'?'I have already checked':level==='A2+'?'first, then, finally':level==='B1'?'because and although':level==='B2'?'if we compared':level==='C1'?'what matters most':'granted; nevertheless'):(level==='A1'?'der nächste Schritt':level==='A2'?'ich habe bereits geprüft':level==='A2+'?'zuerst, danach, schließlich':level==='B1'?'weil und obwohl':level==='B2'?'wenn wir vergleichen würden':level==='C1'?'entscheidend ist':'zwar … jedoch');
 const words=[
  {id:`${id}-word-1`,fr:target,pos:language==='en'?'key expression':'Schlüsselausdruck',zh:targetZh},
  {id:`${id}-word-2`,fr:response,pos:language==='en'?'exam-ready phrase':'Prüfungsausdruck',zh:`${level} 级用于补充细节、理由或限定条件的表达。`},
  {id:`${id}-word-3`,fr:connector,pos:language==='en'?'language pattern':'Sprachmuster',zh:`${level} 级的组织与衔接表达。`},
 ];
 const readingTask=level==='A1'?undefined:{prompt:`这段对话如何体现 ${level} 级“${design.goal}”的能力？请找出一处组织信息或表达立场的语言证据。`,answer:`核心证据是“${response}”。它不仅回应事实，还按 ${level} 的要求加入了顺序、理由、让步、假设或立场限定。`};
 const grammar=language==='en'?englishKnowledgeGuide[level][index%englishKnowledgeGuide[level].length]:grammarGuide.de[level];
 return {id,language,learnerSpeaker:you,topic:s.topic,level,title:`${s.title} · ${design.title}`,fr:target,goal:`围绕“${s.title}”练习 ${level}：${design.goal}。`,minutes:design.minutes,dialogue:dialogue(language,level,target,targetZh,s.topic),words,grammar,
  quiz:{question:language==='en'?'What is the learner mainly trying to achieve?':'Was möchte die lernende Person vor allem erreichen?',options:[language==='en'?'Clarify the situation and agree on an appropriate next step.':'Die Situation klären und einen passenden nächsten Schritt vereinbaren.',language==='en'?'Avoid giving any information.':'Keine Informationen geben.',language==='en'?'End the conversation without a decision.':'Das Gespräch ohne Entscheidung beenden.'],answer:0,why:`学习者围绕“${s.title}”补充信息并推动形成下一步。`},
  readingTask,writing:{prompt:`围绕“${s.title}”完成 ${level} 写作：${design.writing}`,example:writingExample(language,level,target),...(level==='A1'?{}:{checklist:design.checklist})},
 };
}

export const englishLessons=courseLevels.flatMap(level=>scenarios.map((scenario,index)=>makeLesson('en',level,scenario,index)));
export const germanLessons=courseLevels.flatMap(level=>scenarios.map((scenario,index)=>makeLesson('de',level,scenario,index)));
