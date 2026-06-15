import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const siteTags = sqliteTable('site_tags', {
	tagId: integer('tag_id').primaryKey({ autoIncrement: true }),
	name: text('name', { length: 256 }).notNull(),
	slug: text('slug', { length: 256 }).notNull().unique(),
	published: integer('published', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type SiteTag = typeof siteTags.$inferSelect
export type NewSiteTag = typeof siteTags.$inferInsert
