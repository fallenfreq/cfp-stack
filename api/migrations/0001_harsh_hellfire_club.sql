CREATE TABLE `portfolio_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text(256) NOT NULL,
	`description` text NOT NULL,
	`image_url` text(256) NOT NULL,
	`link` text(256) NOT NULL
);
