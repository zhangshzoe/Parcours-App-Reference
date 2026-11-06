import {z} from 'zod';
import {context,ownProfile,reply,failure} from '@/lib/coach/server';
import {progressReport} from '@/lib/coach/progress';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const {db,user}=await context(request),url=new URL(request.url);
 const id=z.string().uuid().parse(url.searchParams.get('profileId')),level=z.enum(['A1','A2']).parse(url.searchParams.get('level'));
 const profile=await ownProfile(db,user.userId,id);
 return reply(await progressReport(db,profile,level));
}catch(error){return failure(error)}}
