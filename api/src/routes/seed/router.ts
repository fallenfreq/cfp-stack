import { adminProcedure, router } from '../../config/trpc.js'
import { seed } from '../../domain/seed.js'

export const seedRouter = router({
	run: adminProcedure.mutation(({ ctx }) => seed(ctx.db)),
})
