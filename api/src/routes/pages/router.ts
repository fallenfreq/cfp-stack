import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { publicProcedure, router, secureProcedure } from '../../config/trpc.js'
import { sitePages } from '../../schemas/page.js'

const slugSchema = z
	.string()
	.min(1)
	.max(256)
	.regex(/^[a-z0-9-]+$/)
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

export const sitePagesRouter = router({
	get: publicProcedure
		.input(z.object({ slug: slugSchema }))
		.query(({ input, ctx }) =>
			ctx.db.select().from(sitePages).where(eq(sitePages.slug, input.slug)).get(),
		),

	list: secureProcedure.query(({ ctx }) => ctx.db.select().from(sitePages)),

	create: secureProcedure
		.input(z.object({ slug: slugSchema, contentJson: contentJsonSchema }))
		.mutation(({ input, ctx }) =>
			ctx.db.insert(sitePages).values(input).returning({ pageId: sitePages.pageId }).get(),
		),

	update: secureProcedure
		.input(z.object({ pageId: z.number(), contentJson: contentJsonSchema }))
		.mutation(({ input, ctx }) => {
			const { pageId, ...values } = input
			return ctx.db
				.update(sitePages)
				.set({ ...values, updatedAt: new Date() })
				.where(eq(sitePages.pageId, pageId))
				.returning({ pageId: sitePages.pageId })
				.get()
		}),
})
