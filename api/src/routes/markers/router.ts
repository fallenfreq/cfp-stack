import { and, eq, gte, inArray, like, lte, or, type SQL, type SQLWrapper } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import { router, secureProcedure } from '../../config/trpc.js'
import { type Db, newestId, writeTogether } from '../../db.js'
import { definedFields } from '../../lib/index.js'
import {
	mapMarkers as mapMarkersSchema,
	markerTags as markerTagsSchema,
	tags as tagsSchema,
} from '../../schemas/mapMarker.js'

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

const normalizeTag = (tag: string) => tag.trim().toLowerCase().replace(/\s+/g, '-')
const normalizeTags = (tags: string[]) => {
	const normalized = tags.filter(Boolean).map(normalizeTag)
	return Array.from(new Set(normalized))
}

// The tags whose names are new. The names must be normalized already (normalizeTags), and there
// must be at least one. A name is unique, so of two requests adding the same tag, one adds it.
const insertTags = (db: Db, names: string[]) =>
	db
		.insert(tagsSchema)
		.values(names.map((name) => ({ name })))
		.onConflictDoNothing()

// The marker paired with each named tag; a pair there already stays as it is. The tags' ids are
// read here, so in a batch after insertTags, a tag it added is paired too.
const insertMarkerTags = (db: Db, markerId: number | SQLWrapper, names: string[]) =>
	db
		.insert(markerTagsSchema)
		.select(
			db
				.select({ markerId: mapMarkersSchema.mapMarkersId, tagId: tagsSchema.tagId })
				.from(mapMarkersSchema)
				.crossJoin(tagsSchema)
				.where(
					and(
						eq(mapMarkersSchema.mapMarkersId, markerId),
						inArray(tagsSchema.name, names),
					),
				),
		)
		.onConflictDoNothing()

export const markersRouter = router({
	insert: secureProcedure
		.input(insertMarkerValidator)
		.mutation(async ({ input, ctx: { db } }) => {
			const { tags, ...markerData } = input
			if (markerData.title) {
				markerData.title = markerData.title.trim()
			}

			const normalizedTags = normalizeTags(tags)
			const [[newMarker]] = await db.batch([
				db.insert(mapMarkersSchema).values(markerData).returning({
					mapMarkersId: mapMarkersSchema.mapMarkersId,
					lat: mapMarkersSchema.lat,
					lng: mapMarkersSchema.lng,
					title: mapMarkersSchema.title,
				}),
				...(normalizedTags.length > 0
					? [
							insertTags(db, normalizedTags),
							insertMarkerTags(
								db,
								newestId(db, mapMarkersSchema.mapMarkersId),
								normalizedTags,
							),
						]
					: []),
			])

			if (!newMarker) {
				throw new Error('Failed to insert the marker')
			}

			return {
				success: true,
				marker: newMarker,
				tags: normalizedTags,
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
			// Exact: the whole value. Otherwise: anything containing it, ignoring case as SQLite's
			// LIKE does (for ASCII); a % or _ in the value matches any characters.
			const matchString = (column: SQLiteColumn, value: string) =>
				exactSearch ? eq(column, value) : like(column, `%${value.trim()}%`)

			// Markers carrying a tag that matches.
			const taggedWith = (match: SQL) =>
				inArray(
					mapMarkersSchema.mapMarkersId,
					db
						.select({ markerId: markerTagsSchema.markerId })
						.from(markerTagsSchema)
						.innerJoin(tagsSchema, eq(markerTagsSchema.tagId, tagsSchema.tagId))
						.where(match),
				)

			// Exact: the same point. Otherwise: within 0.01° of it each way.
			const matchLatLng = (
				latColumn: SQLiteColumn,
				lngColumn: SQLiteColumn,
				lat: number,
				lng: number,
			) =>
				exactSearch
					? and(eq(latColumn, lat), eq(lngColumn, lng))
					: and(
							gte(latColumn, lat - 0.01),
							lte(latColumn, lat + 0.01),
							gte(lngColumn, lng - 0.01),
							lte(lngColumn, lng + 0.01),
						)

			// A number is a marker's id; text matches a title or a tag; a point matches markers
			// at or near it.
			const whereCondition =
				search == null
					? undefined
					: typeof search === 'number'
						? eq(mapMarkersSchema.mapMarkersId, search)
						: typeof search === 'string'
							? or(
									matchString(mapMarkersSchema.title, search),
									taggedWith(matchString(tagsSchema.name, normalizeTag(search))),
								)
							: search.lat != null && search.lng != null
								? matchLatLng(
										mapMarkersSchema.lat,
										mapMarkersSchema.lng,
										search.lat,
										search.lng,
									)
								: undefined

			const rows = await db
				.select({ marker: mapMarkersSchema, tag: tagsSchema.name })
				.from(mapMarkersSchema)
				.leftJoin(
					markerTagsSchema,
					eq(mapMarkersSchema.mapMarkersId, markerTagsSchema.markerId),
				)
				.leftJoin(tagsSchema, eq(markerTagsSchema.tagId, tagsSchema.tagId))
				.where(whereCondition)
				.orderBy(mapMarkersSchema.mapMarkersId, tagsSchema.name)

			// A row for each of a marker's tags; each marker once, with all its tags.
			const markers = new Map<
				number,
				typeof mapMarkersSchema.$inferSelect & { tags: string[] }
			>()
			for (const { marker, tag } of rows) {
				const entry = markers.get(marker.mapMarkersId) ?? { ...marker, tags: [] }
				if (tag !== null) entry.tags.push(tag)
				markers.set(marker.mapMarkersId, entry)
			}
			return [...markers.values()]
		}),

	update: secureProcedure
		.input(updateMarkerValidator)
		.mutation(async ({ input, ctx: { db } }) => {
			const { markerId, tags, ...markerData } = input

			const updates = definedFields(markerData)
			const writes: BatchItem<'sqlite'>[] = []

			// Tags, when given, replace the marker's tags.
			const updatedTags = tags ? normalizeTags(tags) : []
			if (tags) {
				writes.push(
					db.delete(markerTagsSchema).where(eq(markerTagsSchema.markerId, markerId)),
				)
				if (updatedTags.length > 0) {
					writes.push(
						insertTags(db, updatedTags),
						insertMarkerTags(db, markerId, updatedTags),
					)
				}
			}

			if (Object.keys(updates).length > 0) {
				writes.push(
					db
						.update(mapMarkersSchema)
						.set(updates)
						.where(eq(mapMarkersSchema.mapMarkersId, markerId)),
				)
			}

			await writeTogether(db, writes)

			return {
				success: true,
				updatedFields: {
					...markerData,
					tags: updatedTags,
				},
			}
		}),
	delete: secureProcedure.input(z.number()).mutation(async ({ input, ctx: { db } }) => {
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
			const names = normalizeTags(tags.split(','))
			if (names.length === 0) return []

			// Answers with the tags added: one the marker carries already stays as it is.
			const [, added, named] = await db.batch([
				insertTags(db, names),
				insertMarkerTags(db, markerId, names).returning({ tagId: markerTagsSchema.tagId }),
				db
					.select({ name: tagsSchema.name, tagId: tagsSchema.tagId })
					.from(tagsSchema)
					.where(inArray(tagsSchema.name, names)),
			])
			const addedIds = new Set(added.map(({ tagId }) => tagId))
			return names.filter((name) =>
				named.some((tag) => tag.name === name && addedIds.has(tag.tagId)),
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
