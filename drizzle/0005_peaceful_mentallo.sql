CREATE TABLE `coach_listening_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`material_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`answers` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`repeated` integer DEFAULT 0 NOT NULL,
	`played_call_id` text,
	`played_at` integer,
	`result` text,
	`created_at` integer NOT NULL,
	`submitted_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_listening_profile` ON `coach_listening_attempts` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `coach_listening_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`segment_id` text,
	`status` text NOT NULL,
	`request_id` text,
	`model` text,
	`voice` text,
	`error_code` text,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_listening_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_listening_call_attempt` ON `coach_listening_calls` (`attempt_id`,`status`);--> statement-breakpoint
CREATE INDEX `coach_listening_call_user` ON `coach_listening_calls` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `coach_listening_commands` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`previous_revision` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_listening_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_listening_command_attempt` ON `coach_listening_commands` (`attempt_id`);