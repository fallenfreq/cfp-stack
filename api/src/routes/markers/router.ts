// TODO: separate services from router
import { and, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'
import { type DrizzleD1Database } from 'drizzle-orm/d1'
import { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import { router, secureProcedure, type schemas } from '../../config/trpc.js'
import {
	mapMarkers as mapMarkersSchema,
	markerTags as markerTagsSchema,
	tags as tagsSchema,
} from '../../schemas/mapMarker.js'

const lower = (column: SQLiteColumn) => sql`LOWER(${column})`

const insertMarkerValidator = z.object({
	tags: z.array(z.string()),
	title: z.string(),
	lat: z.number(),
	lng: z.number(),
})

const updateMarkerValidator = z.object({
	markerId: z.number(),
	title: z.string().optional(),
	lat: z.number().optional(),
	lng: z.number().optional(),
	tags: z.array(z.string()).optional(),
})

type Defined<T> = T extends undefined ? never : T

const filterUndefined = <T extends Record<string, any>>(
	obj: T,
): {
	[K in keyof T as T[K] extends undefined ? never : K]: Defined<T[K]>
} => {
	return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as any
}

const normalizeTag = (tag: string) => tag.trim().toLowerCase().replace(/\s+/g, '-')
const normalizeTags = (tags: string[]) => {
	const normalized = tags.filter(Boolean).map(normalizeTag)
	return Array.from(new Set(normalized))
}

// Utility function for tag normalization and insertion
// normalize tags before calling getOrInsertTag
async function getOrInsertTag(
	db: DrizzleD1Database<typeof schemas>,
	normalizedTag: string,
): Promise<{ normalizedTag: string; tagId: number }> {
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
	insert: secureProcedure
		.input(insertMarkerValidator)
		.mutation(async ({ input, ctx: { db } }) => {
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
					title: mapMarkersSchema.title,
				})
				.then((markers) => markers[0])

			if (!newMarker) {
				throw new Error('Failed to insert the marker')
			}

			const normalizedTags = normalizeTags(tags)
			const tagsAndIds = await Promise.all(
				normalizedTags.map((tag) => getOrInsertTag(db, tag)),
			)

			// Insert into the markerTags join table
			// normalizedTags, tagIds
			if (tagsAndIds.length > 0) {
				await db.insert(markerTagsSchema).values(
					tagsAndIds.map(({ tagId }) => ({
						markerId: newMarker.mapMarkersId,
						tagId,
					})),
				)
			}

			return {
				success: true,
				marker: newMarker,
				tags: tagsAndIds.map(({ normalizedTag }) => normalizedTag),
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
							lng: z.number(),
						}),
					])
					.optional(),
				exactSearch: z.boolean().default(false),
			}),
		)
		.query(async ({ input: { search, exactSearch }, ctx: { db } }) => {
			// Function to handle case-insensitive LIKE or exact comparison
			const matchString = (column: SQLiteColumn, value: string) =>
				exactSearch
					? eq(lower(column), value.toLowerCase())
					: ilike(column, `%${value.trim()}%`)

			// Function to handle lat/lng matching
			const matchLatLng = (
				latColumn: SQLiteColumn,
				lngColumn: SQLiteColumn,
				lat: number,
				lng: number,
			) =>
				exactSearch
					? and(eq(latColumn, lat), eq(lngColumn, lng))
					: and(
							// Adjust tolerance as needed
							gte(latColumn, lat - 0.01),
							lte(latColumn, lat + 0.01),
							gte(lngColumn, lng - 0.01),
							lte(lngColumn, lng + 0.01),
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
									matchString(tagsSchema.name, normalizeTag(search)),
								)
							: search.lat != null && search.lng != null
								? matchLatLng(
										mapMarkersSchema.lat,
										mapMarkersSchema.lng,
										search.lat,
										search.lng,
									)
								: undefined

			const aggregate = await db
				.select({
					mapMarkersId: mapMarkersSchema.mapMarkersId,
					title: mapMarkersSchema.title,
					lat: mapMarkersSchema.lat,
					lng: mapMarkersSchema.lng,
					tags: sql<string>`GROUP_CONCAT(${tagsSchema.name}, ',')`.as('tags'),
				})
				.from(mapMarkersSchema)
				.leftJoin(
					markerTagsSchema,
					eq(mapMarkersSchema.mapMarkersId, markerTagsSchema.markerId),
				)
				.leftJoin(tagsSchema, eq(markerTagsSchema.tagId, tagsSchema.tagId))
				.where(whereCondition)
				.groupBy(
					mapMarkersSchema.mapMarkersId,
					mapMarkersSchema.title,
					mapMarkersSchema.lat,
					mapMarkersSchema.lng,
				)

			// Convert the grouped results to an array
			return aggregate.map((row) => ({
				...row,
				tags: row.tags ? row.tags.split(',') : [],
			}))
		}),

	update: secureProcedure
		.input(updateMarkerValidator)
		.mutation(async ({ input, ctx: { db } }) => {
			const { markerId, tags, ...markerData } = input

			const updates = filterUndefined(markerData)

			// Normalize and handle tags if provided
			let updatedTags: number[] = []
			if (tags) {
				const normalizedTags = normalizeTags(tags)
				const tagsAndIds = await Promise.all(
					normalizedTags.map((tag) => getOrInsertTag(db, tag)),
				)
				updatedTags = tagsAndIds.map(({ tagId }) => tagId)

				// Update markerTags association table
				await db
					.delete(markerTagsSchema)
					.where(eq(markerTagsSchema.markerId, markerId))
					.execute()

				if (updatedTags.length > 0) {
					await db.insert(markerTagsSchema).values(
						updatedTags.map((tagId) => ({
							markerId,
							tagId,
						})),
					)
				}
			}

			// Update markerData if provided
			if (Object.keys(markerData).length > 0) {
				await db
					.update(mapMarkersSchema)
					.set(updates)
					.where(eq(mapMarkersSchema.mapMarkersId, markerId))
					.execute()
			}

			return {
				success: true,
				updatedFields: {
					...markerData,
					tags: updatedTags,
				},
			}
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
				tags: z.string(),
			}),
		)
		.mutation(async ({ input: { markerId, tags }, ctx: { db } }) => {
			return await Promise.all(
				normalizeTags(tags.split(',')).map(async (tag) => {
					const { tagId, normalizedTag } = await getOrInsertTag(db, tag)
					await db.insert(markerTagsSchema).values({ markerId, tagId }).execute()
					return normalizedTag
				}),
			)
		}),

	deleteTagFromMarker: secureProcedure
		.input(
			z.object({
				markerId: z.number(),
				tag: z.string(),
			}),
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
				.where(
					and(eq(markerTagsSchema.markerId, markerId), eq(markerTagsSchema.tagId, tagId)),
				)
				.execute()

			return result
		}),

	deleteTag: secureProcedure
		.input(z.union([z.number(), z.string()]))
		.mutation(async ({ input, ctx: { db } }) => {
			return db
				.delete(tagsSchema)
				.where(
					typeof input === 'number'
						? eq(tagsSchema.tagId, input)
						: eq(tagsSchema.name, input),
				)
				.execute()
		}),
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
