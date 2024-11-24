import { integer, text, real, sqliteTable } from 'drizzle-orm/sqlite-core'

// Map Markers Table
export const mapMarkers = sqliteTable('map_markers', {
  mapMarkersId: integer('map_markers_id').primaryKey(),
  title: text('title', { length: 256 }).notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull()
})

// Tags Table
export const tags = sqliteTable('tags', {
  tagId: integer('tag_id').primaryKey(),
  name: text('name', { length: 128 }).notNull()
})

// Marker_Tags Join Table
export const markerTags = sqliteTable('marker_tags', {
  markerId: integer('marker_id')
    .notNull()
    .references(() => mapMarkers.mapMarkersId, { onDelete: 'cascade' }),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.tagId, { onDelete: 'cascade' })
})

export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert

export type mapMarkers = typeof mapMarkers.$inferSelect
export type NewMapMarkers = typeof mapMarkers.$inferInsert

export type markerTags = typeof markerTags.$inferSelect
export type NewMarkerTags = typeof markerTags.$inferInsert
