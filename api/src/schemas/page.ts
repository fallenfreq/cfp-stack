import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const sitePages = sqliteTable('site_pages', {
	pageId: integer('page_id').primaryKey({ autoIncrement: true }),
	slug: text('slug', { length: 256 }).notNull().unique(),
	name: text('name', { length: 256 }).notNull().default(''),
	imageUrl: text('image_url'),
	published: integer('published', { mode: 'boolean' }).notNull().default(false),
	contentJson: text('content_json')
		.notNull()
		.default('{"type":"doc","content":[{"type":"paragraph"}]}'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type SitePage = typeof sitePages.$inferSelect
export type NewSitePage = typeof sitePages.$inferInsert
