import { secureProcedure, router } from '../../config/trpc.js'
import {
  mapMarkers as mapMarkersSchema,
  tags as tagsSchema,
  markerTags as markerTagsSchema
} from '../../schemas/mapMarkers.js'
import { eq, or, ilike, gte, lte, and, sql } from 'drizzle-orm'
import { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'

const lower = (column: SQLiteColumn) => sql`LOWER(${column})`

const insertMarkerValidator = z.object({
  tags: z.array(z.string()),
  title: z.string(),
  lat: z.number(),
  lng: z.number()
})

export const markersRouter = router({
  insert: secureProcedure.input(insertMarkerValidator).mutation(async ({ input, ctx: { db } }) => {
    const { tags, ...markerData } = input
    const processedTags = tags.map((tag) => tag.trim().toLowerCase())

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
      .then((markers) => markers[0]) // Safely retrieve the first marker or undefined

    if (!newMarker) {
      throw new Error('Failed to insert the marker')
    }

    const tagIds: number[] = []
    for (const tag of processedTags) {
      // Check if the tag already exists
      const existingTag = await db
        .select({ tagId: tagsSchema.tagId })
        .from(tagsSchema)
        .where(eq(tagsSchema.name, tag))
        .limit(1)
        .then((tags) => tags[0])

      let tagId: number
      if (existingTag) {
        // Use the existing tag ID
        tagId = existingTag.tagId
      } else {
        // Insert the new tag and get its ID
        const newTag = await db
          .insert(tagsSchema)
          .values({ name: tag })
          .returning({ tagId: tagsSchema.tagId })
          .then((tags) => tags[0])

        if (!newTag) {
          throw new Error(`Failed to insert the tag: ${tag}`)
        }
        tagId = newTag.tagId
      }

      tagIds.push(tagId)
    }

    // Insert into the markerTags join table
    await db.insert(markerTagsSchema).values(
      tagIds.map((tagId) => ({
        markerId: newMarker.mapMarkersId,
        tagId
      }))
    )

    return {
      success: true,
      marker: newMarker,
      tags: processedTags
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
      const matchLatLng = (latColumn: SQLiteColumn, lngColumn: any, lat: number, lng: number) =>
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
                  matchString(tagsSchema.name, search)
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
          // tags: tagsSchema.name
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
    // Drop tables in the correct order
    // you can drop tables by commenting out all schemas and running a new migration
    // await db.run(sql`DROP TABLE IF EXISTS marker_tags;`)
    // await db.run(sql`DROP TABLE IF EXISTS map_markers;`)
    // await db.run(sql`DROP TABLE IF EXISTS tags;`)
    return db.delete(mapMarkersSchema).where(eq(mapMarkersSchema.mapMarkersId, input)).execute()
  })
})
