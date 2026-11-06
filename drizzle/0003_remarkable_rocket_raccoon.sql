CREATE TABLE `coach_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`scenario_id` text NOT NULL,
	`scenario_version` integer NOT NULL,
	`language` text NOT NULL,
	`level` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`summary` text,
	`consent_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_conversation_profile` ON `coach_conversations` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `coach_service_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`operation` text NOT NULL,
	`fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`error_code` text,
	`request_id` text,
	`model` text,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `coach_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_service_user_time` ON `coach_service_calls` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `coach_service_conversation` ON `coach_service_calls` (`conversation_id`,`status`);--> statement-breakpoint
CREATE TABLE `coach_transcript_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`turn_id` text NOT NULL,
	`revision` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`turn_id`) REFERENCES `coach_turns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_transcript_revision` ON `coach_transcript_revisions` (`turn_id`,`revision`);--> statement-breakpoint
CREATE TABLE `coach_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`input_kind` text NOT NULL,
	`original_transcript` text NOT NULL,
	`accepted_text` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`recording_ms` integer DEFAULT 0 NOT NULL,
	`feedback` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `coach_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_turn_sequence` ON `coach_turns` (`conversation_id`,`sequence`);