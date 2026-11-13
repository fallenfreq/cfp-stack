import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const sitePages = sqliteTable(
	'site_pages',
	{
		pageId: integer('page_id').primaryKey({ autoIncrement: true }),
		slug: text('slug', { length: 256 }).notNull(),
		name: text('name', { length: 256 }).notNull().default(''),
		imageUrl: text('image_url'),
		published: integer('published', { mode: 'boolean' }).notNull().default(false),
		contentJson: text('content_json')
			.notNull()
			.default('{"type":"doc","content":[{"type":"paragraph"}]}'),
		createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		// Its content's version, which only goes up, and the editor that saved it last (a key each
		// editor makes as it opens a page): what a save is taken by (the pages router's `save`).
		version: integer('version').notNull().default(1),
		savedFrom: text('saved_from', { length: 36 }),
	},
	(t) => [
		uniqueIndex('site_pages_slug_unique').on(t.slug),
		uniqueIndex('site_pages_saved_from_unique').on(t.savedFrom),
	],
)

export type SitePage = typeof sitePages.$inferSelect
export type NewSitePage = typeof sitePages.$inferInsert
