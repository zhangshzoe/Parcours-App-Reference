import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import EnglishApp from './english-app';
import '@/app/coach/coach.css';
import './english.css';

export const dynamic='force-dynamic';
export const metadata={title:'Parcours · 英语听说',description:'工作沟通与日常交流的短听力、回应、追问和复习练习。'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#234bd4'};
export default async function EnglishPage(){const user=await getChatGPTUser();return <EnglishApp signedIn={Boolean(user)} signInHref={chatGPTSignInPath('/english')}/>}
