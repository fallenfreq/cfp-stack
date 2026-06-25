import { drizzle } from 'drizzle-orm/d1'
import { seed } from '../../dist/domain/seed.js'

// POST /dev/seed — re-runs the design-system seed against the local D1 database.
// Protected by DEV_SEED_SECRET (set in api/.dev.vars, absent in production).
// Returns 404 when the secret is not configured so the route is inert in prod.
export const onRequestPost: PagesFunction<{ DB: D1Database; DEV_SEED_SECRET?: string }> = async ({
	env,
	request,
}) => {
	const secret = env.DEV_SEED_SECRET
	if (!secret) return new Response('Not found', { status: 404 })

	const provided = request.headers.get('Authorization')?.replace(/^Bearer\s+/, '')
	if (provided !== secret) return new Response('Unauthorized', { status: 401 })

	const db = drizzle(env.DB)
	const summary = await seed(db)
	return Response.json(summary)
}
