CREATE TABLE `coach_exam_retries` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`item_id` text NOT NULL,
	`skill` text NOT NULL,
	`original_transcript` text,
	`accepted_text` text,
	`recording_ms` integer,
	`consent_version` text,
	`body` text,
	`model` text,
	`created_at` integer NOT NULL,
	`confirmed_at` integer,
	`feedback_at` integer,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_exam_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_exam_retry_attempt` ON `coach_exam_retries` (`attempt_id`,`item_id`);