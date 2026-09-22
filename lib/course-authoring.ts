import type {Lesson} from './curriculum';
import type {LearningLevel} from './levels';

type LessonSeed = Omit<Lesson,'id'|'level'|'dialogue'|'words'> & {
  dialogue:[string,string,string][];
  words:[string,string,string][];
};

export function createLessons(level:LearningLevel,firstId:number,seeds:LessonSeed[]):Lesson[]{
  return seeds.map((seed,index)=>{
    const id=`lesson-${String(firstId+index).padStart(2,'0')}`;
    return {...seed,id,level,
      dialogue:seed.dialogue.map(([speaker,fr,zh])=>({speaker,fr,zh})),
      words:seed.words.map(([fr,pos,zh],i)=>({id:`${id}-word-${i+1}`,fr,pos,zh})),
    };
  });
}
