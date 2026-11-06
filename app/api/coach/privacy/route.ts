import {z} from 'zod';
import {context,readBody,failure,reply,CoachError} from '@/lib/coach/server';
import {buildDataExport} from '@/lib/coach/privacy-export';
import {prepareDeletion,deleteLearningData,deletionStatus} from '@/lib/coach/privacy-delete';
import {checkRequestRevision} from '@/lib/data-guard';
export const dynamic='force-dynamic';
const scope=z.enum(['all','fr-FR','de-DE','en-US']);
const inputSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('export'),scope}).strict(),
 z.object({action:z.literal('prepare-delete'),scope,revision:z.number().int().nonnegative()}).strict(),
 z.object({action:z.literal('delete'),scope,revision:z.number().int().nonnegative(),token:z.string().uuid(),phrase:z.string().max(50)}).strict(),
 z.object({action:z.literal('deletion-status'),token:z.string().uuid()}).strict(),
]);
export async function POST(request:Request){try{
 const {db,rawDb,user,dataRevision}=await context(request,{privacy:true});
 const input=inputSchema.parse(await readBody(request,1000));
 if(input.action==='delete')return reply(await deleteLearningData(rawDb,user.userId,input));
 if(input.action==='deletion-status')return reply(await deletionStatus(rawDb,user.userId,input.token));
 checkRequestRevision(request,dataRevision);
 if(input.action==='prepare-delete'){
  if(input.revision!==dataRevision)throw new CoachError(409,'页面已过期，请刷新后重新确认。');
  return reply({confirmation:await prepareDeletion(db,user.userId,dataRevision,input.scope),account:user.email});
 }
 const data=await buildDataExport(db,user,input.scope);
 const filename=`parcours-${input.scope}-${data.exportedAt.replace(/[:.]/g,'-')}.json`;
 return new Response(JSON.stringify(data,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
}catch(error){return failure(error)}}
