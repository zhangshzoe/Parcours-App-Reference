import {sql} from 'drizzle-orm';
import {sqliteTable,text,integer,primaryKey,uniqueIndex,index,check} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{userId:text('user_id').primaryKey(),name:text('name').notNull().default(''),dailyGoal:integer('daily_goal').notNull().default(20)});
export const progress=sqliteTable('lesson_progress',{userId:text('user_id').notNull(),lessonId:text('lesson_id').notNull(),score:integer('score').notNull(),completedAt:integer('completed_at').notNull()},t=>[primaryKey({columns:[t.userId,t.lessonId]})]);
export const activity=sqliteTable('study_activity',{userId:text('user_id').notNull(),attemptId:text('attempt_id').notNull(),lessonId:text('lesson_id').notNull(),seconds:integer('seconds').notNull(),createdAt:integer('created_at').notNull()},t=>[primaryKey({columns:[t.userId,t.attemptId]})]);
export const reviews=sqliteTable('reviews',{userId:text('user_id').notNull(),wordId:text('word_id').notNull(),dueAt:integer('due_at').notNull(),interval:integer('interval_days').notNull().default(0),repetitions:integer('repetitions').notNull().default(0)},t=>[primaryKey({columns:[t.userId,t.wordId]})]);
export const drafts=sqliteTable('writing_drafts',{userId:text('user_id').notNull(),lessonId:text('lesson_id').notNull(),body:text('body').notNull(),updatedAt:integer('updated_at').notNull()},t=>[primaryKey({columns:[t.userId,t.lessonId]})]);
export const assessments=sqliteTable('assessments',{userId:text('user_id').primaryKey(),result:text('result').notNull(),updatedAt:integer('updated_at').notNull()});
export const reports=sqliteTable('content_reports',{id:text('id').primaryKey(),userId:text('user_id').notNull(),lessonId:text('lesson_id').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull()});

export const coachProfiles=sqliteTable('coach_profiles',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),language:text('language').notNull(),
 goal:text('goal').notNull(),revision:integer('revision').notNull().default(0),lastCommand:text('last_command').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('coach_profile_owner_language').on(t.userId,t.language)]);
export const coachGoals=sqliteTable('coach_goals',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),
 revision:integer('revision').notNull(),goal:text('goal').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('coach_goal_revision').on(t.profileId,t.revision)]);
export const coachAttempts=sqliteTable('coach_attempts',{
 snapshot:text('snapshot'),listeningId:text('listening_id').references(()=>coachListeningAttempts.id),conversationId:text('conversation_id').references(()=>coachConversations.id),fullCompletedAt:integer('full_completed_at'),
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),lessonId:text('lesson_id').notNull(),contentVersion:integer('content_version').notNull(),
 status:text('status').notNull().default('in_progress'),answer:integer('answer'),writing:text('writing').notNull().default(''),revision:integer('revision').notNull().default(0),
 result:text('result'),createdAt:integer('created_at').notNull(),completedAt:integer('completed_at'),
},t=>[index('coach_attempt_profile_status').on(t.profileId,t.status)]);
export const coachPlans=sqliteTable('coach_plans',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),localDate:text('local_date').notNull(),goalRevision:integer('goal_revision').notNull(),
 tasks:text('tasks').notNull(),ruleVersion:text('rule_version').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('coach_plan_date_goal').on(t.profileId,t.localDate,t.goalRevision)]);
export const coachReviewItems=sqliteTable('coach_review_items',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),sourceKey:text('source_key').notNull(),
 kind:text('kind').notNull(),payload:text('payload').notNull(),stage:integer('stage').notNull().default(0),dueAt:integer('due_at').notNull(),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('coach_review_source').on(t.profileId,t.sourceKey),index('coach_review_due').on(t.profileId,t.dueAt)]);
export const coachReviewEvents=sqliteTable('coach_review_events',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),itemId:text('item_id').notNull().references(()=>coachReviewItems.id),
 grade:text('grade').notNull(),response:text('response'),transferPrompt:text('transfer_prompt'),previousRevision:integer('previous_revision').notNull(),nextStage:integer('next_stage').notNull(),nextDueAt:integer('next_due_at').notNull(),occurredAt:integer('occurred_at').notNull(),
},t=>[index('coach_review_event_profile').on(t.profileId,t.occurredAt)]);

export const coachConversations=sqliteTable('coach_conversations',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),scenarioId:text('scenario_id'),scenarioVersion:integer('scenario_version').notNull(),
 practiceType:text('practice_type').notNull().default('scenario'),practiceTopic:text('practice_topic'),practiceSnapshot:text('practice_snapshot'),
 language:text('language').notNull(),level:text('level').notNull(),mode:text('mode').notNull(),status:text('status').notNull().default('active'),summary:text('summary'),
 consentVersion:text('consent_version').notNull(),createdAt:integer('created_at').notNull(),endedAt:integer('ended_at'),
},t=>[index('coach_conversation_profile').on(t.profileId,t.createdAt)]);
export const coachTurns=sqliteTable('coach_turns',{
 id:text('id').primaryKey(),conversationId:text('conversation_id').notNull().references(()=>coachConversations.id),sequence:integer('sequence').notNull(),inputKind:text('input_kind').notNull(),
 originalTranscript:text('original_transcript').notNull(),acceptedText:text('accepted_text'),revision:integer('revision').notNull().default(0),state:text('state').notNull().default('draft'),
 recordingMs:integer('recording_ms').notNull().default(0),feedback:text('feedback'),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('coach_turn_sequence').on(t.conversationId,t.sequence)]);
export const coachTranscriptRevisions=sqliteTable('coach_transcript_revisions',{
 id:text('id').primaryKey(),turnId:text('turn_id').notNull().references(()=>coachTurns.id),revision:integer('revision').notNull(),body:text('body').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('coach_transcript_revision').on(t.turnId,t.revision)]);
export const coachServiceCalls=sqliteTable('coach_service_calls',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),conversationId:text('conversation_id').notNull().references(()=>coachConversations.id),operation:text('operation').notNull(),
 fingerprint:text('fingerprint').notNull(),status:text('status').notNull(),errorCode:text('error_code'),requestId:text('request_id'),model:text('model'),
 createdAt:integer('created_at').notNull(),finishedAt:integer('finished_at'),
},t=>[index('coach_service_user_time').on(t.userId,t.createdAt),index('coach_service_conversation').on(t.conversationId,t.status)]);

export const coachExamAttempts=sqliteTable('coach_exam_attempts',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),paperId:text('paper_id').notNull(),
 snapshot:text('snapshot').notNull(),answers:text('answers').notNull().default('{}'),exposedItemIds:text('exposed_item_ids').notNull().default('[]'),
 mode:text('mode').notNull().default('timed'),help:text('help').notNull().default('{}'),
 status:text('status').notNull().default('active'),revision:integer('revision').notNull().default(0),
 startedAt:integer('started_at').notNull(),deadlineAt:integer('deadline_at').notNull(),submittedAt:integer('submitted_at'),result:text('result'),
},t=>[index('coach_exam_profile_status').on(t.profileId,t.status),index('coach_exam_deadline').on(t.status,t.deadlineAt)]);
export const coachExamCommands=sqliteTable('coach_exam_commands',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachExamAttempts.id),
 fingerprint:text('fingerprint').notNull(),previousRevision:integer('previous_revision').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('coach_exam_command_attempt').on(t.attemptId)]);

export const coachListeningAttempts=sqliteTable('coach_listening_attempts',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),materialId:text('material_id').notNull(),snapshot:text('snapshot').notNull(),
 status:text('status').notNull().default('active'),answers:text('answers').notNull(),revision:integer('revision').notNull().default(0),
 repeated:integer('repeated').notNull().default(0),playedCallId:text('played_call_id'),playedAt:integer('played_at'),result:text('result'),createdAt:integer('created_at').notNull(),submittedAt:integer('submitted_at'),
},t=>[index('coach_listening_profile').on(t.profileId,t.createdAt)]);
export const coachListeningCalls=sqliteTable('coach_listening_calls',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachListeningAttempts.id),userId:text('user_id').notNull(),segmentId:text('segment_id'),
 status:text('status').notNull(),requestId:text('request_id'),model:text('model'),voice:text('voice'),errorCode:text('error_code'),createdAt:integer('created_at').notNull(),finishedAt:integer('finished_at'),
},t=>[index('coach_listening_call_attempt').on(t.attemptId,t.status),index('coach_listening_call_user').on(t.userId,t.createdAt)]);
export const coachListeningCommands=sqliteTable('coach_listening_commands',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachListeningAttempts.id),fingerprint:text('fingerprint').notNull(),previousRevision:integer('previous_revision').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('coach_listening_command_attempt').on(t.attemptId)]);

export const coachAssessmentAttempts=sqliteTable('coach_assessment_attempts',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),snapshot:text('snapshot').notNull(),status:text('status').notNull().default('active'),answers:text('answers').notNull(),revision:integer('revision').notNull().default(0),repeated:integer('repeated').notNull().default(0),result:text('result'),createdAt:integer('created_at').notNull(),submittedAt:integer('submitted_at'),
},t=>[index('coach_assessment_profile').on(t.profileId,t.createdAt)]);
export const coachAssessmentCalls=sqliteTable('coach_assessment_calls',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachAssessmentAttempts.id),userId:text('user_id').notNull(),questionId:text('question_id').notNull(),status:text('status').notNull(),requestId:text('request_id'),model:text('model'),voice:text('voice'),errorCode:text('error_code'),createdAt:integer('created_at').notNull(),finishedAt:integer('finished_at'),playedAt:integer('played_at'),
},t=>[index('coach_assessment_call_attempt').on(t.attemptId,t.status),index('coach_assessment_call_user').on(t.userId,t.createdAt)]);
export const coachAssessmentCommands=sqliteTable('coach_assessment_commands',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachAssessmentAttempts.id),fingerprint:text('fingerprint').notNull(),previousRevision:integer('previous_revision').notNull(),createdAt:integer('created_at').notNull(),
},t=>[index('coach_assessment_command_attempt').on(t.attemptId)]);

export const coachVocabularyCalls=sqliteTable('coach_vocabulary_calls',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>coachProfiles.id),userId:text('user_id').notNull(),entryId:text('entry_id').notNull(),contentVersion:integer('content_version').notNull(),part:text('part').notNull(),status:text('status').notNull(),requestId:text('request_id'),model:text('model'),voice:text('voice'),errorCode:text('error_code'),createdAt:integer('created_at').notNull(),finishedAt:integer('finished_at'),
},t=>[index('coach_vocabulary_call_profile').on(t.profileId,t.status),index('coach_vocabulary_call_user').on(t.userId,t.createdAt)]);

export const coachExamAudioCalls=sqliteTable('coach_exam_audio_calls',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachExamAttempts.id),userId:text('user_id').notNull(),audioKey:text('audio_key').notNull(),status:text('status').notNull(),requestId:text('request_id'),model:text('model'),voice:text('voice'),errorCode:text('error_code'),createdAt:integer('created_at').notNull(),finishedAt:integer('finished_at'),playedAt:integer('played_at'),
},t=>[index('coach_exam_audio_attempt').on(t.attemptId,t.status,t.audioKey),index('coach_exam_audio_user').on(t.userId,t.createdAt)]);

export const coachExamRecordings=sqliteTable('coach_exam_recordings',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachExamAttempts.id),itemId:text('item_id').notNull(),originalTranscript:text('original_transcript').notNull(),acceptedText:text('accepted_text'),recordingMs:integer('recording_ms').notNull(),consentVersion:text('consent_version').notNull(),createdAt:integer('created_at').notNull(),confirmedAt:integer('confirmed_at'),
},t=>[index('coach_exam_recording_attempt').on(t.attemptId,t.itemId)]);
export const coachExamFeedback=sqliteTable('coach_exam_feedback',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachExamAttempts.id),itemId:text('item_id').notNull(),recordingId:text('recording_id').references(()=>coachExamRecordings.id),body:text('body').notNull(),model:text('model').notNull(),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('coach_exam_feedback_item').on(t.attemptId,t.itemId)]);
export const coachExamRetries=sqliteTable('coach_exam_retries',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachExamAttempts.id),itemId:text('item_id').notNull(),skill:text('skill').notNull(),originalTranscript:text('original_transcript'),acceptedText:text('accepted_text'),recordingMs:integer('recording_ms'),consentVersion:text('consent_version'),body:text('body'),model:text('model'),createdAt:integer('created_at').notNull(),confirmedAt:integer('confirmed_at'),feedbackAt:integer('feedback_at'),
},t=>[index('coach_exam_retry_attempt').on(t.attemptId,t.itemId)]);
export const coachExamResponseCalls=sqliteTable('coach_exam_response_calls',{
 id:text('id').primaryKey(),attemptId:text('attempt_id').notNull().references(()=>coachExamAttempts.id),userId:text('user_id').notNull(),itemId:text('item_id').notNull(),operation:text('operation').notNull(),fingerprint:text('fingerprint').notNull(),status:text('status').notNull(),consentVersion:text('consent_version').notNull(),requestId:text('request_id'),model:text('model'),errorCode:text('error_code'),createdAt:integer('created_at').notNull(),finishedAt:integer('finished_at'),
},t=>[index('coach_exam_response_attempt').on(t.attemptId,t.status),index('coach_exam_response_user').on(t.userId,t.createdAt)]);

// Minimal deletion generation/receipt survives clearing learning data, preventing stale writes.
export const appDataControls=sqliteTable('app_data_controls',{
 userId:text('user_id').primaryKey(),revision:integer('revision').notNull().default(0),
 lastDeleteId:text('last_delete_id'),lastScope:text('last_scope'),deletedAt:integer('deleted_at'),
});
export const appPrivacyConfirmations=sqliteTable('app_privacy_confirmations',{
 userId:text('user_id').primaryKey(),token:text('token').notNull(),scope:text('scope').notNull(),revision:integer('revision').notNull(),expiresAt:integer('expires_at').notNull(),
});
// Rows exist only inside a transaction and are removed before commit.
export const appDataGuards=sqliteTable('app_data_guards',{
 id:text('id').primaryKey(),expectedRevision:integer('expected_revision').notNull(),actualRevision:integer('actual_revision').notNull(),
},t=>[check('app_data_guard_revision',sql`${t.expectedRevision} = ${t.actualRevision}`)]);

// English listening/speaking has its own profile and records; existing course IDs and coach profiles stay intact.
export const englishProfiles=sqliteTable('english_profiles',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),dailyMinutes:integer('daily_minutes').notNull().default(20),
 revision:integer('revision').notNull().default(0),lastCommand:text('last_command').notNull(),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
},t=>[uniqueIndex('english_profile_user').on(t.userId)]);
export const englishSessions=sqliteTable('english_sessions',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>englishProfiles.id),scenarioId:text('scenario_id').notNull(),
 scenarioVersion:integer('scenario_version').notNull(),difficulty:text('difficulty').notNull(),snapshot:text('snapshot').notNull(),
 status:text('status').notNull().default('listening'),answers:text('answers').notNull().default('{}'),help:text('help').notNull().default('{}'),
 listeningResult:text('listening_result'),revision:integer('revision').notNull().default(0),lastCommand:text('last_command'),
 consentVersion:text('consent_version').notNull(),createdAt:integer('created_at').notNull(),submittedAt:integer('submitted_at'),endedAt:integer('ended_at'),
},t=>[index('english_session_profile').on(t.profileId,t.createdAt)]);
export const englishTurns=sqliteTable('english_turns',{
 id:text('id').primaryKey(),sessionId:text('session_id').notNull().references(()=>englishSessions.id),sequence:integer('sequence').notNull(),
 inputKind:text('input_kind').notNull(),originalTranscript:text('original_transcript').notNull(),acceptedText:text('accepted_text'),
 revision:integer('revision').notNull().default(0),state:text('state').notNull().default('draft'),feedback:text('feedback'),
 recordingMs:integer('recording_ms').notNull().default(0),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('english_turn_sequence').on(t.sessionId,t.sequence)]);
export const englishCalls=sqliteTable('english_calls',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),sessionId:text('session_id').notNull().references(()=>englishSessions.id),
 operation:text('operation').notNull(),fingerprint:text('fingerprint').notNull(),status:text('status').notNull(),
 requestId:text('request_id'),model:text('model'),errorCode:text('error_code'),createdAt:integer('created_at').notNull(),finishedAt:integer('finished_at'),
},t=>[index('english_call_user_time').on(t.userId,t.createdAt),index('english_call_session').on(t.sessionId,t.status)]);
export const englishReviews=sqliteTable('english_reviews',{
 id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>englishProfiles.id),sessionId:text('session_id').notNull().references(()=>englishSessions.id),
 turnId:text('turn_id').references(()=>englishTurns.id),kind:text('kind').notNull(),payload:text('payload').notNull(),stage:integer('stage').notNull().default(0),
 dueAt:integer('due_at').notNull(),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull(),
},t=>[uniqueIndex('english_review_source').on(t.sessionId,t.turnId,t.kind),index('english_review_due').on(t.profileId,t.dueAt)]);
export const englishReviewEvents=sqliteTable('english_review_events',{
 id:text('id').primaryKey(),itemId:text('item_id').notNull().references(()=>englishReviews.id),profileId:text('profile_id').notNull().references(()=>englishProfiles.id),
 grade:text('grade').notNull(),answer:text('answer'),reviewMode:text('review_mode'),objectiveCorrect:integer('objective_correct'),previousRevision:integer('previous_revision').notNull(),nextStage:integer('next_stage').notNull(),
 nextDueAt:integer('next_due_at').notNull(),occurredAt:integer('occurred_at').notNull(),
},t=>[index('english_review_event_profile').on(t.profileId,t.occurredAt)]);
