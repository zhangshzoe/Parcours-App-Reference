ALTER TABLE `coach_exam_attempts` ADD `mode` text DEFAULT 'timed' NOT NULL;--> statement-breakpoint
ALTER TABLE `coach_exam_attempts` ADD `help` text DEFAULT '{}' NOT NULL;