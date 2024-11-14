import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
export const portfolioEntries = sqliteTable('portfolio_entries', {
  portfolioEntryId: integer('portfolio_entry_id').primaryKey(),
  title: text('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url', { length: 256 }).notNull(),
  link: text('link', { length: 256 }).notNull(),
  content: text('content', { mode: 'json' }).notNull() //.$type<{ foo: string }>()
})

export type PortfolioEntry = typeof portfolioEntries.$inferSelect
export type NewPortfolioEntry = typeof portfolioEntries.$inferInsert
