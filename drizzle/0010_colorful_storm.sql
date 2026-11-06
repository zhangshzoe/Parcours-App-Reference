CREATE TABLE `coach_exam_audio_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`audio_key` text NOT NULL,
	`status` text NOT NULL,
	`request_id` text,
	`model` text,
	`voice` text,
	`error_code` text,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	`played_at` integer,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_exam_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_exam_audio_attempt` ON `coach_exam_audio_calls` (`attempt_id`,`status`,`audio_key`);--> statement-breakpoint
CREATE INDEX `coach_exam_audio_user` ON `coach_exam_audio_calls` (`user_id`,`created_at`);