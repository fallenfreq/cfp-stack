import zitadelAuth from '@/services/zitadelAuth'
import { createTRPCClient, httpBatchLink } from '@trpc/client'

import type { AppRouter } from '@somefreq-app/api/appRouter'
import superjson from 'superjson'

// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.

const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			transformer: superjson,
			// The page's own origin; in dev, Vite passes it on to wrangler (vite.config.ts).
			url: '/trpc',
			headers: () => {
				return {
					Authorization: 'Bearer ' + zitadelAuth.oidcAuth.accessToken,
				}
			},
		}),
	],
})

export { trpc }
