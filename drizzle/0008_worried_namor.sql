ALTER TABLE `coach_attempts` ADD `snapshot` text;--> statement-breakpoint
ALTER TABLE `coach_attempts` ADD `listening_id` text REFERENCES coach_listening_attempts(id);--> statement-breakpoint
ALTER TABLE `coach_attempts` ADD `conversation_id` text REFERENCES coach_conversations(id);--> statement-breakpoint
ALTER TABLE `coach_attempts` ADD `full_completed_at` integer;