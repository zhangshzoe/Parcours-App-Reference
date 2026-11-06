CREATE TABLE `coach_assessment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`answers` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`repeated` integer DEFAULT 0 NOT NULL,
	`result` text,
	`created_at` integer NOT NULL,
	`submitted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_assessment_profile` ON `coach_assessment_attempts` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `coach_assessment_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`status` text NOT NULL,
	`request_id` text,
	`model` text,
	`voice` text,
	`error_code` text,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	`played_at` integer,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_assessment_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_assessment_call_attempt` ON `coach_assessment_calls` (`attempt_id`,`status`);--> statement-breakpoint
CREATE INDEX `coach_assessment_call_user` ON `coach_assessment_calls` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `coach_assessment_commands` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`previous_revision` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_assessment_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_assessment_command_attempt` ON `coach_assessment_commands` (`attempt_id`);