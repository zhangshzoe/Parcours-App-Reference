export type AudioReceipt={commandId:string;status:'not-found'|'running'|'failed'|'succeeded'};
export type AudioSubmission={recordingId:string;commandId:string;audio:string};
export function createAudioSubmission(bytes:Uint8Array,uuid=()=>crypto.randomUUID()):AudioSubmission {
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return {recordingId:uuid(),commandId:uuid(),audio:btoa(binary)};
}
// An absent result is not evidence of a failed request: its response may be delayed.
// Only an explicit terminal failure permits a new provider attempt; the recording ID stays fixed.
export function recoverAudioSubmission(pending:AudioSubmission,resultIds:readonly string[],receipt?:AudioReceipt,uuid=()=>crypto.randomUUID()):AudioSubmission|null {
 if(resultIds.includes(pending.recordingId))return null;
 if(receipt?.commandId===pending.commandId&&receipt.status==='failed')return {...pending,commandId:uuid()};
 return pending;
}
