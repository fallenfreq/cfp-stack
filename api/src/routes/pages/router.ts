import { and, desc, eq, inArray, lt, ne, or, type SQLWrapper } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { adminProcedure, publicProcedure, router } from '../../config/trpc.js'
import { type Db, writeTogether } from '../../db.js'
import { ConflictError } from '../../domain/errors.js'
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
	version: (column) => column.min(1),
	savedFrom: (column) => column.pipe(z.uuid()),
})

// What a content save sends besides the content: the editor's key, which a save needs (one
// without would never match the column's NULL), and the version the save makes.
const saveInput = {
	savedFrom: pageInput.shape.savedFrom.unwrap(),
	newVersion: pageInput.shape.version,
}

const movedOn = 'This page was saved somewhere else after you opened it'

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
	// Without the version and the editor's key, which only the editor uses.
	getBySlug: publicProcedure.input(pageInput.pick({ slug: true })).query(
		async ({ input, ctx }) =>
			(await ctx.db
				.select({ ...listColumns, contentJson: sitePages.contentJson })
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
				.extend({ tagIds: collectionIds.optional(), ...saveInput }),
		)
		.mutation(async ({ input, ctx }) => {
			const { name, contentJson, savedFrom, newVersion } = input
			const tagIds = input.tagIds ?? []
			// A page with this editor's key is an earlier try's, which landed and lost its answer: this
			// is a save of that page, with the name, taken if the page is below the version this makes
			// (a try older than one taken is refused). The key's own page is paired with the
			// collections, so a repeat adds none it has. If no page has the key any more (deleted, or
			// saved from another editor since, which gives it that editor's key), a new page is made: a
			// try that lands after that makes a second page with what it sent. Nothing typed is lost,
			// and it needs that timing; a key that never changes would close it, for a third column
			// (accepted, 2026-11-13).
			const saved = await insertWithUniqueSlug(
				ctx.db,
				async (slug) => {
					const [[page]] = await ctx.db.batch([
						ctx.db
							.insert(sitePages)
							.values({
								name,
								contentJson,
								savedFrom,
								version: newVersion,
								slug,
								...(input.imageUrl != null ? { imageUrl: input.imageUrl } : {}),
							})
							.onConflictDoUpdate({
								target: sitePages.savedFrom,
								set: {
									contentJson,
									name,
									version: newVersion,
									updatedAt: new Date(),
								},
								setWhere: lt(sitePages.version, newVersion),
							})
							.returning({
								pageId: sitePages.pageId,
								slug: sitePages.slug,
								version: sitePages.version,
							}),
						...(tagIds.length > 0
							? [
									insertPageTags(
										ctx.db,
										ctx.db
											.select({ pageId: sitePages.pageId })
											.from(sitePages)
											.where(eq(sitePages.savedFrom, savedFrom)),
										tagIds,
									).onConflictDoNothing(),
								]
							: []),
					])
					return page ?? null
				},
				name,
				sitePages.slug,
			)
			if (!saved) throw new ConflictError(movedOn)
			return saved
		}),

	save: adminProcedure
		.input(
			pageInput
				.pick({ pageId: true, contentJson: true, version: true })
				.extend(saveInput)
				.refine((save) => save.newVersion > save.version, {
					error: 'Must be above the version the save was made from',
					path: ['newVersion'],
				}),
		)
		.mutation(async ({ input, ctx }) => {
			const { pageId, contentJson, version, newVersion, savedFrom } = input
			// Taken if the page is still at the version the save was made from (nobody saved since),
			// or if this editor saved it last and the page is below the version this save makes: every
			// version since is this editor's own (saves whose answer was lost), and this one is newer.
			// The version alone would refuse a save sent again after a lost answer, as its first try
			// moved the page on; the key alone can't tell whether someone else saved since. An
			// editor's own older save arriving late is refused, as it makes a lower version than the
			// page has. The rule is in the write, so nothing can save in between.
			const [, [saved]] = await ctx.db.batch([
				// The key goes with the save, as one page has it: another page has it only if a new
				// page's try made that page after this one moved on (create), and this editor makes no
				// more pages.
				ctx.db
					.update(sitePages)
					.set({ savedFrom: null })
					.where(and(eq(sitePages.savedFrom, savedFrom), ne(sitePages.pageId, pageId))),
				ctx.db
					.update(sitePages)
					.set({ contentJson, version: newVersion, savedFrom, updatedAt: new Date() })
					.where(
						and(
							eq(sitePages.pageId, pageId),
							or(
								eq(sitePages.version, version),
								and(
									eq(sitePages.savedFrom, savedFrom),
									lt(sitePages.version, newVersion),
								),
							),
						),
					)
					.returning({ version: sitePages.version }),
			])
			if (saved) return saved
			await mustExist(ctx.db, sitePages.pageId, pageId, 'Page not found')
			throw new ConflictError(movedOn)
		}),

	update: adminProcedure
		.input(
			// Not the content, which `save` writes. Strict, so an editor from before `save` that sends
			// its content here is refused rather than told it saved: zod drops a field an input
			// doesn't name.
			pageInput
				.pick({ name: true, slug: true, imageUrl: true, published: true })
				.partial()
				.extend({ pageId: pageInput.shape.pageId, tagIds: collectionIds.optional() })
				.strict(),
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
