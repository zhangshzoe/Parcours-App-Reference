CREATE TABLE `coach_exam_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`item_id` text NOT NULL,
	`recording_id` text,
	`body` text NOT NULL,
	`model` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_exam_attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recording_id`) REFERENCES `coach_exam_recordings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_exam_feedback_item` ON `coach_exam_feedback` (`attempt_id`,`item_id`);--> statement-breakpoint
CREATE TABLE `coach_exam_recordings` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`item_id` text NOT NULL,
	`original_transcript` text NOT NULL,
	`accepted_text` text,
	`recording_ms` integer NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`confirmed_at` integer,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_exam_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_exam_recording_attempt` ON `coach_exam_recordings` (`attempt_id`,`item_id`);--> statement-breakpoint
CREATE TABLE `coach_exam_response_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`operation` text NOT NULL,
	`fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`consent_version` text NOT NULL,
	`request_id` text,
	`model` text,
	`error_code` text,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_exam_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_exam_response_attempt` ON `coach_exam_response_calls` (`attempt_id`,`status`);--> statement-breakpoint
CREATE INDEX `coach_exam_response_user` ON `coach_exam_response_calls` (`user_id`,`created_at`);