import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const themes = sqliteTable('themes', {
	slug: text('slug', { length: 64 }).primaryKey(),
	name: text('name', { length: 256 }).notNull(),
	activationClass: text('activation_class', { length: 64 }),
	isRoot: integer('is_root', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const themeTokens = sqliteTable(
	'theme_tokens',
	{
		themeSlug: text('theme_slug', { length: 64 })
			.notNull()
			.references(() => themes.slug, { onDelete: 'cascade', onUpdate: 'cascade' }),
		name: text('name', { length: 128 }).notNull(),
		value: text('value', { length: 512 }).notNull(),
		kind: text('kind', { length: 32 }).notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.themeSlug, table.name] }),
	}),
)

export type Theme = typeof themes.$inferSelect
export type NewTheme = typeof themes.$inferInsert
export type ThemeToken = typeof themeTokens.$inferSelect
export type NewThemeToken = typeof themeTokens.$inferInsert
