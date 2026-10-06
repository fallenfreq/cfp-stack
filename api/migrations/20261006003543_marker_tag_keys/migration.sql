/*
 Generated, then finished by hand: rebuilds marker_tags, which nothing points at, so dropping the
 old one deletes no other rows (on D1 the PRAGMA lines do nothing: docs/database.md, "How we use
 it"). It gets a key, so a marker carries a tag once, and an index on tag_id. A tag's name is
 unique. By hand: a name stored twice keeps its first tag, the pairs move to it, once each, and
 the other copies go. A pair whose tag isn't there gets no tag, which stops the migration.
*/
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_marker_tags` (
	`marker_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	CONSTRAINT `marker_tags_pk` PRIMARY KEY(`marker_id`, `tag_id`),
	CONSTRAINT `marker_tags_marker_id_map_markers_map_markers_id_fk` FOREIGN KEY (`marker_id`) REFERENCES `map_markers`(`map_markers_id`) ON DELETE CASCADE,
	CONSTRAINT `marker_tags_tag_id_tags_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`tag_id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_marker_tags`(`marker_id`, `tag_id`)
SELECT DISTINCT `marker_id`, (
	SELECT min(`same`.`tag_id`) FROM `tags` JOIN `tags` AS `same` ON `same`.`name` = `tags`.`name`
	WHERE `tags`.`tag_id` = `marker_tags`.`tag_id`
) FROM `marker_tags`;--> statement-breakpoint
DROP TABLE `marker_tags`;--> statement-breakpoint
ALTER TABLE `__new_marker_tags` RENAME TO `marker_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `marker_tags_tag_id_idx` ON `marker_tags` (`tag_id`);--> statement-breakpoint
DELETE FROM `tags` WHERE `tag_id` NOT IN (SELECT min(`tag_id`) FROM `tags` GROUP BY `name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);