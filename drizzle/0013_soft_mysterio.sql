CREATE TABLE `english_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`operation` text NOT NULL,
	`fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`request_id` text,
	`model` text,
	`error_code` text,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `english_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `english_call_user_time` ON `english_calls` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `english_call_session` ON `english_calls` (`session_id`,`status`);--> statement-breakpoint
CREATE TABLE `english_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_minutes` integer DEFAULT 20 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_command` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `english_profile_user` ON `english_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `english_review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`grade` text NOT NULL,
	`previous_revision` integer NOT NULL,
	`next_stage` integer NOT NULL,
	`next_due_at` integer NOT NULL,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `english_reviews`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `english_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `english_review_event_profile` ON `english_review_events` (`profile_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `english_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`session_id` text NOT NULL,
	`turn_id` text,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`due_at` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `english_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `english_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`turn_id`) REFERENCES `english_turns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `english_review_source` ON `english_reviews` (`session_id`,`turn_id`,`kind`);--> statement-breakpoint
CREATE INDEX `english_review_due` ON `english_reviews` (`profile_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `english_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`scenario_id` text NOT NULL,
	`scenario_version` integer NOT NULL,
	`difficulty` text NOT NULL,
	`snapshot` text NOT NULL,
	`status` text DEFAULT 'listening' NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`help` text DEFAULT '{}' NOT NULL,
	`listening_result` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_command` text,
	`consent_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`submitted_at` integer,
	`ended_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `english_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `english_session_profile` ON `english_sessions` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `english_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`input_kind` text NOT NULL,
	`original_transcript` text NOT NULL,
	`accepted_text` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`feedback` text,
	`recording_ms` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `english_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `english_turn_sequence` ON `english_turns` (`session_id`,`sequence`);