import { publicProcedure, router } from '../../config/trpc.js'
import { listCollapseThresholds } from '../../domain/collapseThresholds.js'
import { listThemes } from '../../domain/themes.js'
import { listAllTokens } from '../../domain/themeTokens.js'

// Public reads — palette enumeration isn't sensitive. Mutations will arrive
// later under adminProcedure when the theme editor exists.
export const themesRouter = router({
	list: publicProcedure.query(({ ctx }) => listThemes(ctx.db)),
	listTokens: publicProcedure.query(({ ctx }) => listAllTokens(ctx.db)),
	listCollapseThresholds: publicProcedure.query(({ ctx }) => listCollapseThresholds(ctx.db)),
})
