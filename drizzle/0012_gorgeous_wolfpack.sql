CREATE TABLE `app_data_controls` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_delete_id` text,
	`last_scope` text,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `app_data_guards` (
	`id` text PRIMARY KEY NOT NULL,
	`expected_revision` integer NOT NULL,
	`actual_revision` integer NOT NULL,
	CONSTRAINT "app_data_guard_revision" CHECK("app_data_guards"."expected_revision" = "app_data_guards"."actual_revision")
);
--> statement-breakpoint
CREATE TABLE `app_privacy_confirmations` (
	`user_id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`scope` text NOT NULL,
	`revision` integer NOT NULL,
	`expires_at` integer NOT NULL
);
