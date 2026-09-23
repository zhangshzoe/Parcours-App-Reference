import {a1Lessons} from './curriculum-a1';
import {b2Lessons} from './curriculum-b2';
import {c1Lessons} from './curriculum-c1';
import {c2Lessons} from './curriculum-c2';
import {scaledLessons} from './curriculum-scale';
import {englishLessons,germanLessons} from './curriculum-multilingual';
import {japaneseLessons} from './curriculum-japanese';
import {expandCoursesToHundred} from './course-expansion';
import type {LearningLanguage} from './languages';
export type Word={id:string;fr:string;pos:string;zh:string};
export type Lesson={id:string;language?:LearningLanguage;learnerSpeaker?:string;topic:string;level:string;title:string;fr:string;goal:string;minutes:number;dialogue:{speaker:string;fr:string;zh:string}[];words:Word[];grammar:{title:string;explanation:string;example:string;translation:string;question:string;options:string[];answer:number;why:string};quiz:{question:string;options:string[];answer:number;why:string};readingTask?:{prompt:string;answer:string};writing:{prompt:string;example:string;checklist?:string[]}};
export const topics=[
  {
    "id": "daily",
    "title": "日常交流",
    "fr": "Les petits échanges",
    "desc": "从自我介绍到街角咖啡馆",
    "icon": "Coffee",
    "color": "blue"
  },
  {
    "id": "food",
    "title": "餐饮与购物",
    "fr": "À table et en ville",
    "desc": "说清需求，做出自己的选择",
    "icon": "ShoppingBag",
    "color": "red"
  },
  {
    "id": "travel",
    "title": "旅行与出行",
    "fr": "Prendre le large",
    "desc": "问路、订房与应对意外",
    "icon": "Train",
    "color": "teal"
  },
  {
    "id": "home",
    "title": "住房与生活",
    "fr": "Un nouveau chez-soi",
    "desc": "找到住处，处理生活小事",
    "icon": "House",
    "color": "gold"
  },
  {
    "id": "work",
    "title": "学习与工作",
    "fr": "Apprendre et travailler",
    "desc": "询问课程、安排与合作",
    "icon": "GraduationCap",
    "color": "blue"
  },
  {
    "id": "stories",
    "title": "讲述经历",
    "fr": "Les histoires de la vie",
    "desc": "用过去时串起一段故事",
    "icon": "BookOpen",
    "color": "red"
  },
  {
    "id": "social",
    "title": "社交与计划",
    "fr": "On se retrouve ?",
    "desc": "邀请、建议与未来打算",
    "icon": "Users",
    "color": "teal"
  },
  {
    "id": "opinions",
    "title": "观点与协商",
    "fr": "Et vous, qu’en pensez-vous ?",
    "desc": "解释理由，商量解决方案",
    "icon": "MessagesSquare",
    "color": "gold"
  }
];
const originalLessons:Lesson[]=[
  {
    "id": "lesson-01",
    "topic": "daily",
    "level": "A2",
    "title": "一杯咖啡的开始",
    "fr": "Un café, s’il vous plaît.",
    "goal": "礼貌地点单，询问堂食或外带。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Serveuse",
        "fr": "Bonjour ! Vous désirez ?",
        "zh": "您好！您想要什么？"
      },
      {
        "speaker": "Vous",
        "fr": "Bonjour, je voudrais un café et un croissant, s’il vous plaît.",
        "zh": "您好，我想要一杯咖啡和一个羊角面包。"
      },
      {
        "speaker": "Serveuse",
        "fr": "Sur place ou à emporter ?",
        "zh": "在这里用，还是外带？"
      },
      {
        "speaker": "Vous",
        "fr": "Sur place. Ça fait combien ?",
        "zh": "在这里用。一共多少钱？"
      },
      {
        "speaker": "Serveuse",
        "fr": "Cinq euros cinquante.",
        "zh": "五欧元五十分。"
      },
      {
        "speaker": "Vous",
        "fr": "Voilà. Merci beaucoup !",
        "zh": "给您。非常感谢！"
      }
    ],
    "words": [
      {
        "id": "lesson-01-word-1",
        "fr": "un café",
        "pos": "n. m.",
        "zh": "咖啡"
      },
      {
        "id": "lesson-01-word-2",
        "fr": "un croissant",
        "pos": "n. m.",
        "zh": "羊角面包"
      },
      {
        "id": "lesson-01-word-3",
        "fr": "à emporter",
        "pos": "loc.",
        "zh": "外带"
      }
    ],
    "grammar": {
      "title": "je voudrais",
      "explanation": "je voudrais 是礼貌表达“我想要”的常用形式，后面可接名词或动词不定式。",
      "example": "Je voudrais un thé, s’il vous plaît.",
      "translation": "我想要一杯茶，谢谢。",
      "question": "礼貌地说“我想要一杯茶”。",
      "options": [
        "Je voudrais un thé.",
        "Je voudrait un thé.",
        "Je vouloir un thé."
      ],
      "answer": 0,
      "why": "je 对应 voudrais；voudrait 对应 il / elle。"
    },
    "quiz": {
      "question": "La commande est à emporter ?",
      "options": [
        "Oui, à emporter.",
        "Non, sur place.",
        "Ce n’est pas indiqué."
      ],
      "answer": 1,
      "why": "顾客说的是 « Sur place »，表示在店内享用。"
    },
    "writing": {
      "prompt": "给朋友写一条消息：说说你在哪里、点了什么、一共多少钱。",
      "example": "Salut Léa ! Je suis dans un petit café près de la gare. Je prends un café et un croissant. Ça coûte cinq euros cinquante. Tu veux me rejoindre ?"
    }
  },
  {
    "id": "lesson-02",
    "topic": "daily",
    "level": "A2",
    "title": "认识一位新朋友",
    "fr": "Enchanté de faire votre connaissance.",
    "goal": "介绍自己的城市、工作与兴趣。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Camille",
        "fr": "Bonjour, vous êtes nouveau dans le cours ?",
        "zh": "您好，您是班里的新同学吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui, je m’appelle Lin. Je viens de Shanghai.",
        "zh": "是的，我叫林，来自上海。"
      },
      {
        "speaker": "Camille",
        "fr": "Vous travaillez ou vous êtes étudiant ?",
        "zh": "您在工作还是在上学？"
      },
      {
        "speaker": "Vous",
        "fr": "Je suis étudiante et j’apprends le français depuis six mois.",
        "zh": "我是学生，学法语已经六个月了。"
      },
      {
        "speaker": "Camille",
        "fr": "Qu’est-ce que vous aimez faire ?",
        "zh": "您喜欢做什么？"
      },
      {
        "speaker": "Vous",
        "fr": "J’aime lire et faire du vélo.",
        "zh": "我喜欢阅读和骑自行车。"
      }
    ],
    "words": [
      {
        "id": "lesson-02-word-1",
        "fr": "une étudiante",
        "pos": "n. f.",
        "zh": "女学生"
      },
      {
        "id": "lesson-02-word-2",
        "fr": "depuis",
        "pos": "prép.",
        "zh": "自……以来"
      },
      {
        "id": "lesson-02-word-3",
        "fr": "faire du vélo",
        "pos": "loc.",
        "zh": "骑自行车"
      }
    ],
    "grammar": {
      "title": "depuis + 现在时",
      "explanation": "描述从过去开始、现在仍在持续的事情，可以用现在时配合 depuis。",
      "example": "J’habite ici depuis deux ans.",
      "translation": "我住在这里两年了。",
      "question": "这位学生仍在学法语，选合适的表达。",
      "options": [
        "J’apprends depuis six mois.",
        "J’ai appris dans six mois.",
        "J’apprends il y a six mois."
      ],
      "answer": 0,
      "why": "持续至今的动作可用现在时 + depuis + 时长。"
    },
    "quiz": {
      "question": "Depuis combien de temps Lin apprend-elle le français ?",
      "options": [
        "Deux ans.",
        "Six mois.",
        "Trois semaines."
      ],
      "answer": 1,
      "why": "对话中说 « depuis six mois »，即六个月。"
    },
    "writing": {
      "prompt": "写一段自我介绍：姓名、来自哪里、目前的学习或工作、一个爱好。",
      "example": "Bonjour ! Je m’appelle Lin et je viens de Shanghai. Je suis étudiante. J’apprends le français depuis six mois parce que j’aime les langues. Pendant mon temps libre, j’aime lire et faire du vélo."
    }
  },
  {
    "id": "lesson-03",
    "topic": "daily",
    "level": "A2",
    "title": "我的一天",
    "fr": "Une journée bien remplie.",
    "goal": "说明日常作息和发生的先后顺序。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Paul",
        "fr": "Tu te lèves à quelle heure ?",
        "zh": "你几点起床？"
      },
      {
        "speaker": "Vous",
        "fr": "Je me lève à sept heures. Ensuite, je prends le petit-déjeuner.",
        "zh": "我七点起床。然后吃早饭。"
      },
      {
        "speaker": "Paul",
        "fr": "Tu vas au travail en voiture ?",
        "zh": "你开车去上班吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Non, je prends le métro. Je commence à neuf heures.",
        "zh": "不，我坐地铁，九点开始工作。"
      },
      {
        "speaker": "Paul",
        "fr": "Et le soir ?",
        "zh": "那晚上呢？"
      },
      {
        "speaker": "Vous",
        "fr": "Je rentre vers dix-huit heures et je prépare le dîner.",
        "zh": "我十八点左右回家，然后准备晚饭。"
      }
    ],
    "words": [
      {
        "id": "lesson-03-word-1",
        "fr": "se lever",
        "pos": "v. pron.",
        "zh": "起床"
      },
      {
        "id": "lesson-03-word-2",
        "fr": "ensuite",
        "pos": "adv.",
        "zh": "然后"
      },
      {
        "id": "lesson-03-word-3",
        "fr": "vers",
        "pos": "prép.",
        "zh": "大约；朝向"
      }
    ],
    "grammar": {
      "title": "自反动词",
      "explanation": "se lever 随主语变化：je me lève、tu te lèves、nous nous levons。",
      "example": "Je me lève à sept heures.",
      "translation": "我七点起床。",
      "question": "选择正确的“我们七点起床”。",
      "options": [
        "Nous se levons à sept heures.",
        "Nous nous levons à sept heures.",
        "Nous nous levez à sept heures."
      ],
      "answer": 1,
      "why": "nous 对应自反代词 nous，动词变位为 levons。"
    },
    "quiz": {
      "question": "Comment cette personne va-t-elle au travail ?",
      "options": [
        "En voiture.",
        "À vélo.",
        "En métro."
      ],
      "answer": 2,
      "why": "« Je prends le métro » 表示乘地铁。"
    },
    "writing": {
      "prompt": "用 d’abord、ensuite、le soir 描述你平常的一天。",
      "example": "D’abord, je me lève à sept heures et je prends mon petit-déjeuner. Ensuite, je vais au travail en métro. Je déjeune avec mes collègues. Le soir, je prépare le dîner et je lis un peu avant de dormir."
    }
  },
  {
    "id": "lesson-04",
    "topic": "food",
    "level": "A2",
    "title": "在餐厅说清需求",
    "fr": "Une table pour deux.",
    "goal": "预订座位并表达饮食限制。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Serveur",
        "fr": "Bonsoir, vous avez réservé ?",
        "zh": "晚上好，您预订了吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui, une table pour deux au nom de Lin.",
        "zh": "是的，以林的名字订了两人桌。"
      },
      {
        "speaker": "Serveur",
        "fr": "Voici la carte. Vous avez choisi ?",
        "zh": "这是菜单。您选好了吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Est-ce qu’il y a des plats sans viande ?",
        "zh": "有不含肉的菜吗？"
      },
      {
        "speaker": "Serveur",
        "fr": "Oui, les pâtes aux légumes.",
        "zh": "有，蔬菜意面。"
      },
      {
        "speaker": "Vous",
        "fr": "Très bien. Je vais prendre ça.",
        "zh": "很好，我就要这个。"
      }
    ],
    "words": [
      {
        "id": "lesson-04-word-1",
        "fr": "réserver",
        "pos": "v.",
        "zh": "预订"
      },
      {
        "id": "lesson-04-word-2",
        "fr": "la carte",
        "pos": "n. f.",
        "zh": "菜单"
      },
      {
        "id": "lesson-04-word-3",
        "fr": "sans viande",
        "pos": "loc.",
        "zh": "不含肉"
      }
    ],
    "grammar": {
      "title": "sans + 名词",
      "explanation": "sans 表示“没有、不含”，常用于表达饮食需求：sans sucre、sans lait。",
      "example": "Un café sans sucre, s’il vous plaît.",
      "translation": "请给我一杯不加糖的咖啡。",
      "question": "表达“不含肉的菜”。",
      "options": [
        "Un plat avec viande.",
        "Un plat sans viande.",
        "Un plat sous viande."
      ],
      "answer": 1,
      "why": "sans 表示不含；avec 表示含有。"
    },
    "quiz": {
      "question": "Pour combien de personnes la table est-elle réservée ?",
      "options": [
        "Deux.",
        "Trois.",
        "Quatre."
      ],
      "answer": 0,
      "why": "« une table pour deux » 即两人桌。"
    },
    "writing": {
      "prompt": "写一条预订消息，包含人数、时间和一个饮食需求。",
      "example": "Bonjour, je voudrais réserver une table pour deux personnes samedi à dix-neuf heures. Une personne ne mange pas de viande. Avez-vous des plats végétariens ? Merci beaucoup pour votre réponse."
    }
  },
  {
    "id": "lesson-05",
    "topic": "food",
    "level": "A2",
    "title": "逛一逛市场",
    "fr": "Au marché du quartier.",
    "goal": "询问价格，用数量购买食物。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Marchand",
        "fr": "Bonjour ! Les pommes sont à trois euros le kilo.",
        "zh": "您好！苹果每公斤三欧元。"
      },
      {
        "speaker": "Vous",
        "fr": "J’en prends un kilo, s’il vous plaît.",
        "zh": "请给我一公斤。"
      },
      {
        "speaker": "Marchand",
        "fr": "Et avec ceci ?",
        "zh": "还需要别的吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Deux cents grammes de fromage. Il est produit ici ?",
        "zh": "两百克奶酪。是这里生产的吗？"
      },
      {
        "speaker": "Marchand",
        "fr": "Oui, dans le village voisin.",
        "zh": "是的，在邻近的村庄生产。"
      },
      {
        "speaker": "Vous",
        "fr": "Parfait, merci !",
        "zh": "很好，谢谢！"
      }
    ],
    "words": [
      {
        "id": "lesson-05-word-1",
        "fr": "un kilo",
        "pos": "n. m.",
        "zh": "一公斤"
      },
      {
        "id": "lesson-05-word-2",
        "fr": "du fromage",
        "pos": "n. m.",
        "zh": "奶酪"
      },
      {
        "id": "lesson-05-word-3",
        "fr": "en prendre",
        "pos": "loc.",
        "zh": "买一些；取一些"
      }
    ],
    "grammar": {
      "title": "数量 + de",
      "explanation": "在具体数量后通常用 de：un kilo de pommes、deux cents grammes de fromage。",
      "example": "Un kilo de pommes.",
      "translation": "一公斤苹果。",
      "question": "补全：deux cents grammes ___ fromage。",
      "options": [
        "du",
        "des",
        "de"
      ],
      "answer": 2,
      "why": "具体数量后用 de，构成 grammes de fromage。"
    },
    "quiz": {
      "question": "Combien coûtent les pommes ?",
      "options": [
        "Deux euros le kilo.",
        "Trois euros le kilo.",
        "Cinq euros le kilo."
      ],
      "answer": 1,
      "why": "卖家说苹果是 « trois euros le kilo »。"
    },
    "writing": {
      "prompt": "给室友写购物消息：买了两种食物，说明数量和一种食物的价格。",
      "example": "Salut ! Je suis au marché. J’achète un kilo de pommes à trois euros et deux cents grammes de fromage. Le fromage vient du village voisin. Est-ce qu’il nous faut aussi du pain ?"
    }
  },
  {
    "id": "lesson-06",
    "topic": "food",
    "level": "A2+",
    "title": "换一个合适的尺码",
    "fr": "Vous avez une autre taille ?",
    "goal": "说明商品的问题，询问换货。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour, j’ai acheté cette veste hier, mais elle est trop petite.",
        "zh": "您好，我昨天买了这件外套，但它太小了。"
      },
      {
        "speaker": "Vendeuse",
        "fr": "Vous avez le ticket de caisse ?",
        "zh": "您有收据吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui, le voici. Je peux l’échanger ?",
        "zh": "有，在这里。我可以换货吗？"
      },
      {
        "speaker": "Vendeuse",
        "fr": "Bien sûr. Vous voulez essayer la taille au-dessus ?",
        "zh": "当然，您想试大一号吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui. Cette taille est plus confortable.",
        "zh": "好。这个尺码更舒服。"
      }
    ],
    "words": [
      {
        "id": "lesson-06-word-1",
        "fr": "une veste",
        "pos": "n. f.",
        "zh": "外套"
      },
      {
        "id": "lesson-06-word-2",
        "fr": "échanger",
        "pos": "v.",
        "zh": "换货"
      },
      {
        "id": "lesson-06-word-3",
        "fr": "le ticket de caisse",
        "pos": "n. m.",
        "zh": "购物收据"
      }
    ],
    "grammar": {
      "title": "比较级",
      "explanation": "比较形容词可用 plus / moins / aussi + 形容词 + que。",
      "example": "Cette veste est plus grande que l’autre.",
      "translation": "这件外套比另一件大。",
      "question": "补全：Cette veste est ___ grande que l’autre。",
      "options": [
        "plus",
        "beaucoup",
        "très"
      ],
      "answer": 0,
      "why": "plus ... que 构成比较级；très 后不能这样直接接 que。"
    },
    "quiz": {
      "question": "Pourquoi la personne veut-elle échanger la veste ?",
      "options": [
        "Elle est trop chère.",
        "Elle est trop petite.",
        "Elle est abîmée."
      ],
      "answer": 1,
      "why": "顾客说 « elle est trop petite »，表示太小了。"
    },
    "writing": {
      "prompt": "给商店写一封简短邮件：说明购买日期、问题和希望换货的请求。",
      "example": "Bonjour, j’ai acheté une veste dans votre magasin hier. Malheureusement, elle est trop petite. J’ai gardé le ticket de caisse. Serait-il possible de l’échanger contre une taille plus grande ? Merci pour votre aide."
    }
  },
  {
    "id": "lesson-07",
    "topic": "travel",
    "level": "A2",
    "title": "找到去车站的路",
    "fr": "C’est loin d’ici ?",
    "goal": "理解方向，确认路线。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Excusez-moi, comment aller à la gare ?",
        "zh": "打扰了，去火车站怎么走？"
      },
      {
        "speaker": "Passante",
        "fr": "Continuez tout droit, puis tournez à gauche après la pharmacie.",
        "zh": "一直走，然后在药店后左转。"
      },
      {
        "speaker": "Vous",
        "fr": "C’est loin d’ici ?",
        "zh": "离这里远吗？"
      },
      {
        "speaker": "Passante",
        "fr": "Non, environ dix minutes à pied. La gare est en face du parc.",
        "zh": "不远，步行大约十分钟。车站就在公园对面。"
      },
      {
        "speaker": "Vous",
        "fr": "Donc, à gauche après la pharmacie. Merci !",
        "zh": "所以，在药店后左转。谢谢！"
      }
    ],
    "words": [
      {
        "id": "lesson-07-word-1",
        "fr": "tout droit",
        "pos": "loc.",
        "zh": "一直向前"
      },
      {
        "id": "lesson-07-word-2",
        "fr": "en face de",
        "pos": "loc.",
        "zh": "在……对面"
      },
      {
        "id": "lesson-07-word-3",
        "fr": "à pied",
        "pos": "loc.",
        "zh": "步行"
      }
    ],
    "grammar": {
      "title": "指路的命令式",
      "explanation": "对陌生人指路常用 vous 形式的命令式，省略主语：continuez、tournez、prenez。",
      "example": "Tournez à gauche.",
      "translation": "向左转。",
      "question": "选择礼貌指路的句子。",
      "options": [
        "Vous tournez-vous à gauche.",
        "Tournez à gauche.",
        "Tourner-vous à gauche."
      ],
      "answer": 1,
      "why": "命令式省略主语，tourner 的 vous 形式为 tournez。"
    },
    "quiz": {
      "question": "Où se trouve la gare ?",
      "options": [
        "Derrière l’école.",
        "En face du parc.",
        "À côté du cinéma."
      ],
      "answer": 1,
      "why": "路人明确说车站 « en face du parc »。"
    },
    "writing": {
      "prompt": "给朋友写一段从你家到附近车站或商店的路线。",
      "example": "Pour aller à la gare, continue tout droit jusqu’à la pharmacie. Ensuite, tourne à gauche. La gare se trouve en face du parc. Ce n’est pas loin : il faut environ dix minutes à pied."
    }
  },
  {
    "id": "lesson-08",
    "topic": "travel",
    "level": "A2+",
    "title": "抵达酒店",
    "fr": "J’ai une réservation.",
    "goal": "确认订房、入住时间和服务。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour, j’ai réservé une chambre pour deux nuits.",
        "zh": "您好，我预订了一个房间，住两晚。"
      },
      {
        "speaker": "Réceptionniste",
        "fr": "À quel nom, s’il vous plaît ?",
        "zh": "请问以什么名字预订的？"
      },
      {
        "speaker": "Vous",
        "fr": "Au nom de Lin. Le petit-déjeuner est compris ?",
        "zh": "以林的名字。含早餐吗？"
      },
      {
        "speaker": "Réceptionniste",
        "fr": "Oui, de sept heures à dix heures. Voici votre clé.",
        "zh": "含早餐，七点到十点供应。这是您的钥匙。"
      },
      {
        "speaker": "Vous",
        "fr": "À quelle heure faut-il libérer la chambre ?",
        "zh": "几点前需要退房？"
      },
      {
        "speaker": "Réceptionniste",
        "fr": "Avant onze heures.",
        "zh": "十一点前。"
      }
    ],
    "words": [
      {
        "id": "lesson-08-word-1",
        "fr": "une chambre",
        "pos": "n. f.",
        "zh": "房间"
      },
      {
        "id": "lesson-08-word-2",
        "fr": "compris",
        "pos": "adj.",
        "zh": "包含在内的"
      },
      {
        "id": "lesson-08-word-3",
        "fr": "libérer la chambre",
        "pos": "loc.",
        "zh": "退房"
      }
    ],
    "grammar": {
      "title": "il faut + 不定式",
      "explanation": "il faut 表达需要或必须，后面接动词不定式。",
      "example": "Il faut partir avant onze heures.",
      "translation": "必须在十一点前离开。",
      "question": "补全：Il faut ___ la chambre avant onze heures。",
      "options": [
        "libérez",
        "libérer",
        "libéré"
      ],
      "answer": 1,
      "why": "il faut 后直接接不定式 libérer。"
    },
    "quiz": {
      "question": "À quelle heure se termine le petit-déjeuner ?",
      "options": [
        "À sept heures.",
        "À dix heures.",
        "À onze heures."
      ],
      "answer": 1,
      "why": "早餐供应时段是七点到十点；十一点是退房截止时间。"
    },
    "writing": {
      "prompt": "给酒店写入住前的询问信，包含入住晚数和两个服务问题。",
      "example": "Bonjour, j’ai une réservation pour deux nuits au nom de Lin. Pourriez-vous me confirmer si le petit-déjeuner est compris ? À quelle heure puis-je arriver ? Merci d’avance pour votre réponse."
    }
  },
  {
    "id": "lesson-09",
    "topic": "travel",
    "level": "B1",
    "title": "火车晚点之后",
    "fr": "Mon train a du retard.",
    "goal": "解释行程问题并确认替代方案。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Annonce",
        "fr": "Le train pour Lyon aura trente minutes de retard.",
        "zh": "开往里昂的火车将晚点三十分钟。"
      },
      {
        "speaker": "Vous",
        "fr": "Excusez-moi, je vais manquer ma correspondance. Que puis-je faire ?",
        "zh": "打扰了，我将赶不上换乘。我该怎么办？"
      },
      {
        "speaker": "Agent",
        "fr": "Vous pouvez prendre le train de quinze heures dix.",
        "zh": "您可以乘坐十五点十分的火车。"
      },
      {
        "speaker": "Vous",
        "fr": "Est-ce que mon billet reste valable ?",
        "zh": "我的车票仍然有效吗？"
      },
      {
        "speaker": "Agent",
        "fr": "Oui, sans supplément. Le départ est au quai quatre.",
        "zh": "是的，不需补差价。从四号站台出发。"
      },
      {
        "speaker": "Vous",
        "fr": "Merci, je vais prévenir mon amie.",
        "zh": "谢谢，我去通知我的朋友。"
      }
    ],
    "words": [
      {
        "id": "lesson-09-word-1",
        "fr": "du retard",
        "pos": "n. m.",
        "zh": "延误"
      },
      {
        "id": "lesson-09-word-2",
        "fr": "une correspondance",
        "pos": "n. f.",
        "zh": "换乘；联程"
      },
      {
        "id": "lesson-09-word-3",
        "fr": "valable",
        "pos": "adj.",
        "zh": "有效的"
      }
    ],
    "grammar": {
      "title": "最近将来时",
      "explanation": "aller 的现在时 + 不定式，表达即将发生的事或已有的打算。",
      "example": "Je vais prévenir mon amie.",
      "translation": "我要通知我的朋友。",
      "question": "补全：Nous ___ prendre le prochain train。",
      "options": [
        "allons",
        "allez",
        "vont"
      ],
      "answer": 0,
      "why": "nous 对应 allons，后接不定式 prendre。"
    },
    "quiz": {
      "question": "Faut-il payer un supplément ?",
      "options": [
        "Oui, dix euros.",
        "Non.",
        "L’agent ne le sait pas."
      ],
      "answer": 1,
      "why": "« sans supplément » 表示没有额外费用。"
    },
    "writing": {
      "prompt": "给等你的朋友写消息，解释延误、你采取的办法，并表达歉意。",
      "example": "Salut Léa, mon train a trente minutes de retard et je vais manquer ma correspondance. Un agent m’a proposé le train de quinze heures dix. Mon billet reste valable. Je suis désolée de te faire attendre. Je te préviens dès que j’arrive."
    }
  },
  {
    "id": "lesson-10",
    "topic": "home",
    "level": "A2+",
    "title": "寻找新住处",
    "fr": "Un appartement à visiter.",
    "goal": "读懂租房信息，询问租金和位置。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour, votre appartement est-il toujours disponible ?",
        "zh": "您好，您的公寓还可以租吗？"
      },
      {
        "speaker": "Propriétaire",
        "fr": "Oui. Il y a deux pièces et un balcon.",
        "zh": "可以。有两个房间和一个阳台。"
      },
      {
        "speaker": "Vous",
        "fr": "Quel est le loyer, charges comprises ?",
        "zh": "包括杂费的房租是多少？"
      },
      {
        "speaker": "Propriétaire",
        "fr": "Huit cents euros par mois. Le métro est à cinq minutes.",
        "zh": "每月八百欧元。地铁站五分钟就到。"
      },
      {
        "speaker": "Vous",
        "fr": "Pourrais-je le visiter samedi matin ?",
        "zh": "我能在周六上午看房吗？"
      }
    ],
    "words": [
      {
        "id": "lesson-10-word-1",
        "fr": "le loyer",
        "pos": "n. m.",
        "zh": "房租"
      },
      {
        "id": "lesson-10-word-2",
        "fr": "les charges",
        "pos": "n. f. pl.",
        "zh": "住房杂费"
      },
      {
        "id": "lesson-10-word-3",
        "fr": "disponible",
        "pos": "adj.",
        "zh": "可用的；空闲的"
      }
    ],
    "grammar": {
      "title": "礼貌请求 pourrais-je",
      "explanation": "用条件式 pouvoir 可让请求更委婉：je pourrais、pourriez-vous。",
      "example": "Pourrais-je visiter l’appartement ?",
      "translation": "我能看看公寓吗？",
      "question": "向房东礼貌询问：___ me donner l’adresse ?",
      "options": [
        "Pouvoir-vous",
        "Pourriez-vous",
        "Pourriez-tu"
      ],
      "answer": 1,
      "why": "vous 的条件式为 pourriez，倒装疑问写作 pourriez-vous。"
    },
    "quiz": {
      "question": "Quel est le loyer mensuel ?",
      "options": [
        "Six cents euros.",
        "Sept cents euros.",
        "Huit cents euros."
      ],
      "answer": 2,
      "why": "房东报价每月八百欧元，包含杂费。"
    },
    "writing": {
      "prompt": "写一条看房请求，说明你对房间的需求、预算和可看房时间。",
      "example": "Bonjour, je cherche un appartement avec deux pièces près du métro. Mon budget est de huit cents euros par mois, charges comprises. Votre logement m’intéresse. Serait-il possible de le visiter samedi matin ?"
    }
  },
  {
    "id": "lesson-11",
    "topic": "home",
    "level": "A2+",
    "title": "和室友商量家务",
    "fr": "On partage les tâches ?",
    "goal": "分配家务，提出可接受的安排。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Nora",
        "fr": "La cuisine est un peu sale. On fait le ménage ce week-end ?",
        "zh": "厨房有点脏。我们周末打扫吗？"
      },
      {
        "speaker": "Vous",
        "fr": "D’accord. Je peux nettoyer la cuisine samedi matin.",
        "zh": "好。我周六上午可以打扫厨房。"
      },
      {
        "speaker": "Nora",
        "fr": "Moi, je m’occupe de la salle de bains.",
        "zh": "我负责浴室。"
      },
      {
        "speaker": "Vous",
        "fr": "Et pour les courses, on y va ensemble ?",
        "zh": "买东西呢，我们一起去吗？"
      },
      {
        "speaker": "Nora",
        "fr": "Oui, après le déjeuner. On partage les frais.",
        "zh": "好，午饭后去。费用平摊。"
      }
    ],
    "words": [
      {
        "id": "lesson-11-word-1",
        "fr": "faire le ménage",
        "pos": "loc.",
        "zh": "打扫卫生"
      },
      {
        "id": "lesson-11-word-2",
        "fr": "s’occuper de",
        "pos": "loc.",
        "zh": "负责；照顾"
      },
      {
        "id": "lesson-11-word-3",
        "fr": "partager",
        "pos": "v.",
        "zh": "分享；分摊"
      }
    ],
    "grammar": {
      "title": "代词 y",
      "explanation": "y 常替代 à + 地点或表示地点的短语，通常放在变位动词之前。",
      "example": "On va au supermarché. On y va ensemble.",
      "translation": "我们去超市。我们一起去那里。",
      "question": "用 y 替换 au supermarché：Nous ___ allons。",
      "options": [
        "en",
        "y",
        "le"
      ],
      "answer": 1,
      "why": "这里替代地点 au supermarché，使用 y。"
    },
    "quiz": {
      "question": "Qui va nettoyer la cuisine ?",
      "options": [
        "Nora.",
        "La personne qui répond à Nora.",
        "Personne."
      ],
      "answer": 1,
      "why": "对话中 Vous 表示学习者角色，该角色说会打扫厨房。"
    },
    "writing": {
      "prompt": "给室友写一条消息，提议一个时间并说明两个人的家务分工。",
      "example": "Salut Nora ! On fait le ménage samedi matin ? Je peux nettoyer la cuisine et tu peux t’occuper de la salle de bains. Ensuite, on pourrait faire les courses ensemble. Dis-moi si cet horaire te convient."
    }
  },
  {
    "id": "lesson-12",
    "topic": "home",
    "level": "B1",
    "title": "报修生活小故障",
    "fr": "Le chauffage ne fonctionne plus.",
    "goal": "描述故障持续多久并约定处理时间。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour, le chauffage ne fonctionne plus depuis hier soir.",
        "zh": "您好，从昨晚开始暖气就不工作了。"
      },
      {
        "speaker": "Propriétaire",
        "fr": "Vous avez vérifié le thermostat ?",
        "zh": "您检查过温控器了吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui, mais il fait toujours froid. Pourriez-vous envoyer quelqu’un ?",
        "zh": "检查过，但还是冷。您能派人来吗？"
      },
      {
        "speaker": "Propriétaire",
        "fr": "Un technicien peut venir demain entre neuf heures et midi.",
        "zh": "技师明天九点到十二点之间可以来。"
      },
      {
        "speaker": "Vous",
        "fr": "Je serai chez moi jusqu’à onze heures. Est-ce possible avant ?",
        "zh": "我十一点前会在家。能在那之前来吗？"
      }
    ],
    "words": [
      {
        "id": "lesson-12-word-1",
        "fr": "le chauffage",
        "pos": "n. m.",
        "zh": "暖气"
      },
      {
        "id": "lesson-12-word-2",
        "fr": "ne…plus",
        "pos": "loc.",
        "zh": "不再"
      },
      {
        "id": "lesson-12-word-3",
        "fr": "un technicien",
        "pos": "n. m.",
        "zh": "技师"
      }
    ],
    "grammar": {
      "title": "ne ... plus",
      "explanation": "ne ... plus 表示原来存在的状态或行为不再继续，和 ne ... pas 的单纯否定不同。",
      "example": "Le chauffage ne fonctionne plus.",
      "translation": "暖气不再运转了。",
      "question": "表达“热水不再流出来了”。",
      "options": [
        "L’eau chaude ne coule plus.",
        "L’eau chaude coule encore.",
        "L’eau chaude coule toujours."
      ],
      "answer": 0,
      "why": "ne ... plus 表示之前有热水，现在不再有。"
    },
    "quiz": {
      "question": "Jusqu’à quelle heure la personne sera-t-elle chez elle ?",
      "options": [
        "Neuf heures.",
        "Onze heures.",
        "Midi."
      ],
      "answer": 1,
      "why": "学习者角色说 « jusqu’à onze heures »。"
    },
    "writing": {
      "prompt": "给房东写报修邮件，说明问题、开始时间和你方便在家的时间。",
      "example": "Bonjour, je vous écris parce que le chauffage ne fonctionne plus depuis hier soir. J’ai vérifié le thermostat, mais le problème continue. Pourriez-vous organiser une réparation ? Je serai chez moi demain matin jusqu’à onze heures. Merci pour votre aide."
    }
  },
  {
    "id": "lesson-13",
    "topic": "work",
    "level": "A2+",
    "title": "选一门适合的课",
    "fr": "Quel cours me conseillez-vous ?",
    "goal": "询问课程时间和学习重点。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour, je cherche un cours de français le soir.",
        "zh": "您好，我在找晚上的法语课。"
      },
      {
        "speaker": "Conseillère",
        "fr": "Nous avons un cours A2 le mardi et le jeudi, de dix-neuf à vingt et une heures.",
        "zh": "我们有周二和周四的 A2 课，十九点到二十一点。"
      },
      {
        "speaker": "Vous",
        "fr": "Est-ce qu’on pratique beaucoup l’oral ?",
        "zh": "会有很多口语练习吗？"
      },
      {
        "speaker": "Conseillère",
        "fr": "Oui, vous travaillez souvent en petits groupes.",
        "zh": "是的，经常以小组形式练习。"
      },
      {
        "speaker": "Vous",
        "fr": "Très bien, je voudrais faire un cours d’essai.",
        "zh": "很好，我想上一节试听课。"
      }
    ],
    "words": [
      {
        "id": "lesson-13-word-1",
        "fr": "un cours d’essai",
        "pos": "n. m.",
        "zh": "试听课"
      },
      {
        "id": "lesson-13-word-2",
        "fr": "l’oral",
        "pos": "n. m.",
        "zh": "口语"
      },
      {
        "id": "lesson-13-word-3",
        "fr": "conseiller",
        "pos": "v.",
        "zh": "建议"
      }
    ],
    "grammar": {
      "title": "每周固定安排",
      "explanation": "星期前加 le，常表示每周重复的安排：le mardi，或 le mardi et le jeudi。",
      "example": "J’ai cours le mardi.",
      "translation": "我每周二有课。",
      "question": "« Je travaille le samedi » 通常表示：",
      "options": [
        "只在某一个周六工作。",
        "每周六工作。",
        "上周六工作过。"
      ],
      "answer": 1,
      "why": "单数星期前的 le 可表达每周重复发生的活动。"
    },
    "quiz": {
      "question": "À quelle heure commence le cours ?",
      "options": [
        "Dix-sept heures.",
        "Dix-neuf heures.",
        "Vingt et une heures."
      ],
      "answer": 1,
      "why": "课程十九点开始，二十一点结束。"
    },
    "writing": {
      "prompt": "给语言学校写咨询邮件，说明你的水平、空闲时间和最想提高的能力。",
      "example": "Bonjour, j’ai un niveau A2 en français et je voudrais améliorer mon expression orale. Je suis disponible le mardi et le jeudi soir. Proposez-vous un cours en petit groupe ? Est-il possible de faire un cours d’essai ?"
    }
  },
  {
    "id": "lesson-14",
    "topic": "work",
    "level": "A2+",
    "title": "调整一次会议",
    "fr": "On peut décaler la réunion ?",
    "goal": "解释时间冲突并提议新时间。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour Marc, je ne pourrai pas venir à la réunion de dix heures.",
        "zh": "你好，马克，我没法参加十点的会议了。"
      },
      {
        "speaker": "Marc",
        "fr": "Tu as un autre rendez-vous ?",
        "zh": "你有别的预约吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui, un rendez-vous qui risque de durer. On pourrait se voir à quatorze heures ?",
        "zh": "是的，一个可能会持续比较久的预约。我们可以十四点见吗？"
      },
      {
        "speaker": "Marc",
        "fr": "D’accord, la salle sera libre à cette heure-là.",
        "zh": "好的，那个时候会议室空着。"
      },
      {
        "speaker": "Vous",
        "fr": "Merci, je vais prévenir les autres.",
        "zh": "谢谢，我去通知其他人。"
      }
    ],
    "words": [
      {
        "id": "lesson-14-word-1",
        "fr": "décaler",
        "pos": "v.",
        "zh": "调整时间；推迟"
      },
      {
        "id": "lesson-14-word-2",
        "fr": "une réunion",
        "pos": "n. f.",
        "zh": "会议"
      },
      {
        "id": "lesson-14-word-3",
        "fr": "prévenir",
        "pos": "v.",
        "zh": "提前告知"
      }
    ],
    "grammar": {
      "title": "简单将来时",
      "explanation": "简单将来时可表达未来的安排。être 的词干为 ser-；pouvoir 为 pourr-。",
      "example": "La salle sera libre à quatorze heures.",
      "translation": "会议室十四点会空着。",
      "question": "补全：Demain, nous ___ disponibles。",
      "options": [
        "serons",
        "sommes été",
        "serez"
      ],
      "answer": 0,
      "why": "être 的简单将来时 nous 形式是 serons。"
    },
    "quiz": {
      "question": "À quelle heure aura lieu la réunion ?",
      "options": [
        "Dix heures.",
        "Midi.",
        "Quatorze heures."
      ],
      "answer": 2,
      "why": "双方同意改为十四点。"
    },
    "writing": {
      "prompt": "写一封简短邮件，解释你不能参加原定会议，提出新的时间并致谢。",
      "example": "Bonjour Marc, je suis désolée, mais je ne pourrai pas participer à la réunion de dix heures à cause d’un autre rendez-vous. Pourrions-nous la décaler à quatorze heures ? Merci pour votre compréhension."
    }
  },
  {
    "id": "lesson-15",
    "topic": "work",
    "level": "B1",
    "title": "一起完成项目",
    "fr": "Comment s’organiser ?",
    "goal": "划分任务，明确截止时间。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Emma",
        "fr": "Il faut rendre notre présentation vendredi. Comment s’organiser ?",
        "zh": "我们周五得交演示文稿。怎么安排？"
      },
      {
        "speaker": "Vous",
        "fr": "Je peux chercher les informations et préparer les graphiques.",
        "zh": "我可以找资料并制作图表。"
      },
      {
        "speaker": "Emma",
        "fr": "Très bien. Je rédigerai l’introduction et la conclusion.",
        "zh": "很好。我来写开头和结尾。"
      },
      {
        "speaker": "Vous",
        "fr": "Si on termine jeudi, on pourra répéter ensemble.",
        "zh": "如果我们周四完成，就可以一起排练。"
      },
      {
        "speaker": "Emma",
        "fr": "D’accord, retrouvons-nous jeudi à seize heures.",
        "zh": "好，我们周四十六点见。"
      }
    ],
    "words": [
      {
        "id": "lesson-15-word-1",
        "fr": "rendre",
        "pos": "v.",
        "zh": "提交；归还"
      },
      {
        "id": "lesson-15-word-2",
        "fr": "répéter",
        "pos": "v.",
        "zh": "排练；重复"
      },
      {
        "id": "lesson-15-word-3",
        "fr": "une présentation",
        "pos": "n. f.",
        "zh": "演示；报告"
      }
    ],
    "grammar": {
      "title": "si + 现在时，主句将来时",
      "explanation": "表达现实中可能发生的条件，可用 si + 现在时，结果用简单将来时。",
      "example": "Si on termine jeudi, on pourra répéter.",
      "translation": "如果周四做完，我们就能排练。",
      "question": "补全：Si tu ___ prêt, nous commencerons。",
      "options": [
        "seras",
        "es",
        "serais"
      ],
      "answer": 1,
      "why": "这个条件结构中，si 后使用现在时 es，不用将来时 seras。"
    },
    "quiz": {
      "question": "Quand faut-il rendre la présentation ?",
      "options": [
        "Jeudi matin.",
        "Jeudi après-midi.",
        "Vendredi."
      ],
      "answer": 2,
      "why": "周五是提交日，周四是计划排练的日子。"
    },
    "writing": {
      "prompt": "给组员写计划，说明你的任务、对方的任务和共同检查的时间。",
      "example": "Salut Emma, je vais chercher les informations et préparer les graphiques. Tu pourrais rédiger l’introduction et la conclusion. Si nous terminons jeudi, nous pourrons répéter ensemble à seize heures. Comme ça, nous serons prêts pour vendredi."
    }
  },
  {
    "id": "lesson-16",
    "topic": "stories",
    "level": "A2+",
    "title": "聊聊你的周末",
    "fr": "Tu as passé un bon week-end ?",
    "goal": "用复合过去时讲述已经完成的活动。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Julie",
        "fr": "Tu as fait quoi ce week-end ?",
        "zh": "你周末做了什么？"
      },
      {
        "speaker": "Vous",
        "fr": "Samedi, je suis allée au musée avec une amie.",
        "zh": "周六我和一位朋友去了博物馆。"
      },
      {
        "speaker": "Julie",
        "fr": "Vous avez aimé l’exposition ?",
        "zh": "你们喜欢那个展览吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui ! Ensuite, nous avons déjeuné dans un petit restaurant.",
        "zh": "喜欢！之后我们在一家小餐馆吃了午饭。"
      },
      {
        "speaker": "Julie",
        "fr": "Et dimanche ?",
        "zh": "周日呢？"
      },
      {
        "speaker": "Vous",
        "fr": "Je suis restée chez moi et j’ai lu un roman.",
        "zh": "我待在家里，读了一本小说。"
      }
    ],
    "words": [
      {
        "id": "lesson-16-word-1",
        "fr": "une exposition",
        "pos": "n. f.",
        "zh": "展览"
      },
      {
        "id": "lesson-16-word-2",
        "fr": "déjeuner",
        "pos": "v.",
        "zh": "吃午饭"
      },
      {
        "id": "lesson-16-word-3",
        "fr": "un roman",
        "pos": "n. m.",
        "zh": "小说"
      }
    ],
    "grammar": {
      "title": "复合过去时与 être",
      "explanation": "aller、rester 等常用动词用 être 构成复合过去时。过去分词与主语配合：elle est allée。",
      "example": "Elle est allée au musée.",
      "translation": "她去了博物馆。",
      "question": "主语是 Marie，补全：Marie est ___ au musée。",
      "options": [
        "allé",
        "allée",
        "aller"
      ],
      "answer": 1,
      "why": "être 助动词下，过去分词与阴性单数主语 Marie 配合，加 e。"
    },
    "quiz": {
      "question": "Qu’a fait cette personne dimanche ?",
      "options": [
        "Elle a visité un musée.",
        "Elle a lu chez elle.",
        "Elle a travaillé."
      ],
      "answer": 1,
      "why": "周日她待在家里读小说；参观博物馆是在周六。"
    },
    "writing": {
      "prompt": "写一段周末日记，使用至少三个过去时动词和一个时间连接词。",
      "example": "Samedi, je suis allée au musée avec une amie. Nous avons beaucoup aimé l’exposition. Ensuite, nous avons déjeuné près du musée. Dimanche, je suis restée chez moi. J’ai lu un roman et j’ai préparé un gâteau."
    }
  },
  {
    "id": "lesson-17",
    "topic": "stories",
    "level": "B1",
    "title": "一次难忘的旅行",
    "fr": "Un voyage inoubliable.",
    "goal": "区分故事背景和发生的事件。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Luc",
        "fr": "Tu te souviens de ton voyage à Marseille ?",
        "zh": "你还记得马赛之行吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui, il faisait très beau et les rues étaient animées.",
        "zh": "记得，天气很好，街上很热闹。"
      },
      {
        "speaker": "Luc",
        "fr": "Qu’est-ce qui t’a le plus marquée ?",
        "zh": "什么让你印象最深？"
      },
      {
        "speaker": "Vous",
        "fr": "Je me promenais près du port quand j’ai rencontré une vieille amie.",
        "zh": "我正在港口附近散步，突然碰到一位老朋友。"
      },
      {
        "speaker": "Luc",
        "fr": "Quelle surprise !",
        "zh": "真是惊喜！"
      },
      {
        "speaker": "Vous",
        "fr": "On a passé tout l’après-midi ensemble.",
        "zh": "我们一起度过了整个下午。"
      }
    ],
    "words": [
      {
        "id": "lesson-17-word-1",
        "fr": "se souvenir de",
        "pos": "v. pron.",
        "zh": "记得"
      },
      {
        "id": "lesson-17-word-2",
        "fr": "animé",
        "pos": "adj.",
        "zh": "热闹的"
      },
      {
        "id": "lesson-17-word-3",
        "fr": "une surprise",
        "pos": "n. f.",
        "zh": "惊喜；意外"
      }
    ],
    "grammar": {
      "title": "未完成过去时与复合过去时",
      "explanation": "未完成过去时描绘背景或进行中的动作；复合过去时常叙述推动故事的事件。",
      "example": "Je me promenais quand j’ai rencontré Luc.",
      "translation": "我正散步时遇到了卢克。",
      "question": "补全背景：Il ___ beau quand nous sommes arrivés。",
      "options": [
        "a fait",
        "faisait",
        "fera"
      ],
      "answer": 1,
      "why": "这里交代抵达时的天气背景，选择未完成过去时 faisait。"
    },
    "quiz": {
      "question": "Qui la personne a-t-elle rencontré près du port ?",
      "options": [
        "Une vieille amie.",
        "Un guide.",
        "Son professeur."
      ],
      "answer": 0,
      "why": "她在港口附近意外碰见了一位老朋友。"
    },
    "writing": {
      "prompt": "讲述一次旅行：先描述天气或环境，再写一个发生的事件和你的感受。",
      "example": "L’été dernier, je suis allée à Marseille. Il faisait beau et les rues étaient très animées. Je me promenais près du port quand j’ai rencontré une vieille amie. Nous avons passé l’après-midi ensemble. Cette rencontre m’a fait très plaisir."
    }
  },
  {
    "id": "lesson-18",
    "topic": "stories",
    "level": "B1",
    "title": "找回丢失的东西",
    "fr": "J’ai perdu mon sac.",
    "goal": "按时间顺序描述物品丢失的经过。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour, je crois que j’ai oublié mon sac dans le bus.",
        "zh": "您好，我想我把包忘在公交车上了。"
      },
      {
        "speaker": "Employée",
        "fr": "Vous pouvez le décrire ?",
        "zh": "您能描述一下吗？"
      },
      {
        "speaker": "Vous",
        "fr": "C’est un sac noir avec une petite poche rouge. Il contient un livre et mes clés.",
        "zh": "是个有红色小口袋的黑包。里面有一本书和我的钥匙。"
      },
      {
        "speaker": "Employée",
        "fr": "À quelle heure êtes-vous descendue ?",
        "zh": "您几点下车的？"
      },
      {
        "speaker": "Vous",
        "fr": "Vers dix-sept heures, à l’arrêt République.",
        "zh": "大约十七点，在 République 站。"
      },
      {
        "speaker": "Employée",
        "fr": "Laissez votre numéro. Nous vous contacterons si nous le retrouvons.",
        "zh": "留下您的号码吧。如果找到，我们会联系您。"
      }
    ],
    "words": [
      {
        "id": "lesson-18-word-1",
        "fr": "une poche",
        "pos": "n. f.",
        "zh": "口袋"
      },
      {
        "id": "lesson-18-word-2",
        "fr": "un arrêt",
        "pos": "n. m.",
        "zh": "车站；停靠点"
      },
      {
        "id": "lesson-18-word-3",
        "fr": "retrouver",
        "pos": "v.",
        "zh": "找回；再次找到"
      }
    ],
    "grammar": {
      "title": "直接宾语代词 le / la / les",
      "explanation": "用 le、la、les 替代已经提到的直接宾语。放在变位动词前；如有不定式，常放在相应不定式前。",
      "example": "Mon sac ? Je le cherche.",
      "translation": "我的包？我在找它。",
      "question": "用代词替代 mon sac：Je ___ cherche。",
      "options": [
        "lui",
        "le",
        "y"
      ],
      "answer": 1,
      "why": "chercher 是直接及物动词，阳性单数 mon sac 用 le 替代。"
    },
    "quiz": {
      "question": "De quelle couleur est le sac ?",
      "options": [
        "Rouge avec une poche noire.",
        "Noir avec une poche rouge.",
        "Entièrement bleu."
      ],
      "answer": 1,
      "why": "包是黑色的，带一个红色小口袋。"
    },
    "writing": {
      "prompt": "给失物招领处写消息，描述物品、里面的东西和最后见到它的地点时间。",
      "example": "Bonjour, j’ai oublié mon sac dans le bus cet après-midi. Je suis descendue à l’arrêt République vers dix-sept heures. Mon sac est noir avec une petite poche rouge. Il contient un livre et mes clés. Pourriez-vous me prévenir si vous le retrouvez ?"
    }
  },
  {
    "id": "lesson-19",
    "topic": "social",
    "level": "A2",
    "title": "邀请朋友见面",
    "fr": "Ça te dit de venir ?",
    "goal": "发出邀请并确认时间和地点。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Salut Léa, ça te dit de dîner chez moi samedi ?",
        "zh": "嗨，莱娅，周六来我家吃晚饭怎么样？"
      },
      {
        "speaker": "Léa",
        "fr": "Avec plaisir ! À quelle heure ?",
        "zh": "很乐意！几点？"
      },
      {
        "speaker": "Vous",
        "fr": "Vers dix-neuf heures. Tu peux venir un peu plus tôt si tu veux.",
        "zh": "大约十九点。如果愿意，你可以早点来。"
      },
      {
        "speaker": "Léa",
        "fr": "Je peux apporter un dessert ?",
        "zh": "我可以带个甜点吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Bonne idée ! Je t’envoie mon adresse.",
        "zh": "好主意！我把地址发给你。"
      }
    ],
    "words": [
      {
        "id": "lesson-19-word-1",
        "fr": "ça te dit de…",
        "pos": "loc.",
        "zh": "你想不想……"
      },
      {
        "id": "lesson-19-word-2",
        "fr": "apporter",
        "pos": "v.",
        "zh": "带来"
      },
      {
        "id": "lesson-19-word-3",
        "fr": "un dessert",
        "pos": "n. m.",
        "zh": "甜点"
      }
    ],
    "grammar": {
      "title": "ça te dit de + 不定式",
      "explanation": "这是朋友间自然的邀请表达，后接 de 和动词不定式。",
      "example": "Ça te dit de venir samedi ?",
      "translation": "你周六想来吗？",
      "question": "补全：Ça te dit de ___ avec nous ?",
      "options": [
        "dînes",
        "dîner",
        "dînez"
      ],
      "answer": 1,
      "why": "de 后接动词不定式 dîner。"
    },
    "quiz": {
      "question": "Qu’est-ce que Léa propose d’apporter ?",
      "options": [
        "Une salade.",
        "Des boissons.",
        "Un dessert."
      ],
      "answer": 2,
      "why": "Léa 提议带一个甜点。"
    },
    "writing": {
      "prompt": "邀请朋友周末来做一件事，写出时间、地点，并让对方回复。",
      "example": "Salut Léa ! Ça te dit de dîner chez moi samedi vers dix-neuf heures ? Je vais préparer des pâtes et une salade. Tu peux venir un peu plus tôt si tu veux. Dis-moi si tu es disponible !"
    }
  },
  {
    "id": "lesson-20",
    "topic": "social",
    "level": "A2+",
    "title": "礼貌地拒绝",
    "fr": "Une autre fois, peut-être ?",
    "goal": "拒绝邀请时说明原因并提出替代时间。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Max",
        "fr": "Tu viens au cinéma vendredi soir ?",
        "zh": "周五晚上你来电影院吗？"
      },
      {
        "speaker": "Vous",
        "fr": "J’aimerais bien, mais je dois garder ma nièce.",
        "zh": "我很想来，但我要照看侄女。"
      },
      {
        "speaker": "Max",
        "fr": "Dommage ! Tu es libre samedi ?",
        "zh": "可惜！你周六有空吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Oui, après dix-huit heures. On pourrait aller à la séance de vingt heures.",
        "zh": "有，十八点之后。我们可以去看二十点那场。"
      },
      {
        "speaker": "Max",
        "fr": "Parfait, je réserve les places.",
        "zh": "太好了，我来订票。"
      }
    ],
    "words": [
      {
        "id": "lesson-20-word-1",
        "fr": "dommage",
        "pos": "interj.",
        "zh": "可惜"
      },
      {
        "id": "lesson-20-word-2",
        "fr": "garder",
        "pos": "v.",
        "zh": "照看；保留"
      },
      {
        "id": "lesson-20-word-3",
        "fr": "une séance",
        "pos": "n. f.",
        "zh": "场次"
      }
    ],
    "grammar": {
      "title": "j’aimerais bien, mais…",
      "explanation": "用 j’aimerais bien 先表达意愿，再用 mais 解释限制，可以更委婉地拒绝邀请。",
      "example": "J’aimerais bien, mais je travaille.",
      "translation": "我很想去，可是我要工作。",
      "question": "选择礼貌、完整的拒绝。",
      "options": [
        "Non.",
        "J’aimerais bien, mais je ne suis pas libre.",
        "Tu dois partir."
      ],
      "answer": 1,
      "why": "先表达意愿，再说明自己没空，语气更委婉。"
    },
    "quiz": {
      "question": "Quand les deux personnes vont-elles au cinéma ?",
      "options": [
        "Vendredi à vingt heures.",
        "Samedi à dix-huit heures.",
        "Samedi à vingt heures."
      ],
      "answer": 2,
      "why": "最终约定周六二十点那场。"
    },
    "writing": {
      "prompt": "回复朋友的邀请：表示感谢、说明不能去的原因，并建议一个新时间。",
      "example": "Merci pour ton invitation ! J’aimerais bien venir vendredi, mais je dois garder ma nièce. Est-ce qu’on pourrait se voir samedi après dix-huit heures ? J’espère que cet horaire te convient."
    }
  },
  {
    "id": "lesson-21",
    "topic": "social",
    "level": "B1",
    "title": "聊聊未来的打算",
    "fr": "Et après, tu feras quoi ?",
    "goal": "说明未来计划并解释动机。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Sarah",
        "fr": "Qu’est-ce que tu aimerais faire l’année prochaine ?",
        "zh": "你明年想做什么？"
      },
      {
        "speaker": "Vous",
        "fr": "J’aimerais passer quelques mois en France pour améliorer mon français.",
        "zh": "我想在法国待几个月，提高法语。"
      },
      {
        "speaker": "Sarah",
        "fr": "Tu as déjà choisi une ville ?",
        "zh": "你已经选好城市了吗？"
      },
      {
        "speaker": "Vous",
        "fr": "Pas encore. Lyon m’intéresse parce que la ville est bien située.",
        "zh": "还没有。里昂让我很感兴趣，因为地理位置很好。"
      },
      {
        "speaker": "Sarah",
        "fr": "Tu chercheras un travail sur place ?",
        "zh": "你会在当地找工作吗？"
      },
      {
        "speaker": "Vous",
        "fr": "D’abord, je suivrai un cours. Ensuite, je chercherai un stage.",
        "zh": "先上课，然后我会找实习。"
      }
    ],
    "words": [
      {
        "id": "lesson-21-word-1",
        "fr": "un stage",
        "pos": "n. m.",
        "zh": "实习"
      },
      {
        "id": "lesson-21-word-2",
        "fr": "améliorer",
        "pos": "v.",
        "zh": "改善；提高"
      },
      {
        "id": "lesson-21-word-3",
        "fr": "sur place",
        "pos": "loc.",
        "zh": "在当地；在现场"
      }
    ],
    "grammar": {
      "title": "表达目标 pour + 不定式",
      "explanation": "同一主语下，可用 pour + 不定式表达行动目的。",
      "example": "Je pars pour améliorer mon français.",
      "translation": "我出发是为了提高法语。",
      "question": "补全：Je suis un cours pour ___ mon français。",
      "options": [
        "améliore",
        "améliorer",
        "amélioré"
      ],
      "answer": 1,
      "why": "表达目的时，pour 后接不定式 améliorer。"
    },
    "quiz": {
      "question": "Que fera la personne d’abord en France ?",
      "options": [
        "Elle cherchera un stage.",
        "Elle suivra un cours.",
        "Elle achètera un appartement."
      ],
      "answer": 1,
      "why": "她明确说 « D’abord, je suivrai un cours »。"
    },
    "writing": {
      "prompt": "写下你未来一年的两个计划，说明顺序和至少一个原因。",
      "example": "L’année prochaine, j’aimerais passer quelques mois en France pour améliorer mon français. D’abord, je suivrai un cours de langue. Ensuite, je chercherai un stage. Lyon m’intéresse parce que la ville est bien située et offre de nombreuses activités."
    }
  },
  {
    "id": "lesson-22",
    "topic": "opinions",
    "level": "B1",
    "title": "城市还是乡村",
    "fr": "Où préférez-vous vivre ?",
    "goal": "比较两种选择并给出个人理由。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Thomas",
        "fr": "Tu préfères vivre en ville ou à la campagne ?",
        "zh": "你更喜欢住在城市还是乡村？"
      },
      {
        "speaker": "Vous",
        "fr": "Je préfère la ville parce que les transports sont pratiques.",
        "zh": "我更喜欢城市，因为交通方便。"
      },
      {
        "speaker": "Thomas",
        "fr": "Mais il y a beaucoup de bruit.",
        "zh": "但噪声很多。"
      },
      {
        "speaker": "Vous",
        "fr": "C’est vrai. Pourtant, j’aime pouvoir sortir sans voiture.",
        "zh": "确实。不过，我喜欢不用车就能出门。"
      },
      {
        "speaker": "Thomas",
        "fr": "Moi, je choisirais la campagne pour le calme.",
        "zh": "我会为了安静而选择乡村。"
      }
    ],
    "words": [
      {
        "id": "lesson-22-word-1",
        "fr": "la campagne",
        "pos": "n. f.",
        "zh": "乡村"
      },
      {
        "id": "lesson-22-word-2",
        "fr": "pourtant",
        "pos": "adv.",
        "zh": "然而；不过"
      },
      {
        "id": "lesson-22-word-3",
        "fr": "le calme",
        "pos": "n. m.",
        "zh": "宁静"
      }
    ],
    "grammar": {
      "title": "表达转折 pourtant",
      "explanation": "pourtant 引出与前文形成转折或出乎意料的情况，常用于独立分句。",
      "example": "La ville est bruyante. Pourtant, je l’aime.",
      "translation": "城市很吵。不过，我喜欢它。",
      "question": "选择表示转折的连接词：La ville est chère. ___, j’aime y vivre。",
      "options": [
        "Donc",
        "Pourtant",
        "Parce que"
      ],
      "answer": 1,
      "why": "前后是让步转折关系，用 pourtant。"
    },
    "quiz": {
      "question": "Pourquoi la personne préfère-t-elle la ville ?",
      "options": [
        "Pour les transports pratiques.",
        "Pour le silence.",
        "Pour les loyers moins chers."
      ],
      "answer": 0,
      "why": "她首先给出的理由是交通方便。"
    },
    "writing": {
      "prompt": "写一段观点：你更喜欢住在城市还是乡村？给两个理由，并承认一个不足。",
      "example": "Je préfère vivre en ville parce que les transports sont pratiques et les activités sont variées. Je peux aller au cinéma sans prendre de voiture. C’est vrai que les loyers sont élevés. Pourtant, pour le moment, ce mode de vie me convient."
    }
  },
  {
    "id": "lesson-23",
    "topic": "opinions",
    "level": "B1",
    "title": "选择一种学习方式",
    "fr": "En ligne ou en classe ?",
    "goal": "提出观点、举例并回应不同看法。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Nina",
        "fr": "Tu trouves les cours en ligne efficaces ?",
        "zh": "你觉得网课有效吗？"
      },
      {
        "speaker": "Vous",
        "fr": "À mon avis, oui, surtout quand on manque de temps.",
        "zh": "我觉得有效，尤其是在时间不够的时候。"
      },
      {
        "speaker": "Nina",
        "fr": "Moi, je me concentre mieux en classe.",
        "zh": "我在教室里更能集中注意力。"
      },
      {
        "speaker": "Vous",
        "fr": "Je comprends. Par exemple, chez moi, je coupe mon téléphone pour mieux travailler.",
        "zh": "我理解。比如在家时，我关掉手机以便更好地学习。"
      },
      {
        "speaker": "Nina",
        "fr": "On pourrait combiner les deux méthodes.",
        "zh": "我们可以把两种方法结合起来。"
      }
    ],
    "words": [
      {
        "id": "lesson-23-word-1",
        "fr": "à mon avis",
        "pos": "loc.",
        "zh": "在我看来"
      },
      {
        "id": "lesson-23-word-2",
        "fr": "se concentrer",
        "pos": "v. pron.",
        "zh": "集中注意力"
      },
      {
        "id": "lesson-23-word-3",
        "fr": "efficace",
        "pos": "adj.",
        "zh": "有效的"
      }
    ],
    "grammar": {
      "title": "mieux 与 meilleur",
      "explanation": "mieux 是副词，通常修饰动词；meilleur 是 bon 的比较级，修饰名词并发生性数配合。",
      "example": "Je travaille mieux en classe.",
      "translation": "我在课堂上学得更好。",
      "question": "补全：Je me concentre ___ le matin。",
      "options": [
        "meilleur",
        "mieux",
        "meilleure"
      ],
      "answer": 1,
      "why": "修饰动词 se concentrer，应使用副词 mieux。"
    },
    "quiz": {
      "question": "Quelle solution Nina propose-t-elle à la fin ?",
      "options": [
        "Arrêter les cours.",
        "Étudier seulement en classe.",
        "Combiner les deux méthodes."
      ],
      "answer": 2,
      "why": "Nina 最后提议结合线上和线下两种方法。"
    },
    "writing": {
      "prompt": "写一段你对线上学习的看法，包含一个优点、一个例子和一个局限。",
      "example": "À mon avis, les cours en ligne sont utiles parce qu’ils permettent de gagner du temps. Par exemple, je peux étudier après le travail sans me déplacer. Cependant, il est parfois difficile de rester concentré. Je pense qu’on pourrait combiner les cours en ligne et les cours en classe."
    }
  },
  {
    "id": "lesson-24",
    "topic": "opinions",
    "level": "B1",
    "title": "协商一个解决方案",
    "fr": "Trouvons un compromis.",
    "goal": "解释问题，提出条件和可行的替代方案。",
    "minutes": 15,
    "dialogue": [
      {
        "speaker": "Vous",
        "fr": "Bonjour, ma chambre donne sur une rue très bruyante et je n’ai pas bien dormi.",
        "zh": "您好，我的房间朝向很吵的街道，我没睡好。"
      },
      {
        "speaker": "Réceptionniste",
        "fr": "Je suis désolée. Nous avons une chambre côté cour, mais elle sera libre demain.",
        "zh": "很抱歉。我们有一间朝向庭院的房间，但明天才能空出来。"
      },
      {
        "speaker": "Vous",
        "fr": "Si je reste ici ce soir, pourriez-vous me proposer une réduction ?",
        "zh": "如果今晚我继续住这里，您能给我优惠吗？"
      },
      {
        "speaker": "Réceptionniste",
        "fr": "Nous pouvons vous offrir le petit-déjeuner et changer votre chambre demain.",
        "zh": "我们可以赠送早餐，并在明天为您换房。"
      },
      {
        "speaker": "Vous",
        "fr": "D’accord, cette solution me convient. Merci.",
        "zh": "好的，我接受这个方案。谢谢。"
      }
    ],
    "words": [
      {
        "id": "lesson-24-word-1",
        "fr": "un compromis",
        "pos": "n. m.",
        "zh": "折中方案"
      },
      {
        "id": "lesson-24-word-2",
        "fr": "une réduction",
        "pos": "n. f.",
        "zh": "折扣；减价"
      },
      {
        "id": "lesson-24-word-3",
        "fr": "convenir",
        "pos": "v.",
        "zh": "适合；让人满意"
      }
    ],
    "grammar": {
      "title": "提出建议 on pourrait",
      "explanation": "on pourrait + 不定式表示“我们可以……”，适合提出建议，给对方保留选择空间。",
      "example": "On pourrait changer de chambre demain.",
      "translation": "我们可以明天换房。",
      "question": "选择用于协商的建议。",
      "options": [
        "On pourrait chercher une autre solution.",
        "Tu as toujours tort.",
        "Il n’y a rien à discuter."
      ],
      "answer": 0,
      "why": "on pourrait 提出开放的建议，适合共同商量。"
    },
    "quiz": {
      "question": "Quelle solution est acceptée ?",
      "options": [
        "Un remboursement total.",
        "Un petit-déjeuner offert et un changement de chambre demain.",
        "Un départ immédiat."
      ],
      "answer": 1,
      "why": "最终接受了赠送早餐，并在第二天更换房间。"
    },
    "writing": {
      "prompt": "给服务方写一封说明问题的邮件：说明影响、提出一个合理请求，并表示愿意协商。",
      "example": "Bonjour, ma chambre donne sur une rue très bruyante et je n’ai pas bien dormi. Serait-il possible de changer de chambre ? Si aucune chambre n’est libre aujourd’hui, pourriez-vous me proposer une autre solution ? Je vous remercie pour votre aide."
    }
  }
];
const authoredLessons:Lesson[]=[...originalLessons,...a1Lessons,...b2Lessons,...c1Lessons,...c2Lessons];
const levelOrder=['A1','A2','A2+','B1','B2','C1','C2'];
const frenchLessons:Lesson[]=levelOrder.flatMap(level=>[...authoredLessons,...scaledLessons].filter(lesson=>lesson.level===level)).map(lesson=>({...lesson,language:'fr',learnerSpeaker:'Vous'}));
const baseLessons:Lesson[]=[...frenchLessons,...englishLessons,...germanLessons,...japaneseLessons];
export const lessons:Lesson[]=expandCoursesToHundred(baseLessons);
export const findLesson=(id:string)=>lessons.find(l=>l.id===id);
export const allWords=lessons.flatMap(l=>l.words.map(w=>({...w,language:l.language??'fr',lessonId:l.id,lessonTitle:l.title,example:l.dialogue.find(d=>d.fr.toLowerCase().includes(w.fr.replace(/^(un |une |du |la |le |les )/,'').toLowerCase()))?.fr??''})));
