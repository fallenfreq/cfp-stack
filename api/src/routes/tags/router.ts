import { count, eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import { adminProcedure, publicProcedure, router } from '../../config/trpc.js'
import { NotFoundError } from '../../domain/errors.js'
import {
	conflictIfSlugTaken,
	definedFields,
	insertWithUniqueSlug,
	nameRule,
	slugRule,
} from '../../lib/index.js'
import { sitePageTags } from '../../schemas/pageTag.js'
import { siteTags } from '../../schemas/tag.js'

// What a collection's columns accept: their types and lengths from the table, and what the app
// adds. Each input picks the columns it takes.
export const siteTagInput = createSelectSchema(siteTags, {
	name: nameRule,
	slug: slugRule,
})

export const publicTagsRouter = router({
	list: publicProcedure.query(({ ctx }) =>
		ctx.db.select().from(siteTags).where(eq(siteTags.published, true)).orderBy(siteTags.name),
	),

	getBySlug: publicProcedure
		.input(siteTagInput.pick({ slug: true }))
		// A lookup that finds nothing returns null: TanStack Query treats undefined data as an error.
		.query(
			async ({ input, ctx }) =>
				(await ctx.db.select().from(siteTags).where(eq(siteTags.slug, input.slug)).get())
				?? null,
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
			siteTagInput
				.pick({ name: true, slug: true, published: true })
				.partial({ slug: true, published: true }),
		)
		.mutation(({ input, ctx }) => {
			const insert = (slug: string) =>
				ctx.db
					.insert(siteTags)
					.values({ name: input.name, slug, published: input.published ?? false })
					.returning({ tagId: siteTags.tagId, slug: siteTags.slug })
					.get()
			// A slug the admin chose is kept or refused; one made from the name moves aside.
			return input.slug === undefined
				? insertWithUniqueSlug(ctx.db, insert, input.name, siteTags.slug)
				: conflictIfSlugTaken(insert(input.slug), siteTags.slug)
		}),

	update: adminProcedure
		.input(
			siteTagInput
				.pick({ name: true, slug: true, published: true })
				.partial()
				.extend({ tagId: siteTagInput.shape.tagId }),
		)
		.mutation(async ({ input, ctx }) => {
			const { tagId, ...values } = input
			const updated = await conflictIfSlugTaken(
				ctx.db
					.update(siteTags)
					.set({ ...definedFields(values), updatedAt: new Date() })
					.where(eq(siteTags.tagId, tagId))
					.returning({ tagId: siteTags.tagId })
					.get(),
				siteTags.slug,
			)
			if (!updated) throw new NotFoundError('Collection not found')
			return updated
		}),

	delete: adminProcedure
		.input(siteTagInput.pick({ tagId: true }))
		.mutation(({ input, ctx }) =>
			ctx.db.delete(siteTags).where(eq(siteTags.tagId, input.tagId)),
		),
})
