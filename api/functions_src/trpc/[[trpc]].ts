import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { drizzle } from 'drizzle-orm/d1'
import { fromOurPages } from '../../dist/auth/http.js'
import { authFromEnv } from '../../dist/auth/index.js'
import { initEnvs, type Envs } from '../../dist/config/envs.js'
import type { Context } from '../../dist/config/trpc.js'
import { appRouter } from '../../dist/routes/appRouter.js'
import * as collectionSchema from '../../dist/schemas/collectionEntry.js'
import * as userSchema from '../../dist/schemas/user.js'

export const onRequest: PagesFunction<Envs> = async (context) => {
	const { request, env } = context
	try {
		initEnvs(env)
		const auth = authFromEnv(env)
		const refused = refusal(request, auth.appOrigins)
		if (refused) return refused

		const session = auth.forRequest(request, (promise) => context.waitUntil(promise))
		return fetchRequestHandler({
			endpoint: '/trpc',
			req: request,
			router: appRouter,
			createContext: (): Context => {
				return {
					db: drizzle(env.DB, { schema: { ...userSchema, ...collectionSchema } }),
					session,
				}
			},
			// An answer that depends on who's signed in is never kept by a cache.
			responseMeta: () =>
				session.used ? { headers: new Headers({ 'Cache-Control': 'no-store' }) } : {},
			onError: ({ error }) => {
				// Change error to hide details from the client and log if required
				if (error.code == 'INTERNAL_SERVER_ERROR') {
					// Can log errors from here
					console.log({
						name: error.name,
						code: error.code,
						message: error.message,
					})
					// Change error
					error.stack = ''
					error.message = 'Internal Server Error'
				}
				// throw Error('Will crash if thrown here')
			},
		})
	} catch (error: any) {
		// Handle errors that occur outside of tRPC
		console.log(error)
		return new Response('Internal Server Error: ', { status: 500 })
	}
}

// Anything but a query must come from our own pages, as JSON: tRPC also takes form posts, which
// another site can send without asking. Queries are GETs and change nothing (docs/auth.md,
// "Forged requests").
function refusal(request: Request, origins: readonly string[]): Response | null {
	if (request.method === 'GET' || request.method === 'HEAD') return null
	if (!fromOurPages(request.headers, origins)) {
		console.warn('Refused a cross-site request:', {
			site: request.headers.get('Sec-Fetch-Site'),
			origin: request.headers.get('Origin'),
		})
		return new Response('Forbidden', { status: 403 })
	}
	const type = request.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase()
	if (type !== 'application/json') return new Response('Unsupported Media Type', { status: 415 })
	return null
}
