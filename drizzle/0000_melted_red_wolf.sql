CREATE TABLE `anime` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`total_episode` integer NOT NULL,
	`cover` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`first_episode_timestamp` integer NOT NULL,
	`event_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anime_name_unique` ON `anime` (`name`);