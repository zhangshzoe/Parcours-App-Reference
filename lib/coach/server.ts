import {dataRevision,checkRequestRevision,guardedDatabase,isRevisionFailure,DataRevisionError} from '@/lib/data-guard';
import {z} from 'zod';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getDatabase} from '@/db';
import type {CoachProfile} from './types';

export const goalSchema=z.object({
 mode:z.enum(['exam','speaking','balanced']),level:z.enum(['A1','A2']),targetExam:z.literal('DELF tout public').optional(),start:z.enum(['zero','a1','a2','unsure']),
 dailyMinutes:z.union([z.literal(10),z.literal(20),z.literal(30),z.literal(45)]),
 targetDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v},'日期无效').nullable(),
 interests:z.array(z.enum(['旅行','生活','留学','基础工作交流'])).max(4),
 timezone:z.string().max(80).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}},'时区无效'),
}).strict();
export class CoachError extends Error {constructor(public status:number,message:string){super(message)}}
export const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function context(request:Request,options:{privacy?:boolean}={}){
 if(request.method!=='GET'){
  if(request.headers.get('sec-fetch-site')==='cross-site')throw new CoachError(403,'请求来源无效。');
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)throw new CoachError(403,'请求来源无效。');
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new CoachError(415,'请使用 JSON 请求。');
 }
 const user=await getChatGPTUser();if(!user)throw new CoachError(401,'请登录后保存学习档案。');
 const rawDb=getDatabase(),revision=await dataRevision(rawDb,user.userId);
 if(!options.privacy)checkRequestRevision(request,revision);
 return {db:guardedDatabase(rawDb,user.userId,revision),rawDb,user,dataRevision:revision};
}
export async function readBody(request:Request,limit=32000){
 const reader=request.body?.getReader();if(!reader)throw new CoachError(400,'提交内容为空。');
 const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new CoachError(413,'提交内容过长。')}chunks.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export type ProfileRow={id:string;user_id:string;language:CoachProfile['language'];goal:string;revision:number;last_command:string;created_at:number};
export function publicProfile(row:ProfileRow):CoachProfile{return {id:row.id,language:row.language,goal:JSON.parse(row.goal),revision:row.revision,createdAt:row.created_at}}
export async function ownProfile(db:D1Database,userId:string,id:string){const row=await db.prepare('SELECT * FROM coach_profiles WHERE id = ? AND user_id = ?').bind(id,userId).first<ProfileRow>();if(!row)throw new CoachError(404,'找不到此学习档案。');return row}
export function failure(error:unknown){
 if(isRevisionFailure(error))return reply({error:new DataRevisionError().message,code:'data_revision_changed'},409);
 if(error instanceof CoachError)return reply({error:error.message},error.status);
 if(error instanceof z.ZodError||error instanceof SyntaxError)return reply({error:'提交内容不完整或格式无效。'},400);
 console.error('Coach request failed',{kind:error instanceof Error?error.name:'unknown'});
 return reply({error:'服务暂时不可用，输入仍保留，请稍后重试。'},503);
}
