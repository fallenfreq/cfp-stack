CREATE TABLE `sessions` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`provider_session_id` text,
	`name` text,
	`email` text,
	`roles` text NOT NULL,
	`auth_time` integer,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer NOT NULL,
	`refresh_lease` text,
	`refresh_lease_until` integer,
	`checked_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
