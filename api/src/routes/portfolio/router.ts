import { publicProcedure, router } from '../../config/trpc.js'
import { portfolioEntries } from '../../schemas/portfolio.js'

export const portfolioRouter = router({
  entry: publicProcedure.query(async (opt) => {
    return opt.ctx.db.select().from(portfolioEntries)
  })
})
