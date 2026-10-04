import { router } from '../config/trpc.js'
import { accountRouter } from './account/router.js'
import { keysRouter } from './keys/router.js'
import { markersRouter } from './markers/router.js'
import { adminPagesRouter, publicPagesRouter } from './pages/router.js'
import { sessionRouter } from './session/router.js'
import { adminTagsRouter, publicTagsRouter } from './tags/router.js'
import { themesRouter } from './themes/router.js'
import { userRouter } from './user/router.js'

const appRouter = router({
	session: sessionRouter,

	account: accountRouter,

	keys: keysRouter,

	user: userRouter,

	mapMarker: markersRouter,

	publicPages: publicPagesRouter,

	adminPages: adminPagesRouter,

	publicTags: publicTagsRouter,

	adminTags: adminTagsRouter,

	themes: themesRouter,
})

export { appRouter }
export type AppRouter = typeof appRouter

// The interfaces among the answers, which the client's types must name: it can import only this
// module.
export type { AccountProfile } from '../auth/provider.js'
