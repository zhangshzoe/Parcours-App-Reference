CREATE TABLE `coach_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`revision` integer NOT NULL,
	`goal` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_goal_revision` ON `coach_goals` (`profile_id`,`revision`);--> statement-breakpoint
CREATE TABLE `coach_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`language` text NOT NULL,
	`goal` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_command` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_profile_owner_language` ON `coach_profiles` (`user_id`,`language`);