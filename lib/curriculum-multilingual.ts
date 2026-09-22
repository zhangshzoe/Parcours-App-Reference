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

const partner=(language:LearningLanguage,topic:string)=>language==='en'?(topic==='work'?'Colleague':'Partner'):(topic==='work'?'Kollegin':'Gesprächspartner');
const learner=(language:LearningLanguage)=>language==='en'?'You':'Du';

function makeLesson(language:LearningLanguage,s:Scenario,index:number):Lesson{
 const target=language==='en'?s.en:s.de;
 const p=partner(language,s.topic),you=learner(language),id=`${language}-a1-${String(index+1).padStart(2,'0')}`;
 const dialogue=language==='en'?[
  {speaker:p,fr:'Hello. How can I help you?',zh:'您好，我可以怎么帮助您？'},
  {speaker:you,fr:target,zh:s.zh},
  {speaker:p,fr:'Of course. Do you need anything else?',zh:'当然。您还需要别的帮助吗？'},
  {speaker:you,fr:'Yes, could you explain the next step?',zh:'需要，您能说明下一步吗？'},
  {speaker:p,fr:'Certainly. Let us check the details together.',zh:'当然，我们一起核对细节吧。'},
  {speaker:you,fr:'Thank you. That is very helpful.',zh:'谢谢，这很有帮助。'},
 ]:[
  {speaker:p,fr:'Guten Tag. Wie kann ich Ihnen helfen?',zh:'您好，我可以怎么帮助您？'},
  {speaker:you,fr:target,zh:s.zh},
  {speaker:p,fr:'Natürlich. Brauchen Sie noch etwas?',zh:'当然。您还需要别的帮助吗？'},
  {speaker:you,fr:'Ja, können Sie bitte den nächsten Schritt erklären?',zh:'需要，您能说明下一步吗？'},
  {speaker:p,fr:'Gern. Wir prüfen die Details zusammen.',zh:'好的，我们一起核对细节。'},
  {speaker:you,fr:'Vielen Dank. Das hilft mir sehr.',zh:'非常感谢，这对我很有帮助。'},
 ];
 const words=language==='en'?[
  {id:`${id}-word-1`,fr:target,pos:'expression',zh:s.zh},
  {id:`${id}-word-2`,fr:'Could you help me?',pos:'expression',zh:'您可以帮助我吗？'},
  {id:`${id}-word-3`,fr:'the next step',pos:'noun phrase',zh:'下一步'},
 ]:[
  {id:`${id}-word-1`,fr:target,pos:'Ausdruck',zh:s.zh},
  {id:`${id}-word-2`,fr:'Können Sie mir helfen?',pos:'Ausdruck',zh:'您可以帮助我吗？'},
  {id:`${id}-word-3`,fr:'der nächste Schritt',pos:'Nominalgruppe',zh:'下一步'},
 ];
 const grammar=language==='en'?{
  title:'用 could 礼貌提出请求',explanation:'Could you…? 比直接使用命令更礼貌，适合向陌生人或服务人员请求帮助。',example:'Could you explain the next step?',translation:'您可以说明下一步吗？',question:'选择更礼貌的请求。',options:['Explain it.','Could you explain it, please?','You explain.'],answer:1,why:'Could you…? 加 please 构成自然、礼貌的请求。',
 }:{
  title:'用 können 礼貌提出请求',explanation:'Können Sie…? 使用尊称 Sie，适合向陌生人或服务人员礼貌请求帮助。',example:'Können Sie mir bitte helfen?',translation:'您可以帮我吗？',question:'选择更礼貌的请求。',options:['Hilf mir.','Können Sie mir bitte helfen?','Du helfen.'],answer:1,why:'Können Sie…? 加 bitte 是常用的礼貌请求结构。',
 };
 const writingExample=language==='en'
  ?`Hello. ${target} I would like to explain the details clearly. Could you help me with the next step, please? Thank you for your time and your help.`
  :`Guten Tag. ${target} Ich möchte die Details klar erklären. Können Sie mir bitte beim nächsten Schritt helfen? Vielen Dank für Ihre Zeit und Ihre Hilfe.`;
 return {id,language,learnerSpeaker:you,topic:s.topic,level:'A1',title:s.title,fr:target,goal:`在“${s.title}”场景中说清需求，并礼貌询问下一步。`,minutes:12,dialogue,words,grammar,
  quiz:{question:language==='en'?'What does the learner want to communicate?':'Was möchte die lernende Person sagen?',options:[target,language==='en'?'The learner wants to leave immediately.':'Die Person möchte sofort gehen.',language==='en'?'The learner does not need help.':'Die Person braucht keine Hilfe.'],answer:0,why:`对话中的核心表达是：“${target}”`},
  writing:{prompt:`围绕“${s.title}”写一段简短消息：说明需求，并加入一句礼貌请求。`,example:writingExample},
 };
}

export const englishLessons=scenarios.map((scenario,index)=>makeLesson('en',scenario,index));
export const germanLessons=scenarios.map((scenario,index)=>makeLesson('de',scenario,index));
