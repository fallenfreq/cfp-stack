CREATE TABLE `catagories` (
	`catagory_id` integer PRIMARY KEY NOT NULL,
	`catagory` text(40) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catagories_posts` (
	`catagory_id` integer NOT NULL,
	`post_id` integer NOT NULL,
	PRIMARY KEY(`catagory_id`, `post_id`),
	FOREIGN KEY (`catagory_id`) REFERENCES `catagories`(`catagory_id`) ON UPDATE no action ON DELETE no action,
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
