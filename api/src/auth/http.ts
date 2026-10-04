// Signing in's HTTP rules (docs/auth.md, "Cookies", "Signing in", "Forged requests"): our cookies,
// where sign-in may return to, and which requests may change anything. No imports, so unit tests
// load it directly.

// Live names carry prefixes, so the browser refuses them unless Secure, Path=/ and without a
// Domain: no subdomain or plain-http page can set them. Safari won't keep Secure cookies over
// http://localhost, so dev drops Secure and the prefixes, chosen by a dev-only setting, never by
// the request; its names are the site's own, since every app on localhost shares cookies.
export function authCookies(insecure: boolean) {
	const cookie = (name: string, sameSite: 'Strict' | 'Lax') => {
		const header = (value: string, maxAge: number) =>
			[
				`${name}=${encodeURIComponent(value)}`,
				`Max-Age=${maxAge}`,
				'Path=/',
				'HttpOnly',
				`SameSite=${sameSite}`,
				...(insecure ? [] : ['Secure']),
			].join('; ')
		return {
			read: (cookieHeader: string | null) => readCookie(cookieHeader, name),
			set: (value: string, maxAgeSeconds: number) => header(value, maxAgeSeconds),
			// The same attributes again: the browser ignores clearing a prefixed cookie without them.
			clear: () => header('', 0),
		}
	}
	return {
		// Strict: only our own fetches and the sign-out form need it.
		session: cookie(insecure ? 'somefreq-session' : '__Host-Http-session', 'Strict'),
		// One per sign-in under way, named by its state, so sign-ins in two tabs don't undo each
		// other. Lax: it has to come back with the provider's redirect. The state arrives in the
		// callback's address, so one that couldn't be a cookie name is refused (null).
		signIn: (state: string | null) =>
			state && /^[\w-]{1,128}$/.test(state)
				? cookie(`${insecure ? 'somefreq-signin-' : '__Host-signin-'}${state}`, 'Lax')
				: null,
	}
}

function readCookie(cookieHeader: string | null, name: string): string | null {
	for (const pair of cookieHeader?.split(';') ?? []) {
		const at = pair.indexOf('=')
		if (at < 0 || pair.slice(0, at).trim() !== name) continue
		try {
			return decodeURIComponent(pair.slice(at + 1).trim())
		} catch {
			return null
		}
	}
	return null
}

// Where sign-in may send you back to: anywhere on our origin, else home. Resolved by the URL parser,
// not matched by a pattern (browsers drop tabs and newlines and read `\` as `/`, so `/\t/evil.com`
// passes a pattern and lands elsewhere). Absolute, because a path such as `//evil.com` on its own
// would leave the origin.
export function returnAddress(requested: string | null, origin: string): string {
	if (requested) {
		try {
			const url = new URL(requested, origin)
			if (url.origin === origin) return url.href
		} catch {
			// Not an address: home.
		}
	}
	return new URL('/', origin).href
}

// A request that changes something must come from our own pages. Browsers say where a request
// came from in Sec-Fetch-Site; older ones only in Origin, which must then be one of ours. Neither,
// or Origin `null` (sandboxed frames, some redirects): refused.
export function fromOurPages(headers: Headers, origins: readonly string[]): boolean {
	const site = headers.get('Sec-Fetch-Site')
	if (site) return site === 'same-origin'
	const origin = headers.get('Origin')
	return origin !== null && origins.includes(origin)
}
