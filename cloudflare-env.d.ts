declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    COACH_AI_ENABLED?: string;
    COACH_OPENAI_API_KEY?: string;
    COACH_CHAT_MODEL?: string;
    COACH_ASR_MODEL?: string;
    COACH_TTS_MODEL?: string;
    COACH_FR_VOICE?: string;
    COACH_DE_VOICE?: string;
  }
}
