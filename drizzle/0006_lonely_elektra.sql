-- D1 migration runs in one transaction; preserve all referencing records.
PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_coach_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`scenario_id` text,
	`scenario_version` integer NOT NULL,
	`practice_type` text DEFAULT 'scenario' NOT NULL,
	`practice_topic` text,
	`practice_snapshot` text,
	`language` text NOT NULL,
	`level` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`summary` text,
	`consent_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `coach_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_coach_conversations`("id", "profile_id", "scenario_id", "scenario_version", "practice_type", "practice_topic", "practice_snapshot", "language", "level", "mode", "status", "summary", "consent_version", "created_at", "ended_at") SELECT "id", "profile_id", "scenario_id", "scenario_version", 'scenario', NULL, NULL, "language", "level", "mode", "status", "summary", "consent_version", "created_at", "ended_at" FROM `coach_conversations`;--> statement-breakpoint
DROP TABLE `coach_conversations`;--> statement-breakpoint
ALTER TABLE `__new_coach_conversations` RENAME TO `coach_conversations`;--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;--> statement-breakpoint
CREATE INDEX `coach_conversation_profile` ON `coach_conversations` (`profile_id`,`created_at`);