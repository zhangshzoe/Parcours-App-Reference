import CoachApp from './coach-app';
import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import './coach.css';
export const dynamic='force-dynamic';
export const metadata={title:'Parcours · 法德学习教练',description:'法语与德语 A1、A2 的任务学习、听说和考证训练。',manifest:'/coach/manifest.webmanifest',appleWebApp:{capable:true,title:'Parcours',statusBarStyle:'default'},icons:{icon:'/favicon.svg',apple:'/coach/apple-touch-icon.png'}};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#234bd4'};
export default async function CoachPage(){const user=await getChatGPTUser();return <CoachApp signedIn={Boolean(user)} signInHref={chatGPTSignInPath('/coach')}/>}
