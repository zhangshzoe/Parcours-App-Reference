CREATE TABLE `coach_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`content_version` integer NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`answer` integer,
	`writing` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`result` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_attempt_profile_status` ON `coach_attempts` (`profile_id`,`status`);--> statement-breakpoint
CREATE TABLE `coach_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`local_date` text NOT NULL,
	`goal_revision` integer NOT NULL,
	`tasks` text NOT NULL,
	`rule_version` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_plan_date_goal` ON `coach_plans` (`profile_id`,`local_date`,`goal_revision`);--> statement-breakpoint
CREATE TABLE `coach_review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`item_id` text NOT NULL,
	`grade` text NOT NULL,
	`previous_revision` integer NOT NULL,
	`next_stage` integer NOT NULL,
	`next_due_at` integer NOT NULL,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `coach_review_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_review_event_profile` ON `coach_review_events` (`profile_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `coach_review_items` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`source_key` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`due_at` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_review_source` ON `coach_review_items` (`profile_id`,`source_key`);--> statement-breakpoint
CREATE INDEX `coach_review_due` ON `coach_review_items` (`profile_id`,`due_at`);