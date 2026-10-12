import { and, desc, eq, inArray, type SQLWrapper } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { adminProcedure, publicProcedure, router } from '../../config/trpc.js'
import { type Db, newestId, writeTogether } from '../../db.js'
import {
	conflictIfSlugTaken,
	definedFields,
	insertWithUniqueSlug,
	mustExist,
	nameRule,
	slugRule,
} from '../../lib/index.js'
import { sitePages } from '../../schemas/page.js'
import { sitePageTags } from '../../schemas/pageTag.js'
import { siteTags } from '../../schemas/tag.js'
import { siteTagInput } from '../tags/router.js'

const isJson = (text: string) => {
	try {
		JSON.parse(text)
		return true
	} catch {
		return false
	}
}

// What a page's columns accept: their types and lengths from the table, and what the app adds.
// Each input picks the columns it takes.
const pageInput = createSelectSchema(sitePages, {
	name: nameRule,
	slug: slugRule,
	// zod's own http(s) rule, which also asks for the `//`.
	imageUrl: (column) => column.pipe(z.url({ protocol: z.regexes.httpProtocol })),
	// Its size in bytes, which is what D1 limits (2,000,000 a value).
	contentJson: (column) =>
		column
			.refine((text) => new TextEncoder().encode(text).length <= 1_000_000, {
				error: 'At most 1,000,000 bytes',
				abort: true,
			})
			.refine(isJson, { error: 'Must be valid JSON' }),
})

// A page's collections: at most 50. They're bound to one query, and D1 takes at most 100 values.
const collectionIds = z.array(siteTagInput.shape.tagId).max(50)

// The page paired with each collection named, from a select, as a marker's tags are: a collection
// that isn't there (deleted meanwhile) is left out, and so is the page if it went since the check.
const insertPageTags = (db: Db, pageId: number | SQLWrapper, tagIds: number[]) =>
	db.insert(sitePageTags).select(
		db
			.select({ pageId: sitePages.pageId, tagId: siteTags.tagId })
			.from(sitePages)
			.crossJoin(siteTags)
			.where(and(eq(sitePages.pageId, pageId), inArray(siteTags.tagId, tagIds))),
	)

const listColumns = {
	pageId: sitePages.pageId,
	slug: sitePages.slug,
	name: sitePages.name,
	imageUrl: sitePages.imageUrl,
	published: sitePages.published,
	createdAt: sitePages.createdAt,
	updatedAt: sitePages.updatedAt,
}

export const publicPagesRouter = router({
	// A lookup that finds nothing returns null: TanStack Query treats undefined data as an error.
	getBySlug: publicProcedure.input(pageInput.pick({ slug: true })).query(
		async ({ input, ctx }) =>
			(await ctx.db
				.select()
				.from(sitePages)
				.where(and(eq(sitePages.slug, input.slug), eq(sitePages.published, true)))
				.get()) ?? null,
	),

	list: publicProcedure.query(({ ctx }) =>
		ctx.db
			.select(listColumns)
			.from(sitePages)
			.where(eq(sitePages.published, true))
			.orderBy(desc(sitePages.updatedAt)),
	),

	listByCollection: publicProcedure
		.input(z.object({ collectionSlug: siteTagInput.shape.slug }))
		.query(({ input, ctx }) =>
			ctx.db
				.select(listColumns)
				.from(sitePages)
				.innerJoin(sitePageTags, eq(sitePageTags.pageId, sitePages.pageId))
				.innerJoin(siteTags, eq(siteTags.tagId, sitePageTags.tagId))
				.where(
					and(
						eq(siteTags.slug, input.collectionSlug),
						eq(siteTags.published, true),
						eq(sitePages.published, true),
					),
				)
				.orderBy(desc(sitePages.updatedAt)),
		),
})

export const adminPagesRouter = router({
	getBySlug: adminProcedure
		.input(pageInput.pick({ slug: true }))
		.query(
			async ({ input, ctx }) =>
				(await ctx.db.select().from(sitePages).where(eq(sitePages.slug, input.slug)).get())
				?? null,
		),

	list: adminProcedure.query(({ ctx }) =>
		ctx.db.select(listColumns).from(sitePages).orderBy(desc(sitePages.updatedAt)),
	),

	listByCollection: adminProcedure
		.input(z.object({ collectionSlug: siteTagInput.shape.slug }))
		.query(({ input, ctx }) =>
			ctx.db
				.select(listColumns)
				.from(sitePages)
				.innerJoin(sitePageTags, eq(sitePageTags.pageId, sitePages.pageId))
				.innerJoin(siteTags, eq(siteTags.tagId, sitePageTags.tagId))
				.where(eq(siteTags.slug, input.collectionSlug))
				.orderBy(desc(sitePages.updatedAt)),
		),

	listTagAssignments: adminProcedure.query(({ ctx }) =>
		ctx.db
			.select({
				pageId: sitePageTags.pageId,
				tagId: siteTags.tagId,
				name: siteTags.name,
				slug: siteTags.slug,
			})
			.from(sitePageTags)
			.innerJoin(siteTags, eq(siteTags.tagId, sitePageTags.tagId)),
	),

	getWithTags: adminProcedure
		.input(pageInput.pick({ pageId: true }))
		.query(async ({ input, ctx }) => {
			const [page, tags] = await Promise.all([
				ctx.db.select().from(sitePages).where(eq(sitePages.pageId, input.pageId)).get(),
				ctx.db
					.select({ tagId: siteTags.tagId, name: siteTags.name, slug: siteTags.slug })
					.from(siteTags)
					.innerJoin(sitePageTags, eq(sitePageTags.tagId, siteTags.tagId))
					.where(eq(sitePageTags.pageId, input.pageId)),
			])
			if (!page) return null
			return { ...page, tags }
		}),

	// A new page and its collections are written together: a page made first, whose collections
	// then failed, would be left out of them.
	create: adminProcedure
		.input(
			pageInput
				.pick({ name: true, imageUrl: true, contentJson: true })
				.partial({ imageUrl: true })
				.extend({ tagIds: collectionIds.optional() }),
		)
		.mutation(({ input, ctx }) => {
			const values = {
				name: input.name,
				contentJson: input.contentJson,
				...(input.imageUrl != null ? { imageUrl: input.imageUrl } : {}),
			}
			const tagIds = input.tagIds ?? []
			return insertWithUniqueSlug(
				ctx.db,
				async (slug) => {
					const [[made]] = await ctx.db.batch([
						ctx.db
							.insert(sitePages)
							.values({ ...values, slug })
							.returning({ pageId: sitePages.pageId, slug: sitePages.slug }),
						...(tagIds.length > 0
							? [insertPageTags(ctx.db, newestId(ctx.db, sitePages.pageId), tagIds)]
							: []),
					])
					if (!made) throw new Error('Failed to insert the page')
					return made
				},
				input.name,
				sitePages.slug,
			)
		}),

	update: adminProcedure
		.input(
			pageInput
				.pick({
					contentJson: true,
					name: true,
					slug: true,
					imageUrl: true,
					published: true,
				})
				.partial()
				.extend({ pageId: pageInput.shape.pageId, tagIds: collectionIds.optional() }),
		)
		.mutation(async ({ input, ctx }) => {
			const { pageId, tagIds, ...values } = input
			await mustExist(ctx.db, sitePages.pageId, pageId, 'Page not found')
			const setValues = definedFields(values)
			const writes: BatchItem<'sqlite'>[] = []
			if (Object.keys(setValues).length > 0) {
				writes.push(
					ctx.db
						.update(sitePages)
						.set({ ...setValues, updatedAt: new Date() })
						.where(eq(sitePages.pageId, pageId)),
				)
			}
			if (tagIds !== undefined) {
				writes.push(ctx.db.delete(sitePageTags).where(eq(sitePageTags.pageId, pageId)))
				if (tagIds.length > 0) writes.push(insertPageTags(ctx.db, pageId, tagIds))
			}
			await conflictIfSlugTaken(writeTogether(ctx.db, writes), sitePages.slug)
			return { pageId }
		}),

	delete: adminProcedure
		.input(pageInput.pick({ pageId: true }))
		.mutation(({ input, ctx }) =>
			ctx.db.delete(sitePages).where(eq(sitePages.pageId, input.pageId)),
		),
})
