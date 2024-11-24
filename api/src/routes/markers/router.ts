import { secureProcedure, router } from '../../config/trpc.js'
import { mapMarkers, tags, markerTags } from '../../schemas/mapMarkers.js'
import { eq, or, like, and } from 'drizzle-orm'
import { z } from 'zod'

const insertMarkerValidator = z.object({
  tags: z.array(z.string()),
  title: z.string(),
  lat: z.number(),
  lng: z.number()
})

export const markersRouter = router({
  insert: secureProcedure.input(insertMarkerValidator).mutation(async ({ input, ctx: { db } }) => {
    const { tags: sentTags, ...markerData } = input

    // Insert the marker into the mapMarkers table
    const newMarker = await db
      .insert(mapMarkers)
      .values(markerData)
      .returning({
        mapMarkersId: mapMarkers.mapMarkersId,
        lat: mapMarkers.lat,
        lng: mapMarkers.lng,
        title: mapMarkers.title
      })
      .then((markers) => markers[0]) // Safely retrieve the first marker or undefined

    if (!newMarker) {
      throw new Error('Failed to insert the marker')
    }

    const tagIds: number[] = []
    for (const tag of sentTags) {
      // Check if the tag already exists
      const existingTag = await db
        .select({ tagId: tags.tagId })
        .from(tags)
        .where(eq(tags.name, tag))
        .limit(1)
        .then((tags) => tags[0]) // Safely retrieve the first tag or undefined

      let tagId: number
      if (existingTag) {
        // Use the existing tag ID
        tagId = existingTag.tagId
      } else {
        // Insert the new tag and get its ID
        const newTag = await db
          .insert(tags)
          .values({ name: tag })
          .returning({ tagId: tags.tagId })
          .then((tags) => tags[0]) // Safely retrieve the first tag or undefined

        if (!newTag) {
          throw new Error(`Failed to insert the tag: ${tag}`)
        }
        tagId = newTag.tagId
      }

      tagIds.push(tagId)
    }

    // Insert into the markerTags join table
    await db.insert(markerTags).values(
      tagIds.map((tagId) => ({
        markerId: newMarker.mapMarkersId,
        tagId
      }))
    )

    return {
      success: true,
      marker: newMarker,
      tags: sentTags
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
          .optional()
      })
    )
    .query(async ({ input: { search }, ctx: { db } }) => {
      // Fetch markers and tags based on the search condition
      const rows = await db
        .select({
          mapMarkersId: mapMarkers.mapMarkersId,
          title: mapMarkers.title,
          lat: mapMarkers.lat,
          lng: mapMarkers.lng,
          tagName: tags.name // Tag name from the tags table
        })
        .from(mapMarkers)
        .leftJoin(markerTags, eq(mapMarkers.mapMarkersId, markerTags.markerId)) // Join with markerTags
        .leftJoin(tags, eq(markerTags.tagId, tags.tagId)) // Join with tags
        .where(
          search // Or use searchNumber, searchObject as needed
            ? typeof search === 'number'
              ? eq(mapMarkers.mapMarkersId, search)
              : typeof search === 'string'
                ? or(like(mapMarkers.title, `%${search}%`), like(tags.name, `%${search}%`))
                : search?.lat && search?.lng
                  ? and(eq(mapMarkers.lat, search.lat), eq(mapMarkers.lng, search.lng))
                  : undefined
            : undefined
        )

      // Group results by marker ID
      const groupedResults = rows.reduce(
        (acc, row) => {
          const { mapMarkersId, title, lat, lng, tagName } = row

          // Initialize the marker entry if it doesn't exist
          const marker = (acc[mapMarkersId] ||= {
            mapMarkersId,
            title,
            lat,
            lng,
            tags: [] // Start with an empty array for tags
          })

          // Add the tag to the tags array if it's not already present
          if (tagName && !marker.tags.includes(tagName)) {
            marker.tags.push(tagName)
          }

          return acc
        },
        {} as Record<
          number,
          { mapMarkersId: number; title: string; lat: number; lng: number; tags: string[] }
        >
      )

      // Convert the grouped results to an array
      const groupedArray = Object.values(groupedResults)

      console.log('Grouped Results:', groupedArray)

      return groupedArray
    }),

  delete: secureProcedure.input(z.number()).mutation(async ({ input, ctx: { db } }) => {
    // Drop tables in the correct order
    // you can drop tables by commenting out all schemas and running a new migration
    // await db.run(sql`DROP TABLE IF EXISTS marker_tags;`)
    // await db.run(sql`DROP TABLE IF EXISTS map_markers;`)
    // await db.run(sql`DROP TABLE IF EXISTS tags;`)
    return db.delete(mapMarkers).where(eq(mapMarkers.mapMarkersId, input)).execute()
  })
})
