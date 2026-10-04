import { signedOut } from '@/services/session'
import { createTRPCClient, httpBatchLink, type TRPCLink } from '@trpc/client'
import { tap } from '@trpc/server/observable'

import type { AppRouter } from '@somefreq-app/api/appRouter'
import superjson from 'superjson'

// An answer that you're not signed in means your session has ended (docs/auth.md, "Client").
const signedOutLink: TRPCLink<AppRouter> =
	() =>
	({ next, op }) =>
		next(op).pipe(
			tap({
				error: (error) => {
					if (error.data?.code === 'UNAUTHORIZED') signedOut()
				},
			}),
		)

const trpc = createTRPCClient<AppRouter>({
	links: [
		signedOutLink,
		httpBatchLink({
			transformer: superjson,
			// The page's own origin, with its sign-in cookie; in dev, Vite passes it on to wrangler
			// (vite.config.ts).
			url: '/trpc',
		}),
	],
})

export { trpc }
