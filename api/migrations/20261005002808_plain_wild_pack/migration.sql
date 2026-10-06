DROP TABLE `user_theme_aliases`;--> statement-breakpoint
DROP TABLE `categories_posts`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
/*
 Finished by hand: drizzle-kit can't drop `themes.created_by` (a foreign key), so `themes` is
 rebuilt. D1 enforces foreign keys inside a migration, so dropping the old `themes` deletes the
 rows that cascade from it, so they're kept aside and put back (docs/database.md, "How we use it").
*/
CREATE TABLE `__keep_theme_tokens` AS SELECT * FROM `theme_tokens`;--> statement-breakpoint
CREATE TABLE `__keep_class_rules` AS SELECT * FROM `class_rules`;--> statement-breakpoint
CREATE TABLE `__keep_class_rule_classes` AS SELECT * FROM `class_rule_classes`;--> statement-breakpoint
CREATE TABLE `__new_themes` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`version` text(32) DEFAULT '1.0.0' NOT NULL,
	`name` text(256) NOT NULL,
	`activation_class` text(64),
	`is_root` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_themes` (`id`, `version`, `name`, `activation_class`, `is_root`, `created_at`, `updated_at`)
	SELECT `id`, `version`, `name`, `activation_class`, `is_root`, `created_at`, `updated_at` FROM `themes`;--> statement-breakpoint
DROP TABLE `themes`;--> statement-breakpoint
ALTER TABLE `__new_themes` RENAME TO `themes`;--> statement-breakpoint
CREATE UNIQUE INDEX `themes_activation_class_unique` ON `themes` (`activation_class`);--> statement-breakpoint
INSERT INTO `theme_tokens` SELECT * FROM `__keep_theme_tokens`;--> statement-breakpoint
INSERT INTO `class_rules` SELECT * FROM `__keep_class_rules`;--> statement-breakpoint
INSERT INTO `class_rule_classes` SELECT * FROM `__keep_class_rule_classes`;--> statement-breakpoint
DROP TABLE `__keep_theme_tokens`;--> statement-breakpoint
DROP TABLE `__keep_class_rules`;--> statement-breakpoint
DROP TABLE `__keep_class_rule_classes`;--> statement-breakpoint
DROP TABLE `users`;
