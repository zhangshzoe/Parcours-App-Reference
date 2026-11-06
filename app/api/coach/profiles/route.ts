import {z} from 'zod';
import {context,readBody,reply,failure,goalSchema,ownProfile,publicProfile,CoachError,type ProfileRow} from '@/lib/coach/server';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const {db,user,dataRevision}=await context(request);const rows=await db.prepare('SELECT * FROM coach_profiles WHERE user_id = ? ORDER BY created_at, id').bind(user.userId).all<ProfileRow>();return reply({profiles:rows.results.map(publicProfile),dataRevision})}catch(e){return failure(e)}}
export async function POST(request:Request){try{
 const {db,user}=await context(request);
 const input=z.object({language:z.enum(['fr-FR','de-DE']),goal:goalSchema,commandId:z.string().uuid()}).strict().parse(await readBody(request));
 const id=crypto.randomUUID(),now=Date.now(),goal=JSON.stringify(input.goal);
 await db.batch([
  db.prepare('INSERT INTO coach_profiles (id,user_id,language,goal,revision,last_command,created_at) VALUES (?,?,?,?,0,?,?) ON CONFLICT(user_id,language) DO NOTHING').bind(id,user.userId,input.language,goal,input.commandId,now),
  db.prepare('INSERT INTO coach_goals (id,profile_id,revision,goal,created_at) SELECT ?,id,0,goal,? FROM coach_profiles WHERE id = ? ON CONFLICT(profile_id,revision) DO NOTHING').bind(crypto.randomUUID(),now,id),
 ]);
 const row=await db.prepare('SELECT * FROM coach_profiles WHERE user_id = ? AND language = ?').bind(user.userId,input.language).first<ProfileRow>();
 if(!row)throw new CoachError(503,'档案未能保存，请重试。');
 if(row.last_command!==input.commandId||row.goal!==goal)throw new CoachError(409,'此语言已有档案，请刷新后编辑现有目标。');
 return reply({profile:publicProfile(row)});
}catch(e){return failure(e)}}
export async function PATCH(request:Request){try{
 const {db,user}=await context(request);
 const input=z.object({profileId:z.string().uuid(),expectedRevision:z.number().int().nonnegative(),goal:goalSchema,commandId:z.string().uuid()}).strict().parse(await readBody(request));
 const old=await ownProfile(db,user.userId,input.profileId),goal=JSON.stringify(input.goal);
 if(old.last_command===input.commandId){if(old.goal!==goal)throw new CoachError(409,'同一请求不能保存不同内容。');return reply({profile:publicProfile(old)})}
 const next=input.expectedRevision+1,now=Date.now();
 const result=await db.batch([
  db.prepare('UPDATE coach_profiles SET goal = ?, revision = revision + 1, last_command = ? WHERE id = ? AND user_id = ? AND revision = ?').bind(goal,input.commandId,old.id,user.userId,input.expectedRevision),
  db.prepare('INSERT INTO coach_goals (id,profile_id,revision,goal,created_at) SELECT ?,id,revision,goal,? FROM coach_profiles WHERE id = ? AND last_command = ? AND revision = ? ON CONFLICT(profile_id,revision) DO NOTHING').bind(crypto.randomUUID(),now,old.id,input.commandId,next),
 ]);
 const row=await ownProfile(db,user.userId,old.id);
 if(!result[0].meta.changes&&(row.last_command!==input.commandId||row.goal!==goal))throw new CoachError(409,'目标已在其他页面更新，请刷新后重试。');
 return reply({profile:publicProfile(row)});
}catch(e){return failure(e)}}
