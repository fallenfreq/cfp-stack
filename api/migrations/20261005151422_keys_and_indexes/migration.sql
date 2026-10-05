/*
 Generated, then read: rebuilds two tables nothing points at, so dropping the old ones deletes no
 other rows (on D1 the PRAGMA lines do nothing: docs/database.md, "How we use it"). Their keys
 take the schema's column order, which 0.20 had sorted, and two foreign keys get an index.
*/
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_class_rule_classes` (
	`rule_id` integer NOT NULL,
	`class_name` text(128) NOT NULL,
	CONSTRAINT `class_rule_classes_pk` PRIMARY KEY(`rule_id`, `class_name`),
	CONSTRAINT `class_rule_classes_rule_id_class_rules_id_fk` FOREIGN KEY (`rule_id`) REFERENCES `class_rules`(`id`) ON DELETE CASCADE,
	CONSTRAINT `class_rule_classes_class_name_class_vocabulary_name_fk` FOREIGN KEY (`class_name`) REFERENCES `class_vocabulary`(`name`)
);
--> statement-breakpoint
INSERT INTO `__new_class_rule_classes`(`rule_id`, `class_name`) SELECT `rule_id`, `class_name` FROM `class_rule_classes`;--> statement-breakpoint
DROP TABLE `class_rule_classes`;--> statement-breakpoint
ALTER TABLE `__new_class_rule_classes` RENAME TO `class_rule_classes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_theme_tokens` (
	`theme_id` text(36) NOT NULL,
	`name` text(128) NOT NULL,
	`value` text(512) NOT NULL,
	`kind` text(32) NOT NULL,
	CONSTRAINT `theme_tokens_pk` PRIMARY KEY(`theme_id`, `name`),
	CONSTRAINT `theme_tokens_theme_id_themes_id_fk` FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_theme_tokens`(`theme_id`, `name`, `value`, `kind`) SELECT `theme_id`, `name`, `value`, `kind` FROM `theme_tokens`;--> statement-breakpoint
DROP TABLE `theme_tokens`;--> statement-breakpoint
ALTER TABLE `__new_theme_tokens` RENAME TO `theme_tokens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `class_rule_classes_class_name_idx` ON `class_rule_classes` (`class_name`);--> statement-breakpoint
CREATE INDEX `class_rules_theme_id_idx` ON `class_rules` (`theme_id`);