import type {AudioReceipt} from './audio-submission';

// Caller has already verified the owning profile and expired abandoned operations.
// Only expose the requested audio operation status, not provider data, fingerprints or payloads.
export async function audioReceipt(db:D1Database,kind:'conversation'|'exam',ownerId:string,userId:string,commandId:string):Promise<AudioReceipt>{
 const row=kind==='conversation'
  ?await db.prepare("SELECT status FROM coach_service_calls WHERE id=? AND conversation_id=? AND user_id=? AND operation='audio'").bind(commandId,ownerId,userId).first<{status:AudioReceipt['status']}>()
  :await db.prepare("SELECT status FROM coach_exam_response_calls WHERE id=? AND attempt_id=? AND user_id=? AND operation='audio'").bind(commandId,ownerId,userId).first<{status:AudioReceipt['status']}>();
 return {commandId,status:row?.status??'not-found'};
}
