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
	},
	(t) => [uniqueIndex('site_pages_slug_unique').on(t.slug)],
)

export type SitePage = typeof sitePages.$inferSelect
export type NewSitePage = typeof sitePages.$inferInsert
