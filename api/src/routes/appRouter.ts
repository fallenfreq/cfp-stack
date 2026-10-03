import { z } from 'zod'
import { publicProcedure, router } from '../config/trpc.js'
import { keysRouter } from './keys/router.js'
import { markersRouter } from './markers/router.js'
import { adminPagesRouter, publicPagesRouter } from './pages/router.js'
import { secureRouter } from './secure/router.js'
import { adminTagsRouter, publicTagsRouter } from './tags/router.js'
import { themesRouter } from './themes/router.js'
import { userRouter } from './user/router.js'

const appRouter = router({
	secure: secureRouter,

	keys: keysRouter,

	user: userRouter,

	mapMarker: markersRouter,

	publicPages: publicPagesRouter,

	adminPages: adminPagesRouter,

	publicTags: publicTagsRouter,

	adminTags: adminTagsRouter,

	themes: themesRouter,

	test: publicProcedure.query(async () => {
		return 'Some stuff'
	}),

	echo: publicProcedure.input(z.object({ name: z.string() })).query(async (opts) => {
		return 'Echo back: ' + opts.input.name
	}),
})

export { appRouter }
export type AppRouter = typeof appRouter
