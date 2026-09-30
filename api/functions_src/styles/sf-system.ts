import { drizzle } from 'drizzle-orm/d1'
import { initEnvs, type Envs } from '../../dist/config/envs.js'
import { NotFoundError } from '../../dist/domain/errors.js'
import { getStylesheet } from '../../dist/domain/generateCss.js'
import { seed } from '../../dist/domain/seed.js'

// GET /styles/sf-system — DB-driven sf/sl stylesheet.
// Two-layer cache:
//   1. In-isolate module cache (getStylesheet) — zero-latency for hot isolates,
//      invalidated when the D1 signature changes.
//   2. Cloudflare edge Cache API — survives isolate cold-starts; keyed by URL,
//      TTL matches Cache-Control max-age. Populated fire-and-forget so the first
//      request after a cold-start isn't delayed by cache.put.
//
// Auto-seeds only on first boot (no root theme in DB). For seed data updates,
// run `pnpm seed:local` — never auto-reseed on version mismatch to avoid
// seeding with stale compiled code during a dev server restart race.
// If-None-Match compares weakly (RFC 9110): Cloudflare marks the ETag weak (W/"…") when it
// compresses the response, and the header may list several tags.
function matchesEtag(request: Request, etag: string): boolean {
	const header = request.headers.get('If-None-Match')
	if (!header) return false
	const bare = (tag: string) => tag.trim().replace(/^W\//, '')
	return header === '*' || header.split(',').some((tag) => bare(tag) === bare(etag))
}

export const onRequest: PagesFunction<Envs> = async ({ request, env, waitUntil }) => {
	try {
		initEnvs(env)

		// A 304 repeats the caching headers the 200 would send (RFC 9110 §15.4.5).
		const cacheHeaders = (etag: string) => ({
			ETag: etag,
			'Cache-Control': 'public, max-age=60',
		})

		const cacheKey = new URL(request.url)
		const edgeCache = caches.default
		const cached = await edgeCache.match(cacheKey)
		if (cached) {
			const cachedEtag = cached.headers.get('ETag')
			if (cachedEtag && matchesEtag(request, cachedEtag))
				return new Response(null, {
					status: 304,
					headers: cacheHeaders(cachedEtag),
				})
			return cached
		}

		const db = drizzle(env.DB)
		const { css, etag } = await getStylesheet(db).catch(async (err) => {
			// Only auto-seed when the DB has no root theme at all (first-time setup).
			// Version mismatches are warned in generateCss.ts — fix with pnpm seed:local.
			if (err instanceof NotFoundError) {
				await seed(db)
				return getStylesheet(db)
			}
			throw err
		})

		if (matchesEtag(request, etag))
			return new Response(null, { status: 304, headers: cacheHeaders(etag) })

		const response = new Response(css, {
			status: 200,
			headers: {
				'Content-Type': 'text/css; charset=utf-8',
				...cacheHeaders(etag),
			},
		})

		waitUntil(edgeCache.put(cacheKey, response.clone()))
		return response
	} catch (error) {
		console.error('sf-system stylesheet error:', error)
		return new Response('/* sf-system stylesheet: generator failed */', {
			status: 500,
			headers: { 'Content-Type': 'text/css; charset=utf-8' },
		})
	}
}
