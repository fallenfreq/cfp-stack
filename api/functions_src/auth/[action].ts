import { z } from 'zod'
import { fromOurPages, returnAddress } from '../../dist/auth/http.js'
import { authFromEnv } from '../../dist/auth/index.js'
import type { IdentityProvider } from '../../dist/auth/provider.js'
import { SESSION_SECONDS } from '../../dist/auth/sessions.js'

// GET /auth/login, GET /auth/callback, POST /auth/logout: signing in and out through our server
// (docs/auth.md, "Signing in", "Signing out"). Thin: the work is in src/auth.

interface AuthCall {
	request: Request
	url: URL
	auth: ReturnType<typeof authFromEnv>
	waitUntil: (promise: Promise<unknown>) => void
}

const SIGNIN_SECONDS = 10 * 60
// What `recent=1` asks the provider for: proof from the last minute, well inside the 10 minutes a
// sensitive change allows (sessions.ts), so there's time left to make it.
const RECENT_PROOF_SECONDS = 60
const savedSignIn = z.object({
	checks: z.record(z.string()),
	returnTo: z.string(),
	// The session this browser had when it set out, ended once the new one exists.
	earlier: z.string().nullable(),
})

const actions: Record<string, (call: AuthCall) => Promise<Response>> = {
	'GET login': login,
	'GET callback': callback,
	'POST logout': logout,
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
	const action = actions[`${context.request.method} ${context.params.action}`]
	if (!action) return text(404, 'Not found')
	try {
		return await action({
			request: context.request,
			url: new URL(context.request.url),
			auth: authFromEnv(context.env),
			waitUntil: (promise) => context.waitUntil(promise),
		})
	} catch (error) {
		console.error('Sign-in error:', message(error))
		return text(500, "Signing in isn't working right now.")
	}
}

// Sends you to the provider, keeping what the way back must check in a short-lived cookie.
// `recent=1`: you prove who you are again (before a sensitive change).
async function login({ request, url, auth }: AuthCall) {
	const returnTo = returnAddress(url.searchParams.get('returnTo'), url.origin)
	const recent = url.searchParams.get('recent') === '1'
	const { address, state, checks } = await auth
		.provider()
		.startSignIn(
			url.origin + '/auth/callback',
			recent ? { maxAgeSeconds: RECENT_PROOF_SECONDS } : {},
		)
	const cookie = auth.cookies.signIn(state)
	if (!cookie) throw new Error("The provider's state can't name a cookie")
	// The callback can't read the session cookie (Strict; the provider's redirect is cross-site),
	// so the earlier session goes with the sign-in. Its id, not its hash: only a browser that held
	// the session can end it this way.
	const earlier = auth.cookies.session.read(request.headers.get('Cookie'))
	const saved = JSON.stringify({ checks, returnTo, earlier })
	return reply(302, { Location: address }, [cookie.set(saved, SIGNIN_SECONDS)])
}

// Back from the provider: a new session, then where you were going.
async function callback({ request, url, auth, waitUntil }: AuthCall) {
	// This sign-in's own cookie; those of sign-ins under way in other tabs are left alone.
	const cookie = auth.cookies.signIn(url.searchParams.get('state'))
	const saved = savedSignIn.safeParse(
		parseJson(cookie?.read(request.headers.get('Cookie')) ?? null),
	)
	if (!cookie || !saved.success) {
		console.warn(
			"Sign-in didn't finish: none under way with this state (or over 10 minutes ago)",
		)
		return signInFailed(cookie?.clear())
	}
	const provider = auth.provider()
	let finished
	try {
		finished = await provider.finishSignIn(url, saved.data.checks)
	} catch (error) {
		console.warn(message(error))
		return signInFailed(cookie.clear())
	}
	const { subject } = finished.user
	const sessions = auth.sessions()
	let id
	try {
		id = await (await sessions).create(finished.user, finished.tokens)
	} catch (error) {
		// Not kept, so not left usable at the provider either.
		console.error('Saving a session failed:', { subject, error: message(error) })
		revokeLater(provider, finished.tokens.refreshToken, subject, waitUntil)
		return signInFailed(cookie.clear())
	}
	console.log('Signed in:', { subject })
	// The new session's cookie replaces the earlier one's, so that session goes too, in the
	// background: signing in has worked either way.
	const { earlier } = saved.data
	if (earlier)
		waitUntil(
			(async () => {
				const ended = await (await sessions).end(earlier)
				if (ended?.refreshToken) await provider.revoke(ended.refreshToken)
			})().catch((error) => {
				console.warn('Ending the earlier session failed:', message(error))
			}),
		)
	return reply(302, { Location: returnAddress(saved.data.returnTo, url.origin) }, [
		auth.cookies.session.set(id, SESSION_SECONDS),
		cookie.clear(),
	])
}

// Ends our session first, then sends you to end the provider's.
async function logout({ request, url, auth, waitUntil }: AuthCall) {
	if (!fromOurPages(request.headers, auth.appOrigins)) {
		console.warn('Refused a cross-site sign-out:', {
			site: request.headers.get('Sec-Fetch-Site'),
			origin: request.headers.get('Origin'),
		})
		return text(403, 'Forbidden')
	}
	const provider = auth.provider()
	const id = auth.cookies.session.read(request.headers.get('Cookie'))
	const ended = id ? await (await auth.sessions()).end(id) : null
	if (ended) revokeLater(provider, ended.refreshToken, ended.subject, waitUntil)
	console.log('Signed out:', { subject: ended?.subject ?? null })
	// Our session has ended either way: if the provider can't be reached, home instead.
	const home = url.origin + '/'
	const address = await provider.signOutAddress(ended?.idToken ?? null, home).catch((error) => {
		console.warn('No sign-out address from the provider:', message(error))
		return home
	})
	return reply(303, { Location: address }, [auth.cookies.session.clear()])
}

// In the background, but kept alive after the response, so a closed tab doesn't stop it.
function revokeLater(
	provider: IdentityProvider,
	refreshToken: string | null,
	subject: string,
	waitUntil: AuthCall['waitUntil'],
) {
	if (!refreshToken) return
	waitUntil(
		provider.revoke(refreshToken).catch((error) => {
			console.warn('Revoking a refresh token failed:', { subject, error: message(error) })
		}),
	)
}

function parseJson(json: string | null): unknown {
	try {
		return json === null ? null : JSON.parse(json)
	} catch {
		return null
	}
}

const message = (error: unknown) => (error instanceof Error ? error.message : error)

// Nothing about signing in may be cached.
function reply(
	status: number,
	headers: Record<string, string>,
	cookies: string[] = [],
	body: string | null = null,
) {
	const all = new Headers({ ...headers, 'Cache-Control': 'no-store' })
	for (const cookie of cookies) all.append('Set-Cookie', cookie)
	return new Response(body, { status, headers: all })
}

const text = (status: number, body: string) =>
	reply(status, { 'Content-Type': 'text/plain; charset=utf-8' }, [], body)

const signInFailed = (clearSignIn: string | undefined) =>
	reply(
		400,
		{ 'Content-Type': 'text/html; charset=utf-8' },
		clearSignIn ? [clearSignIn] : [],
		`<!doctype html><title>Sign-in</title><p>Sign-in didn't finish. <a href="/">Back to the site</a>, then try again.</p>`,
	)
