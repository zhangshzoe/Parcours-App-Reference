CREATE TABLE `coach_exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`paper_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`exposed_item_ids` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`deadline_at` integer NOT NULL,
	`submitted_at` integer,
	`result` text,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_exam_profile_status` ON `coach_exam_attempts` (`profile_id`,`status`);--> statement-breakpoint
CREATE INDEX `coach_exam_deadline` ON `coach_exam_attempts` (`status`,`deadline_at`);--> statement-breakpoint
CREATE TABLE `coach_exam_commands` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`previous_revision` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `coach_exam_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_exam_command_attempt` ON `coach_exam_commands` (`attempt_id`);