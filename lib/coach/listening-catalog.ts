// Server only: scripts, answer keys and explanations are withheld before submission.
import {coachLessons} from './catalog';
import type {ListeningMaterial} from './listening-types';
type Q=[string,[string,string,string],number,string,string];
type Seed={segments:[string,string][];questions:Q[];dictation:[string,string,string]};
const seeds:Record<string,Seed>={
 'coach-fr-a1-1':{
  segments:[['Bonjour, je m’appelle Lina. Je suis étudiante.','你好，我叫莉娜。我是一名学生。'],['J’habite à Lyon, mais je viens de Shanghai.','我住在里昂，但来自上海。'],['Et vous, vous habitez ici ?','您呢，您住在这里吗？']],
  questions:[['Lina 的身份是什么？',['学生','医生','教师'],0,'Je suis étudiante 说明她是学生；étudiante 为阴性形式。','身份表达'],['Lina 来自哪里？',['巴黎','上海','里昂'],1,'je viens de Shanghai 表示来自上海；住处与出身地不同。','来自与居住']],
  dictation:['听写说话者介绍的名字。','Lina','je m’appelle Lina 中 Lina 是姓名。大小写不影响本题。'],
 },
 'coach-fr-a1-2':{
  segments:[['Bonjour, je voudrais un thé, s’il vous plaît.','您好，我想要一杯茶。'],['Avec du lait ? Non, merci. Et un croissant.','加牛奶吗？不用，谢谢。再要一个可颂。'],['Sur place ou à emporter ? Sur place.','堂食还是外带？堂食。']],
  questions:[['顾客想喝什么？',['咖啡','茶','果汁'],1,'un thé 表示一杯茶。','饮品识别'],['顾客还点了什么食物？',['汤','面包卷','可颂'],2,'Et un croissant 表示还要一个可颂。','点餐追加']],
  dictation:['听写饮品的法语单词，不写冠词。','thé','thé 的 é 需要重音。本题不忽略法语重音。'],
 },
 'coach-fr-a1-3':{
  segments:[['Bonjour, combien coûte ce cahier ? Trois euros.','您好，这本本子多少钱？三欧元。'],['Et le stylo ? Deux euros.','那支笔呢？两欧元。'],['Je prends le cahier, merci.','我要这本本子，谢谢。']],
  questions:[['本子多少钱？',['两欧元','三欧元','五欧元'],1,'Trois euros 回答本子的价格。','价格'],['笔多少钱？',['两欧元','三欧元','十二欧元'],0,'Deux euros 紧接询问笔的价格。','对应物品与价格']],
  dictation:['听写“笔”的法语单词，不写冠词。','stylo','le stylo 中 stylo 表示笔。'],
 },
 'coach-fr-a1-4':{
  segments:[['Le matin, je travaille à neuf heures.','早上我九点工作。'],['À midi, je mange avec une amie.','中午我和一位女性朋友吃饭。'],['Le soir, j’étudie le français à la maison.','晚上我在家学法语。'],['Je ne travaille pas le dimanche.','我星期日不工作。']],
  questions:[['早上几点工作？',['八点','十二点','九点'],2,'à neuf heures 表示九点。','时间'],['晚上在哪里学法语？',['家里','学校','办公室'],0,'à la maison 说明在家学习。','活动地点']],
  dictation:['听写表示“中午”的单词，不写介词。','midi','À midi 表示中午；本题只填写 midi。'],
 },
 'coach-fr-a2-1':{
  segments:[['J’ai réservé une chambre pour deux nuits, mais mon train de dimanche a été annulé.','我订了两晚的房间，但星期日的火车被取消了。'],['Est-ce que je peux rester une nuit de plus ?','我可以多住一晚吗？'],['Je préfère garder la même chambre si c’est possible.','如果可以，我希望保留同一间房。']],
  questions:[['原来预订了几晚？',['一晚','两晚','三晚'],1,'pour deux nuits 指原预订；une nuit de plus 指额外增加。','原计划与变化'],['旅客对房间有什么偏好？',['换到大房间','取消房间','保留同一间房'],2,'garder la même chambre 表示保持原房间。','请求中的偏好']],
  dictation:['听写“房间”的法语单词，不写冠词。','chambre','une chambre 是一个房间；结尾有不发音的 e。'],
 },
 'coach-fr-a2-2':{
  segments:[['Samedi, je suis allée au marché avec ma sœur.','星期六我和姐姐或妹妹去了市场。'],['Nous avons acheté des légumes, puis nous avons préparé une soupe.','我们买了蔬菜，然后煮了汤。'],['Il pleuvait, alors nous sommes restées à la maison.','天在下雨，所以我们待在家里。'],['J’ai aimé ce moment tranquille.','我喜欢这段安静的时光。']],
  questions:[['谁和说话者一起去了市场？',['姐妹','母亲','同学'],0,'avec ma sœur 说明与姐妹同行。','同行者'],['为什么待在家里？',['生病','下雨','没有公交'],1,'Il pleuvait, alors… 中 alors 引出因为下雨而留在家里的结果。','原因与结果']],
  dictation:['听写买到的食物“蔬菜”的法语复数，不写冠词。','légumes','des légumes 中有 é，复数结尾为 s。'],
 },
 'coach-fr-a2-3':{
  segments:[['On se retrouve mardi à dix-huit heures pour préparer l’exposé ?','星期二十八点见面准备报告好吗？'],['Je ne peux pas, j’ai cours jusqu’à dix-neuf heures.','不行，我要上课到十九点。'],['Mercredi à la même heure, ça te va ? Oui, devant la bibliothèque.','星期三同一时间可以吗？好，在图书馆前面。']],
  questions:[['最初约定的活动是什么？',['吃晚饭','看电影','准备报告'],2,'pour préparer l’exposé 表示见面是为了准备报告。','活动目的'],['原来建议的时间为什么不行？',['要上课到十九点','图书馆关门','要去车站'],0,'j’ai cours jusqu’à dix-neuf heures 说明课程持续到十九点。','时间冲突']],
  dictation:['听写最后确认的星期名称。','mercredi','Mercredi 是星期三；mardi 是原建议的星期二。'],
 },
 'coach-fr-a2-4':{
  segments:[['Bonjour, le chauffage de mon appartement ne fonctionne plus depuis hier.','您好，我公寓的暖气从昨天开始不能用了。'],['Il fait froid dans le salon.','客厅很冷。'],['Pourriez-vous envoyer quelqu’un demain matin ?','您能明天上午派人来吗？'],['Je serai chez moi jusqu’à midi.','我会在家待到中午。']],
  questions:[['发生了什么问题？',['窗户打不开','暖气不能用了','冰箱漏水'],1,'le chauffage … ne fonctionne plus 表示供暖停止运作。','故障描述'],['问题从什么时候开始？',['从昨天','从上周','从明天'],0,'depuis hier 指从昨天延续到现在。','持续时间']],
  dictation:['听写发生问题的设备“暖气”的法语单词，不写冠词。','chauffage','le chauffage 指供暖或暖气。'],
 },
 'coach-de-a1-1':{
  segments:[['Guten Tag, ich heiße Leon. Ich wohne in Berlin.','您好，我叫莱昂。我住在柏林。'],['Meine Schwester heißt Mia. Sie ist Studentin.','我的姐妹叫米娅。她是一名学生。'],['Wir sprechen zu Hause Deutsch und Chinesisch.','我们在家说德语和中文。']],
  questions:[['Leon 住在哪里？',['慕尼黑','汉堡','柏林'],2,'Ich wohne in Berlin 说明居住城市。','居住地点'],['家里使用哪两种语言？',['德语和中文','英语和中文','德语和法语'],0,'Deutsch und Chinesisch 表示德语和中文。','语言名称']],
  dictation:['听写 Leon 居住的城市。','Berlin','Berlin 是柏林；本题不区分大小写。'],
 },
 'coach-de-a1-2':{
  segments:[['Was kostet die Tasche ? Zwölf Euro.','这个包多少钱？十二欧元。'],['Haben Sie auch eine kleine Tasche ? Ja, die kostet acht Euro.','您也有小包吗？有，小包八欧元。'],['Gut, ich nehme die kleine Tasche.','好，我要小包。']],
  questions:[['最先问到的包多少钱？',['十二欧元','八欧元','二十欧元'],0,'Zwölf Euro 回答最初询问的包；acht Euro 是小包的价格。','数字与物品'],['顾客又询问了什么尺寸？',['更大的','小的','中号的'],1,'eine kleine Tasche 是小包。','大小描述']],
  dictation:['听写“包”的德语单数，不写冠词。','Tasche','die Tasche 为阴性名词。练习中不因大小写扣分，但词卡使用大写名词。'],
 },
 'coach-de-a1-3':{
  segments:[['Entschuldigung, wo ist der Bahnhof ?','打扰一下，火车站在哪里？'],['Gehen Sie geradeaus und dann nach links. Der Bahnhof ist neben der Post.','直走，然后向左。火车站在邮局旁。'],['Vielen Dank. Ist es weit ? Nein, nur fünf Minuten zu Fuß.','谢谢，很远吗？不远，步行只有五分钟。']],
  questions:[['直走之后往哪边转？',['右边','左边','后面'],1,'dann nach links 表示随后向左。','方向'],['步行大约多久？',['五分钟','十五分钟','五十分钟'],0,'nur fünf Minuten zu Fuß 表示步行只有五分钟。','距离与时间']],
  dictation:['听写“向左”中的方向词，不写 nach。','links','nach links 是向左，与 nach rechts 相对。'],
 },
 'coach-de-a1-4':{
  segments:[['Ich stehe um sieben Uhr auf.','我七点起床。'],['Um acht Uhr beginnt mein Deutschkurs.','八点德语课开始。'],['Am Nachmittag kaufe ich ein.','下午我购物。'],['Abends rufe ich meine Mutter an.','晚上我给母亲打电话。']],
  questions:[['几点起床？',['六点','八点','七点'],2,'um sieben Uhr 与 aufstehen 的可分形式 stehe … auf 连用。','日常时间'],['下午做什么？',['上课','购物','打电话'],1,'Am Nachmittag kaufe ich ein：下午购物。','可分动词听辨']],
  dictation:['听写“八”这个数词。','acht','acht 出现在德语课开始的时间 um acht Uhr。'],
 },
 'coach-de-a2-1':{
  segments:[['Ich habe ein Zimmer für Freitag reserviert.','我预订了星期五的房间。'],['Mein Zug kommt aber erst um 22 Uhr an.','但我的火车直到二十二点才到。'],['Kann ich so spät noch einchecken ?','我还能这么晚入住吗？'],['Bitte sagen Sie mir, wo ich den Schlüssel abholen kann.','请告诉我可以在哪里取钥匙。']],
  questions:[['预订的是哪一天？',['星期五','星期四','星期六'],0,'für Freitag 是预订日期。','预订日期'],['火车几点到达？',['二十点','二十二点','十二点'],1,'erst um 22 Uhr an 表示直到二十二点才到达。','到达时间']],
  dictation:['听写“钥匙”的德语单数，不写冠词。','Schlüssel','der Schlüssel 含 ü；本题保留变元音，不将 u 当作 ü。'],
 },
 'coach-de-a2-2':{
  segments:[['Können wir am Donnerstag zusammen lernen ?','星期四一起学习好吗？'],['Leider nicht, weil ich bis sechs Uhr arbeiten muss.','抱歉不行，因为我必须工作到六点。'],['Wie wäre es am Freitag um fünf ? Das passt.','星期五五点怎么样？合适。'],['Wir treffen uns in der Bibliothek.','我们在图书馆见。']],
  questions:[['为什么原来的时间不行？',['要看医生','要工作到六点','要去机场'],1,'weil ich bis sechs Uhr arbeiten muss 给出工作冲突。','weil 原因从句'],['最后确认在哪里见面？',['餐厅','家里','图书馆'],2,'in der Bibliothek 是确认的地点。','约定地点']],
  dictation:['听写最终见面地点“图书馆”的德语单数，不写冠词。','Bibliothek','die Bibliothek 为图书馆；in der Bibliothek 使用第三格。'],
 },
 'coach-de-a2-3':{
  segments:[['Letzten Samstag bin ich mit dem Bus zum See gefahren.','上星期六我坐公交去了湖边。'],['Ich habe dort Freunde getroffen. Wir haben ein Picknick gemacht.','我在那里见了朋友，我们野餐了。'],['Weil es später geregnet hat, sind wir früh nach Hause gefahren.','因为后来下雨，我们提前回家了。']],
  questions:[['使用了什么交通方式？',['火车','自行车','公交'],2,'mit dem Bus 是乘公交。','交通方式'],['和朋友做了什么？',['野餐','购物','上课'],0,'ein Picknick gemacht 表示进行了野餐。','过去活动']],
  dictation:['听写“公交”的德语单数，不写冠词。','Bus','mit dem Bus 中 Bus 是公交，首字母通常大写。'],
 },
 'coach-de-a2-4':{
  segments:[['Guten Morgen, am Dienstag habe ich einen Arzttermin.','早上好，星期二我预约了看医生。'],['Deshalb kann ich erst um zehn Uhr anfangen.','所以我要到十点才能开始工作。'],['Ich kann dafür am Mittwoch länger bleiben.','我可以改为星期三多留一会儿。'],['Wäre das für Sie in Ordnung ?','这样您可以接受吗？']],
  questions:[['为什么需要调整工作安排？',['有看医生的预约','火车晚点','孩子放假'],0,'einen Arzttermin 是医疗预约，随后 Deshalb 引出调整。','理由与结果'],['星期二几点能开始？',['九点','十点','十二点'],1,'erst um zehn Uhr anfangen 表示到十点才能开始。','时间限制']],
  dictation:['听写提出延长工作时间的星期名称。','Mittwoch','am Mittwoch länger bleiben：星期三多留一会儿。'],
 },
};
// Additional comprehension points; existing question IDs and audio text remain stable.
const additionalQuestions:Record<string,Q>={
 "coach-fr-a1-3": [
  "哪件物品的价格更高？",
  [
   "本子",
   "笔",
   "两者一样贵"
  ],
  0,
  "本子是 trois euros，笔是 deux euros；三欧元高于两欧元。",
  "比较已知价格"
 ],
 "coach-fr-a1-4": [
  "说话者中午和谁一起吃饭？",
  [
   "老师",
   "一位女性朋友",
   "家人"
  ],
  1,
  "avec une amie 表示和一位女性朋友一起；不能由在家学习推断午餐同伴是家人。",
  "同行者与活动"
 ],
 "coach-fr-a2-3": [
  "两人最后约在哪里见面？",
  [
   "图书馆里面",
   "图书馆前面",
   "教室门口"
  ],
  1,
  "devant la bibliothèque 是图书馆前面；devant 不表示在建筑物里面。",
  "约定地点与介词"
 ],
 "coach-fr-a2-4": [
  "说话者能在家等到什么时候？",
  [
   "明天晚上",
   "今天上午",
   "中午"
  ],
  2,
  "Je serai chez moi jusqu’à midi 表示会在家待到中午；jusqu’à 指时间的终点。",
  "可用时间范围"
 ],
 "coach-de-a1-3": [
  "火车站在哪个地方旁边？",
  [
   "超市",
   "学校",
   "邮局"
  ],
  2,
  "neben der Post 表示邮局旁边；方向和地标需结合起来理解。",
  "地标与相对位置"
 ],
 "coach-de-a1-4": [
  "德语课几点开始？",
  [
   "七点",
   "八点",
   "下午"
  ],
  1,
  "Um acht Uhr beginnt mein Deutschkurs 说明八点开始上课；七点是起床时间。",
  "区分不同活动时间"
 ],
 "coach-de-a2-3": [
  "这次去湖边是什么时候？",
  [
   "上星期六",
   "下星期六",
   "每天早上"
  ],
  0,
  "Letzten Samstag 明确指上星期六；bin … gefahren 叙述已经发生的出行。",
  "过去时间线索"
 ],
 "coach-de-a2-4": [
  "说话者提出怎样补上工作时间？",
  [
   "星期二更早开始",
   "星期三多留一会儿",
   "取消看医生的预约"
  ],
  1,
  "dafür am Mittwoch länger bleiben 是提出的补偿安排；不是改变星期二看医生的计划。",
  "提出补偿方案"
 ]
};
for(const [id,question] of Object.entries(additionalQuestions))seeds[id].questions.push(question);
export const listeningMaterials:ListeningMaterial[]=coachLessons.map(lesson=>{
 const seed=seeds[lesson.id];if(!seed)throw new Error('Missing listening content');
 return {id:`listen-${lesson.id}`,version:additionalQuestions[lesson.id]?2:1,lessonId:lesson.id,lessonVersion:lesson.version,language:lesson.language,level:lesson.level,title:lesson.title,note:lesson.note,
  segments:seed.segments.map(([text,zh],i)=>({id:`s${i+1}`,text,zh})),
  questions:seed.questions.map(([prompt,options,answer,explanation,knowledge],i)=>({id:`listen-${lesson.id}-q${i+1}`,prompt,options,answer,explanation,knowledge})),
  dictation:{prompt:seed.dictation[0],accepted:[seed.dictation[1]],explanation:seed.dictation[2]},source:{type:'original',method:'AI-assisted',review:'not-human-reviewed',audio:'on-demand-ai-unverified'}};
});
