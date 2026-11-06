CREATE TABLE `coach_vocabulary_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`user_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`content_version` integer NOT NULL,
	`part` text NOT NULL,
	`status` text NOT NULL,
	`request_id` text,
	`model` text,
	`voice` text,
	`error_code` text,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coach_vocabulary_call_profile` ON `coach_vocabulary_calls` (`profile_id`,`status`);--> statement-breakpoint
CREATE INDEX `coach_vocabulary_call_user` ON `coach_vocabulary_calls` (`user_id`,`created_at`);