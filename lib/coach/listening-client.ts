import type {ListeningSession} from './listening-types';

// Playback acknowledgement and saved answers can arrive out of order. A stale
// acknowledgement must not replace newer answers or reopen a submitted exercise.
export function mergeListeningSession(previous:ListeningSession,incoming:ListeningSession):ListeningSession{
 if(previous.attempt.id!==incoming.attempt.id)return previous;
 if(incoming.attempt.revision<previous.attempt.revision)return incoming.attempt.played&&!previous.attempt.played
  ?{...previous,attempt:{...previous.attempt,played:true}}:previous;
 return {...incoming,attempt:{...incoming.attempt,played:previous.attempt.played||incoming.attempt.played}};
}