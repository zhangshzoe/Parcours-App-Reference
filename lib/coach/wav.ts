// Shared PCM encoding/validation; recording length comes from samples, never a client counter.
export class RecordingError extends Error{}
export function encodeWav(samples:Float32Array,rate=16000):Uint8Array{
 const bytes=new Uint8Array(44+samples.length*2),v=new DataView(bytes.buffer);
 const word=(offset:number,text:string)=>{for(let i=0;i<text.length;i++)v.setUint8(offset+i,text.charCodeAt(i))};
 word(0,'RIFF');v.setUint32(4,bytes.length-8,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,samples.length*2,true);
 samples.forEach((sample,i)=>v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,sample))*32767),true));return bytes;
}
export function inspectWav(bytes:Uint8Array){
 const bad=()=>new RecordingError('录音文件无效，请重新录音。');
 if(bytes.length<44||bytes.length>1920044)throw bad();
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),tag=(start:number,length:number)=>String.fromCharCode(...bytes.slice(start,start+length));
 if(tag(0,4)!=='RIFF'||tag(8,4)!=='WAVE'||tag(12,4)!=='fmt '||tag(36,4)!=='data'||v.getUint32(4,true)!==bytes.length-8||v.getUint32(16,true)!==16||v.getUint16(20,true)!==1||v.getUint16(22,true)!==1||v.getUint32(24,true)!==16000||v.getUint32(28,true)!==32000||v.getUint16(32,true)!==2||v.getUint16(34,true)!==16||v.getUint32(40,true)!==bytes.length-44||(bytes.length-44)%2)throw bad();
 const count=(bytes.length-44)/2,durationMs=Math.round(count/16);if(durationMs<500||durationMs>60000)throw new RecordingError('请录制 0.5 至 60 秒的语音。');
 let energy=0,activeSamples=0;for(let i=0;i<count;i++){const s=v.getInt16(44+i*2,true)/32768;energy+=s*s;if(Math.abs(s)>.008)activeSamples++}
 if(Math.sqrt(energy/count)<.003||activeSamples/count<.005)throw new RecordingError('录音声音过小或接近静音，请靠近麦克风重新录音。');
 return {durationMs}; // Sound energy is only a coarse usability check, not speech or pronunciation evidence.
}
