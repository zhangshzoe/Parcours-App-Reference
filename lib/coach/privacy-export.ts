import {CoachError} from './server';

export type ExportScope='all'|'fr-FR'|'de-DE'|'en-US';
type Group='legacy'|'coach'|'english'|'privacy';
type Definition={name:string;label:string;group:Group;columns:string;owner:string;json?:string[];snapshot?:string};
const profile='SELECT id FROM coach_profiles WHERE user_id = ? AND (? IS NULL OR language = ?)';
const conversations=`SELECT id FROM coach_conversations WHERE profile_id IN (${profile})`;
const turns=`SELECT id FROM coach_turns WHERE conversation_id IN (${conversations})`;
const exams=`SELECT id FROM coach_exam_attempts WHERE profile_id IN (${profile})`;
const listening=`SELECT id FROM coach_listening_attempts WHERE profile_id IN (${profile})`;
const assessment=`SELECT id FROM coach_assessment_attempts WHERE profile_id IN (${profile})`;
const englishProfile='SELECT id FROM english_profiles WHERE user_id = ?';
const englishSessions=`SELECT id FROM english_sessions WHERE profile_id IN (${englishProfile})`;
const ownedProfile=`profile_id IN (${profile})`;
const legacy=(name:string,label:string,columns:string,json?:string[]):Definition=>({name,label,columns,json,owner:'user_id = ?',group:'legacy'});
const coach=(name:string,label:string,columns:string,owner=ownedProfile,json?:string[],snapshot?:string):Definition=>({name,label,columns,owner,json,snapshot,group:'coach'});
const english=(name:string,label:string,columns:string,owner=`profile_id IN (${englishProfile})`,json?:string[],snapshot?:string):Definition=>({name,label,columns,owner,json,snapshot,group:'english'});

// Reviewed column allowlist. The coverage test fails when schema columns/tables change.
export const exportDefinitions:Definition[]=[
 {name:'app_data_controls',label:'隐私清理版本与回执',group:'privacy',columns:'user_id,revision,last_delete_id,last_scope,deleted_at',owner:'user_id = ?'},
 legacy('profiles','旧版个人设置','user_id,name,daily_goal'),
 legacy('lesson_progress','旧版课程进度','user_id,lesson_id,score,completed_at'),
 legacy('study_activity','旧版学习事件','user_id,attempt_id,lesson_id,seconds,created_at'),
 legacy('reviews','旧版词汇复习','user_id,word_id,due_at,interval_days,repetitions'),
 legacy('writing_drafts','旧版写作草稿','user_id,lesson_id,body,updated_at'),
 legacy('assessments','旧版自评','user_id,result,updated_at',['result']),
 legacy('content_reports','旧版内容反馈','id,user_id,lesson_id,body,created_at'),
 coach('coach_profiles','法德语言档案','id,user_id,language,goal,revision,last_command,created_at','user_id = ? AND (? IS NULL OR language = ?)',['goal']),
 coach('coach_goals','学习目标历史','id,profile_id,revision,goal,created_at',undefined,['goal']),
 coach('coach_attempts','微课学习与步骤关联','id,profile_id,lesson_id,content_version,status,answer,writing,revision,result,created_at,completed_at,snapshot,listening_id,conversation_id,full_completed_at',undefined,['result'],'snapshot'),
 coach('coach_plans','每日学习计划','id,profile_id,local_date,goal_revision,tasks,rule_version,created_at',undefined,['tasks']),
 coach('coach_review_items','收藏与复习项','id,profile_id,source_key,kind,payload,stage,due_at,revision,created_at',undefined,['payload']),
 coach('coach_review_events','复习事件','id,profile_id,item_id,grade,response,transfer_prompt,previous_revision,next_stage,next_due_at,occurred_at'),
 coach('coach_conversations','口语会话','id,profile_id,scenario_id,scenario_version,practice_type,practice_topic,practice_snapshot,language,level,mode,status,summary,consent_version,created_at,ended_at',undefined,['practice_snapshot','summary']),
 coach('coach_turns','对话轮次与反馈','id,conversation_id,sequence,input_kind,original_transcript,accepted_text,revision,state,recording_ms,feedback,created_at',`conversation_id IN (${conversations})`,['feedback']),
 coach('coach_transcript_revisions','转写修改历史','id,turn_id,revision,body,created_at',`turn_id IN (${turns})`),
 coach('coach_service_calls','会话服务调用','id,user_id,conversation_id,operation,fingerprint,status,error_code,request_id,model,created_at,finished_at',`conversation_id IN (${conversations})`),
 coach('coach_exam_attempts','训练卷作答与结果','id,profile_id,paper_id,snapshot,answers,exposed_item_ids,mode,help,status,revision,started_at,deadline_at,submitted_at,result',undefined,['answers','exposed_item_ids','help','result'],'snapshot'),
 coach('coach_exam_commands','训练卷保存事件','id,attempt_id,fingerprint,previous_revision,created_at',`attempt_id IN (${exams})`),
 coach('coach_listening_attempts','精听作答','id,profile_id,material_id,snapshot,status,answers,revision,repeated,played_call_id,played_at,result,created_at,submitted_at',undefined,['answers','result'],'snapshot'),
 coach('coach_listening_calls','精听音频调用','id,attempt_id,user_id,segment_id,status,request_id,model,voice,error_code,created_at,finished_at',`attempt_id IN (${listening})`),
 coach('coach_listening_commands','精听保存事件','id,attempt_id,fingerprint,previous_revision,created_at',`attempt_id IN (${listening})`),
 coach('coach_assessment_attempts','起点检查与自评','id,profile_id,snapshot,status,answers,revision,repeated,result,created_at,submitted_at',undefined,['answers','result'],'snapshot'),
 coach('coach_assessment_calls','起点检查音频调用','id,attempt_id,user_id,question_id,status,request_id,model,voice,error_code,created_at,finished_at,played_at',`attempt_id IN (${assessment})`),
 coach('coach_assessment_commands','起点检查保存事件','id,attempt_id,fingerprint,previous_revision,created_at',`attempt_id IN (${assessment})`),
 coach('coach_vocabulary_calls','词卡音频调用','id,profile_id,user_id,entry_id,content_version,part,status,request_id,model,voice,error_code,created_at,finished_at'),
 coach('coach_exam_audio_calls','训练卷听力调用','id,attempt_id,user_id,audio_key,status,request_id,model,voice,error_code,created_at,finished_at,played_at',`attempt_id IN (${exams})`),
 coach('coach_exam_recordings','口语考试转写与确认','id,attempt_id,item_id,original_transcript,accepted_text,recording_ms,consent_version,created_at,confirmed_at',`attempt_id IN (${exams})`),
 coach('coach_exam_feedback','考试表达参考反馈','id,attempt_id,item_id,recording_id,body,model,created_at',`attempt_id IN (${exams})`,['body']),
 coach('coach_exam_retries','考试表达重试与反馈','id,attempt_id,item_id,skill,original_transcript,accepted_text,recording_ms,consent_version,body,model,created_at,confirmed_at,feedback_at',`attempt_id IN (${exams})`,['body']),
 coach('coach_exam_response_calls','考试回答服务调用','id,attempt_id,user_id,item_id,operation,fingerprint,status,consent_version,request_id,model,error_code,created_at,finished_at',`attempt_id IN (${exams})`),
 english('english_profiles','英语听说目标','id,user_id,daily_minutes,revision,last_command,created_at,updated_at','user_id = ?'),
 english('english_sessions','英语听辨与场景记录','id,profile_id,scenario_id,scenario_version,difficulty,snapshot,status,answers,help,listening_result,revision,last_command,consent_version,created_at,submitted_at,ended_at',undefined,['answers','help','listening_result'],'snapshot'),
 english('english_turns','英语逐轮回答与转写','id,session_id,sequence,input_kind,original_transcript,accepted_text,revision,state,feedback,recording_ms,created_at',`session_id IN (${englishSessions})`,['feedback']),
 english('english_calls','英语语音及对话调用','id,user_id,session_id,operation,fingerprint,status,request_id,model,error_code,created_at,finished_at',`session_id IN (${englishSessions})`),
 english('english_reviews','英语错误复习','id,profile_id,session_id,turn_id,kind,payload,stage,due_at,revision,created_at',undefined,['payload']),
 english('english_review_events','英语复习事件','id,item_id,profile_id,grade,answer,review_mode,objective_correct,previous_revision,next_stage,next_due_at,occurred_at'),
];
function parse(value:unknown):unknown {
 if(typeof value!=='string')return value;
 try{return JSON.parse(value)}catch{return {format:'unparsed-json',raw:value}}
}
function reference(raw:unknown) {
 let source:Record<string,unknown>;
 try{source=JSON.parse(String(raw))}catch{return {available:false}}
 if(!source||typeof source!=='object'||Array.isArray(source))return {available:false};
 const result:Record<string,unknown>={};
 for(const key of ['id','version','title','language','level','kind','ruleVersion','durationSeconds']) {
  if(typeof source[key]==='string'||typeof source[key]==='number')result[key]=source[key];
 }
 const items=Array.isArray(source.items)?source.items:Array.isArray(source.questions)?source.questions:[];
 result.items=items.map(item=>{
  const out:Record<string,unknown>={};
  if(item&&typeof item==='object')for(const key of ['id','skill','version','level'])if(typeof item[key]==='string'||typeof item[key]==='number')out[key]=item[key];
  return out;
 });
 return result;
}
export function tableFilter(d:Definition,userId:string,scope:ExportScope){
 const language=scope==='all'?null:scope;
 const alsoOwnUser=(d.group==='coach'&&d.name!=='coach_profiles'||d.group==='english'&&d.name!=='english_profiles')&&d.columns.split(',').includes('user_id');
 const values:(string|null)[]=d.group==='coach'?[userId,language,language]:[userId];
 if(alsoOwnUser)values.push(userId);
 return {where:d.owner+(alsoOwnUser?' AND user_id = ?':''),values};
}
export async function buildDataExport(db:D1Database,user:{userId:string;email:string;displayName:string},scope:ExportScope) {
 const definitions=exportDefinitions.filter(d=>scope==='all'||d.group===(scope==='en-US'?'english':'coach'));
 const statements=definitions.map(d=>{const filter=tableFilter(d,user.userId,scope);return db.prepare(`SELECT ${d.columns} FROM ${d.name} WHERE ${filter.where} ORDER BY ${d.columns.split(',')[0]}`).bind(...filter.values)});
 // D1 batch reads share one transaction; no per-table pagination or implicit row limit.
 const results=await db.batch<Record<string,unknown>>(statements);
 if(results.some(r=>!r.success))throw new CoachError(503,'导出未完整生成，请稍后重试。');
 const records=Object.fromEntries(definitions.map((d,i)=>[d.name,results[i].results.map(row=>{
  const output={...row};
  if(d.snapshot){output.content_reference=reference(output[d.snapshot]);delete output[d.snapshot]}
  for(const field of d.json??[])output[field]=parse(output[field]);
  // Never disclose answer keys through an inconsistent unfinished result row.
  if(['coach_exam_attempts','coach_assessment_attempts','coach_listening_attempts'].includes(d.name)&&row.status==='active')output.result=null;
  return output;
 })]));
 if(records.english_sessions){
  const audioRequests=new Set((records.english_calls??[]).filter(call=>call.operation==='audio').map(call=>call.session_id));
  for(const session of records.english_sessions)session.audioConsentRequestRecorded=audioRequests.has(session.id);
 }
 const sections=definitions.map(d=>({key:d.name,label:d.label,group:d.group,count:records[d.name].length}));
 return {
  format:'parcours-personal-data',version:1,exportedAt:new Date().toISOString(),scope,
  account:{id:user.userId,email:user.email,displayName:user.displayName},
  notice:{
   purpose:'个人学习数据备份；当前版本不提供导入恢复功能。',
   coverage:scope==='all'?'当前账号的法德教练、英语听说、旧版全部语言学习数据，以及用于阻止旧请求恢复数据的最小隐私清理回执。':scope==='en-US'?'仅当前账号的英语听说路线记录；不包含旧版课程与法德教练。':'仅当前账号所选语言的法德教练数据；不包含旧版学习模块与英语听说。',
   time:'所有数字时间戳为 UTC 毫秒；日期和时区以原记录为准。',
   audio:'应用未持久化原始录音或合成语音；此文件包含已保存的转写、修订、反馈和录音时长，不含音频文件。录音时长不等于有效口语时长。',
   englishConsent:'英语会话的历史 consent_version 可能只是当时适用的录音说明版本，不代表实际上传；audioConsentRequestRecorded 仅表示服务端保存过携带有效同意版本的录音请求，不证明设备上具体点击过程。',
   content:'冻结教学材料只导出内容引用与版本，不导出原始试题快照、未提交题目的标准答案或隐藏原文。已提交结果按原记录保留。',
   exclusions:'不包含密码、服务密钥、未提交到服务器的本机草稿或录音，也不包含第三方服务自身的日志、账号与留存数据。',
  },
  summary:{totalRecords:sections.reduce((n,s)=>n+s.count,0),sections},records,
 };
}
