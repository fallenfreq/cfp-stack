ALTER TABLE `site_pages` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `site_pages` ADD `saved_from` text(36);--> statement-breakpoint
CREATE UNIQUE INDEX `site_pages_saved_from_unique` ON `site_pages` (`saved_from`);