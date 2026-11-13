import { signedOut } from '@/services/session'
import { createTRPCClient, httpBatchLink, type TRPCClient, type TRPCLink } from '@trpc/client'
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

// A call the server hasn't answered within this time fails as one whose connection dropped does,
// so every page handles and words it the same way (services/errors.ts). A page takes a second or
// two to send from a slow phone connection.
const answerWithin = 30_000

const trpc: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
	links: [
		signedOutLink,
		httpBatchLink({
			transformer: superjson,
			// The page's own origin, with its sign-in cookie; in dev, Vite passes it on to wrangler
			// (vite.config.ts).
			url: '/trpc',
			// One signal for the time limit and tRPC's own cancel, joined by hand: WebKit can discard a
			// signal from AbortSignal.any that only the fetch holds, and the fetch then never ends. The
			// limit isn't cleared when the reply starts, so it covers reading the reply too.
			fetch: (url, options) => {
				const stop = new AbortController()
				setTimeout(() => stop.abort(), answerWithin)
				const cancel = options?.signal
				if (cancel?.aborted) stop.abort()
				else cancel?.addEventListener('abort', () => stop.abort(), { once: true })
				return fetch(url, { ...options, signal: stop.signal })
			},
		}),
	],
})

export { trpc }
