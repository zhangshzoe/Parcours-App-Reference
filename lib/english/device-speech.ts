export const DEVICE_SPEECH_TIMEOUT_MS=30_000;

export function playEnglishDeviceSpeech(
 text:string,
 rate:number,
 synthesis:SpeechSynthesis,
 Utterance:typeof SpeechSynthesisUtterance,
 timeoutMs=DEVICE_SPEECH_TIMEOUT_MS,
):Promise<void>{
 synthesis.cancel();
 const utterance=new Utterance(text);
 utterance.lang='en-US';
 utterance.rate=rate;
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error?:Error)=>{
   if(settled)return;
   settled=true;
   clearTimeout(timer);
   utterance.onend=null;
   utterance.onerror=null;
   if(error){synthesis.cancel();reject(error)}else resolve();
  };
  const timer=setTimeout(()=>finish(new Error('设备朗读等待超时，请检查语音设置后重试。')),timeoutMs);
  utterance.onend=()=>finish();
  utterance.onerror=()=>finish(new Error('设备朗读失败，请检查语音设置。'));
  try{synthesis.speak(utterance)}catch{finish(new Error('设备朗读无法启动，请检查语音设置。'))}
 });
}
