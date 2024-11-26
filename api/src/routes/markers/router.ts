// TODO: seperate services from router
import { secureProcedure, router } from '../../config/trpc.js'
import {
  tags as tagsSchema,
  mapMarkers as mapMarkersSchema,
  markerTags as markerTagsSchema
} from '../../schemas/mapMarker.js'
import { eq, or, ilike, gte, lte, and, sql } from 'drizzle-orm'
import { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import { type schemas } from '../../config/trpc.js'
import { type DrizzleD1Database } from 'drizzle-orm/d1'

const lower = (column: SQLiteColumn) => sql`LOWER(${column})`

const insertMarkerValidator = z.object({
  tags: z.array(z.string()),
  title: z.string(),
  lat: z.number(),
  lng: z.number()
})

const normalizeTag = (tag: string) => tag.trim().toLowerCase().replace(/\s+/g, '-')

// Utility function for tag normalization and insertion
async function getOrInsertTag(
  db: DrizzleD1Database<typeof schemas>,
  tag: string
): Promise<{ normalizedTag: string; tagId: number }> {
  const normalizedTag = normalizeTag(tag)
  // Check if the tag already exists
  const existingTag = await db
    .select({ tagId: tagsSchema.tagId })
    .from(tagsSchema)
    .where(eq(tagsSchema.name, normalizedTag))
    .limit(1)
    .then((tags) => tags[0])

  if (existingTag) {
    return { normalizedTag, tagId: existingTag.tagId }
  }

  // Insert the new tag and get its ID
  const newTag = await db
    .insert(tagsSchema)
    .values({ name: normalizedTag })
    .returning({ tagId: tagsSchema.tagId })
    .then((tags) => tags[0])

  if (!newTag) {
    throw new Error(`Failed to insert the tag: ${normalizedTag}`)
  }

  return { normalizedTag, tagId: newTag.tagId }
}

export const markersRouter = router({
  insert: secureProcedure.input(insertMarkerValidator).mutation(async ({ input, ctx: { db } }) => {
    const { tags, ...markerData } = input
    if (markerData.title) {
      markerData.title = markerData.title.trim()
    }

    // Insert the marker into the mapMarkers table
    const newMarker = await db
      .insert(mapMarkersSchema)
      .values(markerData)
      .returning({
        mapMarkersId: mapMarkersSchema.mapMarkersId,
        lat: mapMarkersSchema.lat,
        lng: mapMarkersSchema.lng,
        title: mapMarkersSchema.title
      })
      .then((markers) => markers[0])

    if (!newMarker) {
      throw new Error('Failed to insert the marker')
    }

    const filteredTags = tags.filter(Boolean)
    const tagsAndIds = await Promise.all(filteredTags.map((tag) => getOrInsertTag(db, tag)))
    // Insert into the markerTags join table
    // normalizedTags, tagIds
    if (tagsAndIds.length > 0) {
      await db.insert(markerTagsSchema).values(
        tagsAndIds.map(({ tagId }) => ({
          markerId: newMarker.mapMarkersId,
          tagId
        }))
      )
    }

    return {
      success: true,
      marker: newMarker,
      tags: tagsAndIds.map(({ normalizedTag }) => normalizedTag)
    }
  }),

  select: secureProcedure
    .input(
      z.object({
        search: z
          .union([
            z.string(),
            z.number(),
            z.object({
              lat: z.number(),
              lng: z.number()
            })
          ])
          .optional(),
        exactSearch: z.boolean().default(false)
      })
    )
    .query(async ({ input: { search, exactSearch }, ctx: { db } }) => {
      // Function to handle case-insensitive LIKE or exact comparison
      const matchString = (column: SQLiteColumn, value: string) =>
        exactSearch ? eq(lower(column), value.toLowerCase()) : ilike(column, `%${value.trim()}%`)

      // Function to handle lat/lng matching
      const matchLatLng = (
        latColumn: SQLiteColumn,
        lngColumn: SQLiteColumn,
        lat: number,
        lng: number
      ) =>
        exactSearch
          ? and(eq(latColumn, lat), eq(lngColumn, lng))
          : and(
              // Adjust tolerance as needed
              gte(latColumn, lat - 0.01),
              lte(latColumn, lat + 0.01),
              gte(lngColumn, lng - 0.01),
              lte(lngColumn, lng + 0.01)
            )

      // Build the WHERE condition based on search type
      const whereCondition =
        search == null
          ? undefined // No search, no condition
          : typeof search === 'number'
            ? eq(mapMarkersSchema.mapMarkersId, search)
            : typeof search === 'string'
              ? or(
                  matchString(mapMarkersSchema.title, search),
                  matchString(tagsSchema.name, normalizeTag(search))
                )
              : search.lat != null && search.lng != null
                ? matchLatLng(mapMarkersSchema.lat, mapMarkersSchema.lng, search.lat, search.lng)
                : undefined

      const aggregate = await db
        .select({
          mapMarkersId: mapMarkersSchema.mapMarkersId,
          title: mapMarkersSchema.title,
          lat: mapMarkersSchema.lat,
          lng: mapMarkersSchema.lng,
          tags: sql<string>`GROUP_CONCAT(${tagsSchema.name}, ',')`.as('tags')
        })
        .from(mapMarkersSchema)
        .leftJoin(markerTagsSchema, eq(mapMarkersSchema.mapMarkersId, markerTagsSchema.markerId))
        .leftJoin(tagsSchema, eq(markerTagsSchema.tagId, tagsSchema.tagId))
        .where(whereCondition)
        .groupBy(
          mapMarkersSchema.mapMarkersId,
          mapMarkersSchema.title,
          mapMarkersSchema.lat,
          mapMarkersSchema.lng
        )

      // Convert the grouped results to an array
      return aggregate.map((row) => ({
        ...row,
        tags: row.tags ? row.tags.split(',') : []
      }))
    }),

  delete: secureProcedure.input(z.number()).mutation(async ({ input, ctx: { db } }) => {
    // Removing all empty tags before deleting the tag
    // This is only here for development purposes since no empty tags should exist
    // console.log('Removing empty tags before deleting the tag')
    // removeEmptyTags(db)
    //   .then(() => {
    //     console.log('Empty tags removed successfully')
    //   })
    //   .catch((error) => {
    //     console.error('Error removing empty tags:', error)
    //   })
    return db.delete(mapMarkersSchema).where(eq(mapMarkersSchema.mapMarkersId, input)).execute()
  }),

  addTagsToMarker: secureProcedure
    .input(
      z.object({
        markerId: z.number(),
        tags: z.string()
      })
    )
    .mutation(async ({ input: { markerId, tags }, ctx: { db } }) => {
      return await Promise.all(
        tags
          .split(',')
          .filter(Boolean)
          .map(async (tag) => {
            const { tagId } = await getOrInsertTag(db, tag)
            await db.insert(markerTagsSchema).values({ markerId, tagId }).execute()
            return tag
          })
      )
    }),

  deleteTagFromMarker: secureProcedure
    .input(
      z.object({
        markerId: z.number(),
        tag: z.string()
      })
    )
    .mutation(async ({ input: { markerId, tag }, ctx: { db } }) => {
      const normalizedTag = normalizeTag(tag)

      // Find the tagId for the provided tag
      const existingTag = await db
        .select({ tagId: tagsSchema.tagId })
        .from(tagsSchema)
        .where(eq(tagsSchema.name, normalizedTag))
        .limit(1)
        .then((tags) => tags[0])

      if (!existingTag) {
        throw new Error(`Tag '${tag}' does not exist.`)
      }

      const tagId = existingTag.tagId

      // Delete the association from the markerTags table
      const result = await db
        .delete(markerTagsSchema)
        .where(and(eq(markerTagsSchema.markerId, markerId), eq(markerTagsSchema.tagId, tagId)))
        .execute()

      return result
    }),

  deleteTag: secureProcedure
    .input(z.union([z.number(), z.string()]))
    .mutation(async ({ input, ctx: { db } }) => {
      return db
        .delete(tagsSchema)
        .where(typeof input === 'number' ? eq(tagsSchema.tagId, input) : eq(tagsSchema.name, input))
        .execute()
    })
})

// Function to remove empty tags from the database
// async function removeEmptyTags(db: appDb): Promise<void> {
//   const emptyTags = await db
//     .select({ tagId: tagsSchema.tagId })
//     .from(tagsSchema)
//     .where(eq(tagsSchema.name, ''))
//     .execute()

//   if (emptyTags.length > 0) {
//     await db
//       .delete(tagsSchema)
//       .where(
//         inArray(
//           tagsSchema.tagId,
//           emptyTags.map((tag) => tag.tagId)
//         )
//       )
//       .execute()
//   }
// }
