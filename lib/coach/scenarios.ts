import type {CoachLanguage,CoachLevel} from './types';
export type Scenario={id:string;version:number;language:CoachLanguage;level:CoachLevel;title:string;role:string;goal:string;tasks:string[];opening:string;translation:string;support:string[];source:{type:'original';method:'AI-assisted';review:'not-human-reviewed'}};
type Seed=[string,string,string,string[],string,string,string[]];
function scenarios(language:CoachLanguage,level:CoachLevel,seeds:Seed[]):Scenario[]{return seeds.map(([title,role,goal,tasks,opening,translation,support],i)=>({id:`scene-${language.slice(0,2)}-${level.toLowerCase()}-${i+1}`,version:1,language,level,title,role,goal,tasks,opening,translation,support,source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'}}))}
export const coachScenarios:Scenario[]=[
 ...scenarios('fr-FR','A1',[
  ['认识新同学','法语班新同学','用简单语句互相认识',['介绍姓名和住处','说明学习法语的一个原因','问对方一个问题'],'Bonjour ! Je m’appelle Camille. Et vous ?','你好！我叫卡米耶。您呢？',['Je m’appelle…','J’habite à…','J’apprends le français pour voyager.']],
  ['咖啡店点单','咖啡店店员','完成饮品点单',['选择一种饮品','说明堂食或外带','询问价格'],'Bonjour ! Vous désirez ?','您好！您想要什么？',['Je voudrais un café.','Sur place, s’il vous plaît.','Combien ça coûte ?']],
  ['介绍日常安排','想了解你日常生活的朋友','说明一天的基本安排',['说出起床时间','描述一项白天活动','询问对方的安排'],'Vous vous levez à quelle heure ?','您几点起床？',['Je me lève à sept heures.','Je travaille le matin.','Et vous ?']],
  ['商店问价','文具店店员','选择并购买一件物品',['询问一种物品价格','说明数量','礼貌结束交流'],'Bonjour ! Vous cherchez quelque chose ?','您好！您在找什么东西吗？',['Combien coûte ce cahier ?','Je prends deux stylos.','Merci, bonne journée.']],
 ]),
 ...scenarios('fr-FR','A2',[
  ['酒店晚到','酒店接待员','说明晚到并确认入住办法',['说明预订和晚到原因','给出预计到达时间','确认钥匙领取方式'],'Bonsoir, réception de l’hôtel. Comment puis-je vous aider ?','晚上好，这里是酒店前台。有什么可以帮您？',['J’ai une réservation au nom de…','Mon train a du retard.','Où puis-je récupérer la clé ?']],
  ['重新约时间','一起准备报告的同学','改约并共同确认安排',['解释原时间不方便的原因','提出新时间','确认地点和时间'],'On se retrouve mardi à dix heures pour le projet ?','我们周二十点见面做项目吗？',['Je ne suis pas disponible mardi.','Est-ce que jeudi vous convient ?','Alors, jeudi à la bibliothèque.']],
  ['问路并确认路线','街上的行人','找到公共服务地点',['说明目的地','追问一个不清楚的方向','复述关键路线以确认'],'Bonjour, vous cherchez votre chemin ?','您好，您在找路吗？',['Je cherche la poste.','Après le pont, je tourne à droite ?','Il faut combien de temps à pied ?']],
  ['谈论家庭周末','对你的周末感兴趣的朋友','描述一次家庭活动并表达感受',['说明和谁去了哪里','描述两件已经做过的事','说明感受并询问对方'],'Qu’est-ce que vous avez fait avec votre famille ce week-end ?','这个周末您和家人做了什么？',['Nous sommes allés au parc.','Nous avons préparé un repas.','C’était agréable. Et vous ?']],
 ]),
 ...scenarios('de-DE','A1',[
  ['介绍自己和家人','语言班同学','进行简单的个人介绍',['介绍姓名和住处','介绍一名家人','向对方提问'],'Hallo! Ich heiße Mia. Wie heißen Sie?','您好！我叫米娅。您叫什么？',['Ich heiße…','Meine Schwester wohnt in…','Woher kommen Sie?']],
  ['面包店点单','面包店售货员','完成早餐购买',['选择食物或饮品','说明数量','询问总价'],'Guten Morgen! Was möchten Sie?','早上好！您想要什么？',['Ich möchte zwei Brötchen.','Einen Kaffee, bitte.','Was kostet das zusammen?']],
  ['询问公交站','街上的行人','确定车站位置和方向',['询问车站在哪里','确认左转还是右转','礼貌结束'],'Guten Tag! Kann ich Ihnen helfen?','您好！我能帮您吗？',['Wo ist die Bushaltestelle?','Nach links oder nach rechts?','Vielen Dank!']],
  ['一天的时间表','德语班同学','说明日常时间安排',['说明起床时间','说明课程开始时间','描述晚上的一项活动'],'Wann stehen Sie normalerweise auf?','您通常什么时候起床？',['Ich stehe um sieben Uhr auf.','Mein Kurs beginnt um neun Uhr.','Abends rufe ich meine Mutter an.']],
 ]),
 ...scenarios('de-DE','A2',[
  ['办理酒店入住','酒店接待员','完成入住并询问信息',['说明预订姓名','确认住宿天数','询问早餐时间'],'Guten Abend! Haben Sie ein Zimmer reserviert?','晚上好！您预订房间了吗？',['Ich habe ein Zimmer auf den Namen… reserviert.','Ich bleibe zwei Nächte.','Wann gibt es Frühstück?']],
  ['商店更换尺寸','服装店售货员','说明问题并找到合适尺寸',['说明已买物品及问题','请求另一尺寸','确认试穿或更换办法'],'Guten Tag! Was kann ich für Sie tun?','您好！有什么可以帮您？',['Ich habe gestern diese Jacke gekauft.','Sie ist leider zu klein.','Kann ich eine größere Größe anprobieren?']],
  ['改约看房时间','负责安排看房的房东','解释冲突并改约',['说明不能按原时间到达','给出原因和替代时间','确认新约定'],'Wir sehen uns am Mittwoch um 16 Uhr, richtig?','我们周三16点见，对吗？',['Leider muss ich länger arbeiten.','Könnten wir uns am Donnerstag treffen?','Um 17 Uhr passt es mir gut.']],
 ['家庭周末出游','询问你周末安排的朋友','叙述一次家庭出游',['说明同行人和地点','用过去表达描述活动','说明感受和下次计划'],'Wie war Ihr Wochenende mit der Familie?','您和家人度过的周末怎么样？',['Wir sind mit dem Bus zum See gefahren.','Dort haben wir ein Picknick gemacht.','Nächstes Mal möchten wir früher losfahren.']],
 ]),
 // DELF A1/A2 oral specialist tasks have separate, level-matched role interactions.
 {id:'scene-fr-a1-oral-1',version:1,language:'fr-FR',level:'A1',title:'A1 口语 · 社团初次见面',role:'法语社团的新同伴',goal:'初次见面时互相介绍，并主动向对方提问',tasks:['介绍姓名和住处','说明一个爱好','向新同伴提一个简单问题'],opening:'Bonjour ! Je m’appelle Camille. Comment vous appelez-vous ?',translation:'你好！我叫卡米耶。您叫什么名字？',support:['Je m’appelle… et j’habite à…','J’aime…','Et vous, qu’est-ce que vous aimez faire ?'],source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'}},
 {id:'scene-fr-a1-oral-2',version:1,language:'fr-FR',level:'A1',title:'A1 口语 · 面包店买早餐',role:'面包店店员',goal:'买早餐，问总价并说明外带',tasks:['点两个可颂和一杯咖啡','询问总价','说明外带并礼貌致谢'],opening:'Bonjour ! Qu’est-ce que vous désirez ?',translation:'您好！您想要什么？',support:['Je voudrais deux croissants et un café, s’il vous plaît.','Ça fait combien en tout ?','C’est à emporter. Merci !'],source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'}},
 {id:'scene-fr-a2-oral-1',version:1,language:'fr-FR',level:'A2',title:'A2 口语 · 交流周末活动',role:'正在和你讨论周末的朋友',goal:'讲述两件周末活动、解释喜好并提出下一次活动建议',tasks:['按顺序说出两件过去的活动','解释为什么喜欢其中一件','提出下次一起活动的建议'],opening:'Salut ! Qu’est-ce que tu as fait ce week-end ?',translation:'嗨！你这个周末做了什么？',support:['Samedi, j’ai… Puis dimanche, je suis allé(e)…','J’ai aimé… parce que…','On pourrait… ensemble le week-end prochain ?'],source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'}},
 {id:'scene-fr-a2-oral-2',version:1,language:'fr-FR',level:'A2',title:'A2 口语 · 酒店热水故障',role:'酒店前台接待员',goal:'说明热水问题和已做的检查，商量解决办法与等待时间',tasks:['描述房间没有热水及已做的检查','礼貌请求解决办法','询问还需等待多久'],opening:'Bonsoir, la réception de l’hôtel. Quel est le problème dans votre chambre ?',translation:'晚上好，这里是酒店前台。您的房间有什么问题？',support:['Il n’y a pas d’eau chaude dans ma chambre.','J’ai déjà vérifié… Pouvez-vous m’aider ?','Combien de temps faut-il attendre ?'],source:{type:'original',method:'AI-assisted',review:'not-human-reviewed'}},
];
export const getScenario=(id:string)=>coachScenarios.find(s=>s.id===id);
