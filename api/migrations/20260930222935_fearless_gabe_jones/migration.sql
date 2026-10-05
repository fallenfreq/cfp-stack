CREATE TABLE `collection_entries` (
	`collection_entry_id` integer PRIMARY KEY NOT NULL,
	`type` text(256) NOT NULL,
	`title` text(256) NOT NULL,
	`description` text NOT NULL,
	`image_url` text(256) NOT NULL,
	`link` text(256) NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `collapse_thresholds` (
	`name` text(16) PRIMARY KEY NOT NULL,
	`value` text(32) NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `map_markers` (
	`map_markers_id` integer PRIMARY KEY NOT NULL,
	`title` text(256) NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `marker_tags` (
	`marker_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`marker_id`) REFERENCES `map_markers`(`map_markers_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`tag_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`tag_id` integer PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_pages` (
	`page_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(256) NOT NULL,
	`name` text(256) DEFAULT '' NOT NULL,
	`image_url` text,
	`published` integer DEFAULT false NOT NULL,
	`content_json` text DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}' NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `site_page_tags` (
	`page_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`page_id`, `tag_id`),
	FOREIGN KEY (`page_id`) REFERENCES `site_pages`(`page_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `site_tags`(`tag_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `site_tags` (
	`tag_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`slug` text(256) NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `class_rule_classes` (
	`rule_id` integer NOT NULL,
	`class_name` text(128) NOT NULL,
	PRIMARY KEY(`class_name`, `rule_id`),
	FOREIGN KEY (`rule_id`) REFERENCES `class_rules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_name`) REFERENCES `class_vocabulary`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `class_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`theme_id` text(36) NOT NULL,
	`css_property` text(64) NOT NULL,
	`value` text(512) NOT NULL,
	`pseudo` text(64),
	`element_selector` text(64),
	`created_at` integer NOT NULL,
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `class_vocabulary` (
	`name` text(128) PRIMARY KEY NOT NULL,
	`kind` text(32) NOT NULL,
	`pseudo` text(32),
	`description` text(512),
	`cascade_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `theme_tokens` (
	`theme_id` text(36) NOT NULL,
	`name` text(128) NOT NULL,
	`value` text(512) NOT NULL,
	`kind` text(32) NOT NULL,
	PRIMARY KEY(`name`, `theme_id`),
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`version` text(32) DEFAULT '1.0.0' NOT NULL,
	`name` text(256) NOT NULL,
	`activation_class` text(64),
	`is_root` integer DEFAULT false NOT NULL,
	`created_by` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_theme_aliases` (
	`user_id` integer NOT NULL,
	`theme_id` text(36) NOT NULL,
	`local_name` text(256) NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`theme_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`category_id` integer PRIMARY KEY NOT NULL,
	`category` text(40) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories_posts` (
	`category_id` integer NOT NULL,
	`post_id` integer NOT NULL,
	PRIMARY KEY(`category_id`, `post_id`),
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`post_id` integer PRIMARY KEY NOT NULL,
	`title` text(40),
	`body` text NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`bio` text(256),
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`email` text(256) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_pages_slug_unique` ON `site_pages` (`slug`);--> statement-breakpoint
CREATE INDEX `page_tags_tag_id_idx` ON `site_page_tags` (`tag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_tags_slug_unique` ON `site_tags` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `themes_activation_class_unique` ON `themes` (`activation_class`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_theme_aliases_user_id_local_name_unique` ON `user_theme_aliases` (`user_id`,`local_name`);