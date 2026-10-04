import { drizzle } from 'drizzle-orm/d1'
import { z } from 'zod'
import { zitadel } from '../providers/zitadel.js'
import { authCookies } from './http.js'
import type { AccountProvider } from './provider.js'
import { sealer } from './sealing.js'
import { sessionStore, userOf, type Session, type SessionUser, type WaitUntil } from './sessions.js'

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

/** The session a request carries, read when first asked for, once. */
export interface RequestSession {
	/** Who's signed in, as last known; null if no one. */
	user(): Promise<SessionUser | null>
	/** The same, vouched for by the provider in the last 10 minutes (calls that need sign-in). */
	checkedUser(): Promise<SessionUser | null>
	/** Your account at the provider, with the session's own token (account calls). */
	account(): Promise<{ user: SessionUser; account: AccountProvider } | null>
	/** Whether it was asked for: the response then depends on the cookie. */
	readonly used: boolean
}

export function authFromEnv(env: { DB: D1Database }) {
	const { APP_ORIGINS, DEV_INSECURE_COOKIES } = requestSettings.parse(env)
	const cookies = authCookies(DEV_INSECURE_COOKIES === 'true')
	const provider = () => zitadel(oidcSettings.parse(env), env)
	const sessions = async () => {
		const { SESSION_SECRET, SESSION_SECRET_PREVIOUS } = sealingSettings.parse(env)
		const tokens = await sealer('session tokens', SESSION_SECRET, SESSION_SECRET_PREVIOUS)
		return sessionStore(drizzle(env.DB), tokens, provider().identity)
	}

	function forRequest(request: Request, waitUntil: WaitUntil): RequestSession {
		const id = cookies.session.read(request.headers.get('Cookie'))
		let used = false
		const store = once(sessions)
		const stored = once(async () => {
			used = true
			return id ? (await store()).read(id) : null
		})
		const checked = once(async () => {
			const session = await stored()
			return session && (await store()).checked(session, waitUntil)
		})
		const account = once(async () => {
			const session = await checked()
			const accessToken = session && (await (await store()).accessToken(session, waitUntil))
			if (!session || !accessToken) return null
			return {
				user: userOf(session),
				account: provider().account({ subject: session.subject, accessToken }),
			}
		})
		return {
			get used() {
				return used
			},
			user: async () => toUser(await stored()),
			checkedUser: async () => toUser(await checked()),
			account,
		}
	}

	return {
		appOrigins: APP_ORIGINS,
		cookies,
		provider: () => provider().identity,
		sessions,
		forRequest,
	}
}

// Runs `load` when first called; later calls share its answer.
function once<T>(load: () => Promise<T>) {
	let loaded: Promise<T> | undefined
	return () => (loaded ??= load())
}

const toUser = (session: Session | null) => session && userOf(session)

function isOrigin(text: string) {
	try {
		return new URL(text).origin === text
	} catch {
		return false
	}
}
