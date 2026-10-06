import { and, eq, gte, inArray, like, lte, or, type SQL, type SQLWrapper } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { router, secureProcedure } from '../../config/trpc.js'
import { type Db, newestId, writeTogether } from '../../db.js'
import { NotFoundError } from '../../domain/errors.js'
import { definedFields, mustExist } from '../../lib/index.js'
import {
	mapMarkers as mapMarkersSchema,
	markerTags as markerTagsSchema,
	tags as tagsSchema,
} from '../../schemas/mapMarker.js'

// What a marker's and a tag's columns accept: their types and lengths from the tables, and what
// the app adds. Each input picks the columns it takes.
const markerInput = createSelectSchema(mapMarkersSchema, {
	// Its length counted once trimmed.
	title: (column) => z.string().trim().pipe(column.min(1)),
	lat: (column) => column.min(-90).max(90),
	lng: (column) => column.min(-180).max(180),
})
const tagInput = createSelectSchema(tagsSchema)

// A tag as stored: trimmed, lowercased, its spaces made hyphens.
const normalizeTag = (tag: string) => tag.trim().toLowerCase().replace(/\s+/g, '-')
const tagName = z.string().transform(normalizeTag).pipe(tagInput.shape.name)

// Tags named for a marker, each once; blank ones are dropped. At most 50 a request, as sent:
// they're bound to one query, and D1 takes at most 100 values.
const tagNames = z
	.array(tagName)
	.max(50)
	.transform((names) => [...new Set(names.filter(Boolean))])

const insertMarkerValidator = markerInput
	.pick({ title: true, lat: true, lng: true })
	.extend({ tags: tagNames })

const updateMarkerValidator = markerInput
	.pick({ title: true, lat: true, lng: true })
	.partial()
	.extend({ markerId: markerInput.shape.mapMarkersId, tags: tagNames.optional() })

// The tags whose names are new. The names must be normalized already (tagNames), and there must
// be at least one. A name is unique, so of two requests adding the same tag, one adds it.
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
			const [[newMarker]] = await db.batch([
				db.insert(mapMarkersSchema).values(markerData).returning({
					mapMarkersId: mapMarkersSchema.mapMarkersId,
					lat: mapMarkersSchema.lat,
					lng: mapMarkersSchema.lng,
					title: mapMarkersSchema.title,
				}),
				...(tags.length > 0
					? [
							insertTags(db, tags),
							insertMarkerTags(db, newestId(db, mapMarkersSchema.mapMarkersId), tags),
						]
					: []),
			])

			if (!newMarker) {
				throw new Error('Failed to insert the marker')
			}

			return {
				success: true,
				marker: newMarker,
				tags,
			}
		}),

	select: secureProcedure
		.input(
			z.object({
				search: z
					.union([
						z.string(),
						markerInput.shape.mapMarkersId,
						markerInput.pick({ lat: true, lng: true }),
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
			await mustExist(db, mapMarkersSchema.mapMarkersId, markerId, 'Marker not found')

			const updates = definedFields(markerData)
			const writes: BatchItem<'sqlite'>[] = []

			// Tags, when given, replace the marker's tags.
			if (tags) {
				writes.push(
					db.delete(markerTagsSchema).where(eq(markerTagsSchema.markerId, markerId)),
				)
				if (tags.length > 0) {
					writes.push(insertTags(db, tags), insertMarkerTags(db, markerId, tags))
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
					tags: tags ?? [],
				},
			}
		}),
	delete: secureProcedure
		.input(markerInput.shape.mapMarkersId)
		.mutation(async ({ input, ctx: { db } }) => {
			return db
				.delete(mapMarkersSchema)
				.where(eq(mapMarkersSchema.mapMarkersId, input))
				.execute()
		}),

	addTagsToMarker: secureProcedure
		.input(
			z.object({
				markerId: markerInput.shape.mapMarkersId,
				// Comma-separated.
				tags: z
					.string()
					.transform((list) => list.split(','))
					.pipe(tagNames),
			}),
		)
		.mutation(async ({ input: { markerId, tags: names }, ctx: { db } }) => {
			await mustExist(db, mapMarkersSchema.mapMarkersId, markerId, 'Marker not found')
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
				markerId: markerInput.shape.mapMarkersId,
				tag: tagName,
			}),
		)
		.mutation(async ({ input: { markerId, tag }, ctx: { db } }) => {
			const existingTag = await db
				.select({ tagId: tagsSchema.tagId })
				.from(tagsSchema)
				.where(eq(tagsSchema.name, tag))
				.limit(1)
				.then((tags) => tags[0])

			if (!existingTag) {
				throw new NotFoundError(`Tag "${tag}" not found`)
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
		.input(z.union([tagInput.shape.tagId, tagInput.shape.name]))
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
