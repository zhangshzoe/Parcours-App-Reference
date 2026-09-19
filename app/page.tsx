import LearningApp from './learning-app';
import {chatGPTSignInPath,chatGPTSignOutPath} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default function Home(){return <LearningApp signInHref={chatGPTSignInPath('/')} signOutHref={chatGPTSignOutPath('/')}/>;}
