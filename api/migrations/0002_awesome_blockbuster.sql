ALTER TABLE `portfolio_items` RENAME TO `portfolio_entries`;--> statement-breakpoint
ALTER TABLE `portfolio_entries` RENAME COLUMN `id` TO `portfolio_entry_id`;