import type {CoachLesson} from './catalog';
import type {Practice} from './practice';
type OralSeed=[string,string,string,string[]];
const seeds:Record<string,OralSeed>={
 'coach-fr-a1-1':['新认识的同学','Bonjour ! Comment vous appelez-vous et où habitez-vous ?','你好！您叫什么名字，住在哪里？',['介绍姓名、身份和住处','补充一个与自己有关的简单细节','向对方提问']],
 'coach-fr-a1-2':['咖啡店店员','Bonjour ! Vous désirez quelle boisson ?','您好！您想要什么饮品？',['礼貌点一种饮品','说明堂食或外带','回应店员的追问']],
 'coach-fr-a1-3':['文具店店员','Bonjour ! Vous cherchez un cahier ou un stylo ?','您好！您想找本子还是笔？',['询问一件物品的价格','说出需要的物品或数量','礼貌确认选择']],
 'coach-fr-a1-4':['想了解日常安排的朋友','Qu’est-ce que vous faites le matin ?','您早上做什么？',['说明两个日常活动及时间','说出一项不做的活动','回答关于日程的追问']],
 'coach-fr-a2-1':['酒店前台','Bonjour, vous avez une réservation chez nous ?','您好，您在我们这里有预订吗？',['说明原预订和延住需求','解释变化的原因','询问是否能保留原房间并回应安排']],
 'coach-fr-a2-2':['聊周末经历的朋友','Qu’est-ce que vous avez fait le week-end dernier ?','您上周末做了什么？',['按顺序讲两件过去的事','补充天气或同行者等背景','表达感受并回答追问']],
 'coach-fr-a2-3':['一起准备报告的同学','On se retrouve mardi à dix-huit heures ?','我们星期二十八点见吗？',['说明原时间不方便的原因','提出替代日期和时间','确认地点和对方是否方便']],
 'coach-fr-a2-4':['安排维修的房东','Bonjour, quel est le problème dans votre appartement ?','您好，您的公寓有什么问题？',['说明居住问题和开始时间','礼貌请求具体帮助','提出可以上门的时间并确认安排']],
 'coach-de-a1-1':['新认识的同学','Hallo! Wie heißen Sie und wo wohnen Sie?','您好！您叫什么名字，住在哪里？',['介绍姓名和住处','介绍一名家人的身份','回答一个家庭或语言问题']],
 'coach-de-a1-2':['商店店员','Guten Tag! Suchen Sie eine Tasche?','您好！您在找包吗？',['询问物品价格','说明需要的大小或数量','确认最终选择']],
 'coach-de-a1-3':['给你指路的路人','Guten Tag! Wohin möchten Sie gehen?','您好！您想去哪里？',['询问车站的位置','确认直行和转弯方向','复述地标或步行时间']],
 'coach-de-a1-4':['了解你日程的同学','Wann stehen Sie morgens auf?','您早上什么时候起床？',['用两个时间表达说明安排','尝试使用一个可分动词','回应关于晚上活动的追问']],
 'coach-de-a2-1':['酒店前台','Guten Tag! Wann kommen Sie am Freitag an?','您好！您星期五几点到达？',['说明预订和迟到情况','确认是否可以晚入住','询问在哪里领取钥匙']],
 'coach-de-a2-2':['计划一起学习的同学','Können wir am Donnerstag zusammen lernen?','我们星期四能一起学习吗？',['解释时间冲突','提出另一个日期和时间','确认学习地点']],
 'coach-de-a2-3':['询问出行经历的朋友','Was haben Sie letzten Samstag gemacht?','您上星期六做了什么？',['用过去表达讲一次出行','说明同行者和两项活动','说明回家或结束的原因']],
 'coach-de-a2-4':['与你协调排班的负责人','Guten Morgen! Möchten Sie Ihre Arbeitszeit ändern?','早上好！您想调整工作时间吗？',['说明希望调整的日期和时间','给出原因，可使用虚构信息','提出补偿安排并礼貌确认']],
};
export function lessonPractice(l:CoachLesson,attemptId:string):Practice{
 const s=seeds[l.id];if(!s)throw new Error('Missing lesson oral task');
 return {id:null,version:l.version,language:l.language,level:l.level,practiceType:'lesson',topic:l.title,lessonId:l.id,lessonAttemptId:attemptId,maxTurns:12,title:'本课开口 · '+l.title,role:s[0],goal:l.objective,tasks:s[3],opening:s[1],translation:s[2],support:l.phrases.map(p=>p.target),source:l.source};
}
