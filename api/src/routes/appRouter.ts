import { z } from 'zod'
import { publicProcedure, router } from '../config/trpc.js'
import { keysRouter } from './keys/router.js'
import { markersRouter } from './markers/router.js'
import { portfolioRouter } from './portfolio/router.js'
import { secureRouter } from './secure/router.js'
import { userRouter } from './user/router.js'

const appRouter = router({
	secure: secureRouter,

	keys: keysRouter,

	user: userRouter,

	mapMarker: markersRouter,

	portfolio: portfolioRouter,

	test: publicProcedure.query(async () => {
		return 'Some stuff'
	}),

	echo: publicProcedure.input(z.object({ name: z.string() })).query(async (opts) => {
		return 'Echo back: ' + opts.input.name
	})
})

export { appRouter }
export type AppRouter = typeof appRouter
