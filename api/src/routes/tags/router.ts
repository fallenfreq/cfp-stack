import { count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { adminProcedure, publicProcedure, router } from '../../config/trpc.js'
import {
	definedFields,
	insertWithUniqueSlug,
	nameSchema,
	slugify,
	slugSchema,
} from '../../lib/index.js'
import { sitePageTags } from '../../schemas/pageTag.js'
import { siteTags } from '../../schemas/tag.js'

export const publicTagsRouter = router({
	list: publicProcedure.query(({ ctx }) =>
		ctx.db.select().from(siteTags).where(eq(siteTags.published, true)).orderBy(siteTags.name),
	),

	getBySlug: publicProcedure
		.input(z.object({ slug: slugSchema }))
		.query(({ input, ctx }) =>
			ctx.db.select().from(siteTags).where(eq(siteTags.slug, input.slug)).get(),
		),
})

export const adminTagsRouter = router({
	list: adminProcedure.query(async ({ ctx }) => {
		const tags = await ctx.db.select().from(siteTags).orderBy(siteTags.name)
		const counts = await ctx.db
			.select({ tagId: sitePageTags.tagId, pageCount: count(sitePageTags.pageId) })
			.from(sitePageTags)
			.groupBy(sitePageTags.tagId)
		const countMap = new Map(counts.map((c) => [c.tagId, c.pageCount]))
		return tags.map((tag) => ({ ...tag, pageCount: countMap.get(tag.tagId) ?? 0 }))
	}),

	create: adminProcedure
		.input(
			z.object({
				name: nameSchema,
				slug: slugSchema.optional(),
				published: z.boolean().optional(),
			}),
		)
		.mutation(({ input, ctx }) =>
			insertWithUniqueSlug(
				(slug) =>
					ctx.db
						.insert(siteTags)
						.values({ name: input.name, slug, published: input.published ?? false })
						.returning({ tagId: siteTags.tagId, slug: siteTags.slug })
						.get(),
				input.slug ?? slugify(input.name),
			),
		),

	update: adminProcedure
		.input(
			z.object({
				tagId: z.number(),
				name: nameSchema.optional(),
				slug: slugSchema.optional(),
				published: z.boolean().optional(),
			}),
		)
		.mutation(({ input, ctx }) => {
			const { tagId, ...values } = input
			return ctx.db
				.update(siteTags)
				.set({ ...definedFields(values), updatedAt: new Date() })
				.where(eq(siteTags.tagId, tagId))
				.returning({ tagId: siteTags.tagId })
				.get()
		}),

	delete: adminProcedure
		.input(z.object({ tagId: z.number() }))
		.mutation(({ input, ctx }) =>
			ctx.db.delete(siteTags).where(eq(siteTags.tagId, input.tagId)),
		),
})
