// The client's type check reads the API through this module, so it names what the API's types
// need beyond the browser's: the Workers runtime's (the database binding, D1Database).
/// <reference types="@cloudflare/workers-types" />
import { router } from '../config/trpc.js'
import { accountRouter } from './account/router.js'
import { keysRouter } from './keys/router.js'
import { markersRouter } from './markers/router.js'
import { adminPagesRouter, publicPagesRouter } from './pages/router.js'
import { sessionRouter } from './session/router.js'
import { adminTagsRouter, publicTagsRouter } from './tags/router.js'
import { themesRouter } from './themes/router.js'

const appRouter = router({
	session: sessionRouter,

	account: accountRouter,

	keys: keysRouter,

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
