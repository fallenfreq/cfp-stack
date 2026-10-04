import { drizzle } from 'drizzle-orm/d1'
import { z } from 'zod'
import { zitadel } from '../providers/zitadel.js'
import { authCookies } from './http.js'
import { sealer } from './sealing.js'
import { sessionStore } from './sessions.js'

// Signing in, put together from its settings. The one place that names the provider
// (docs/auth.md, "The provider boundary"): another provider changes the `zitadel(…)` line.

// Needed whenever a request's cookies or origin are checked, so checked at once.
const requestSettings = z.object({
	APP_ORIGINS: z
		.string()
		.transform((list) => list.split(',').map((origin) => origin.trim()))
		.refine(
			(list) => list.every(isOrigin),
			'origins such as https://example.com, comma-separated',
		),
	DEV_INSECURE_COOKIES: z.enum(['true', 'false']).optional(),
})

// Checked when first used, so a missing secret breaks signing in, not every request
// (docs/auth.md, "Settings").
const oidcSettings = z
	.object({
		OIDC_ISSUER: z.string().url(),
		OIDC_CLIENT_ID: z.string().min(1),
		OIDC_CLIENT_SECRET: z.string().min(1),
	})
	.transform((env) => ({
		issuer: env.OIDC_ISSUER,
		clientId: env.OIDC_CLIENT_ID,
		clientSecret: env.OIDC_CLIENT_SECRET,
	}))
const sealingSettings = z.object({
	SESSION_SECRET: z.string().min(32),
	SESSION_SECRET_PREVIOUS: z.string().min(32).optional(),
})

export function authFromEnv(env: { DB: D1Database }) {
	const { APP_ORIGINS, DEV_INSECURE_COOKIES } = requestSettings.parse(env)
	return {
		appOrigins: APP_ORIGINS,
		cookies: authCookies(DEV_INSECURE_COOKIES === 'true'),
		provider: () => zitadel(oidcSettings.parse(env), env),
		sessions: async () => {
			const { SESSION_SECRET, SESSION_SECRET_PREVIOUS } = sealingSettings.parse(env)
			const tokens = await sealer('session tokens', SESSION_SECRET, SESSION_SECRET_PREVIOUS)
			return sessionStore(drizzle(env.DB), tokens)
		},
	}
}

function isOrigin(text: string) {
	try {
		return new URL(text).origin === text
	} catch {
		return false
	}
}
