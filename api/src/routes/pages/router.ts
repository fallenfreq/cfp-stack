import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { adminProcedure, publicProcedure, router } from '../../config/trpc.js'
import {
	definedFields,
	insertWithUniqueSlug,
	nameSchema,
	slugify,
	slugSchema,
} from '../../lib/index.js'
import { sitePages } from '../../schemas/page.js'
import { sitePageTags } from '../../schemas/pageTag.js'
import { siteTags } from '../../schemas/tag.js'

const imageUrlSchema = z
	.string()
	.regex(/^https?:\/\//)
	.url()
	.nullable()
	.optional()

const contentJsonSchema = z
	.string()
	.max(1_000_000)
	.refine(
		(v) => {
			try {
				JSON.parse(v)
				return true
			} catch {
				return false
			}
		},
		{ message: 'Must be valid JSON' },
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
	getBySlug: publicProcedure.input(z.object({ slug: slugSchema })).query(({ input, ctx }) =>
		ctx.db
			.select()
			.from(sitePages)
			.where(and(eq(sitePages.slug, input.slug), eq(sitePages.published, true)))
			.get(),
	),

	list: publicProcedure.query(({ ctx }) =>
		ctx.db
			.select(listColumns)
			.from(sitePages)
			.where(eq(sitePages.published, true))
			.orderBy(desc(sitePages.updatedAt)),
	),

	listByCollection: publicProcedure
		.input(z.object({ collectionSlug: z.string() }))
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
		.input(z.object({ slug: slugSchema }))
		.query(({ input, ctx }) =>
			ctx.db.select().from(sitePages).where(eq(sitePages.slug, input.slug)).get(),
		),

	list: adminProcedure.query(({ ctx }) =>
		ctx.db.select(listColumns).from(sitePages).orderBy(desc(sitePages.updatedAt)),
	),

	listByCollection: adminProcedure
		.input(z.object({ collectionSlug: z.string() }))
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
		.input(z.object({ pageId: z.number() }))
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

	create: adminProcedure
		.input(
			z.object({
				name: nameSchema,
				imageUrl: imageUrlSchema,
				contentJson: contentJsonSchema,
			}),
		)
		.mutation(({ input, ctx }) => {
			const values = {
				name: input.name,
				contentJson: input.contentJson,
				...(input.imageUrl != null ? { imageUrl: input.imageUrl } : {}),
			}
			return insertWithUniqueSlug(
				(slug) =>
					ctx.db
						.insert(sitePages)
						.values({ ...values, slug })
						.returning({ pageId: sitePages.pageId, slug: sitePages.slug })
						.get(),
				slugify(input.name),
			)
		}),

	update: adminProcedure
		.input(
			z.object({
				pageId: z.number(),
				contentJson: contentJsonSchema.optional(),
				name: nameSchema.optional(),
				slug: slugSchema.optional(),
				imageUrl: imageUrlSchema,
				published: z.boolean().optional(),
				tagIds: z.array(z.number()).optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { pageId, tagIds, ...values } = input
			const setValues = definedFields(values)
			if (Object.keys(setValues).length > 0) {
				await ctx.db
					.update(sitePages)
					.set({ ...setValues, updatedAt: new Date() })
					.where(eq(sitePages.pageId, pageId))
			}
			if (tagIds !== undefined) {
				await ctx.db.delete(sitePageTags).where(eq(sitePageTags.pageId, pageId))
				if (tagIds.length > 0) {
					await ctx.db
						.insert(sitePageTags)
						.values(tagIds.map((tagId) => ({ pageId, tagId })))
				}
			}
			return { pageId }
		}),

	delete: adminProcedure
		.input(z.object({ pageId: z.number() }))
		.mutation(({ input, ctx }) =>
			ctx.db.delete(sitePages).where(eq(sitePages.pageId, input.pageId)),
		),
})
