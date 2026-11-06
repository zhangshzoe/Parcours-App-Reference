import {env} from 'cloudflare:workers';
import {context,reply,failure} from '@/lib/coach/server';
import {aiCapabilities} from '@/lib/coach/ai';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{await context(request);return reply(aiCapabilities(env))}catch(e){return failure(e)}}
