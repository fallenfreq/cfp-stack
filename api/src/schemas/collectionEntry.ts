import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'
export const collectionEntries = sqliteTable('collection_entries', {
  collectionEntryId: integer('collection_entry_id').primaryKey(),
  type: text('type', { length: 256 }).notNull(),
  title: text('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url', { length: 256 }).notNull(),
  link: text('link', { length: 256 }).notNull(),
  content: text('content', { mode: 'json' }).notNull() //.$type<{ foo: string }>()
})

export type CollectionEntry = typeof collectionEntries.$inferSelect
export type NewCollectionEntry = typeof collectionEntries.$inferInsert
