CREATE TABLE `study_activity` (
	`user_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`seconds` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `attempt_id`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`user_id` text PRIMARY KEY NOT NULL,
	`result` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `writing_drafts` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`body` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`daily_goal` integer DEFAULT 20 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`score` integer NOT NULL,
	`completed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `content_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`user_id` text NOT NULL,
	`word_id` text NOT NULL,
	`due_at` integer NOT NULL,
	`interval_days` integer DEFAULT 0 NOT NULL,
	`repetitions` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `word_id`)
);
