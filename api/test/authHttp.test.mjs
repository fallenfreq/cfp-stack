// From api/: node --test 'test/*.test.mjs'  (Node 24 loads the .ts helper as it is)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authCookies, fromOurPages, returnAddress } from '../src/auth/http.ts'

const ORIGIN = 'https://somefreq.com'
const HOME = 'https://somefreq.com/'

test('sign-in returns to an address on our origin', () => {
	for (const [requested, expected] of [
		['/account', 'https://somefreq.com/account'],
		['/editor/a?seed=true#top', 'https://somefreq.com/editor/a?seed=true#top'],
		['https://somefreq.com/admin', 'https://somefreq.com/admin'],
		// Parsed, these stay on our origin, so they're harmless paths.
		['/%5Cevil.com', 'https://somefreq.com/%5Cevil.com'],
		['https:evil.com', 'https://somefreq.com/evil.com'],
		// Absolute, so the path's leading `//` can't be read as another host.
		['/x/..//evil.com', 'https://somefreq.com//evil.com'],
	])
		assert.equal(returnAddress(requested, ORIGIN), expected, requested)
})

test('sign-in never returns to another origin', () => {
	for (const requested of [
		'//evil.com',
		'/\t/evil.com', // a browser drops the tab
		'/\r\n/evil.com',
		'/\\evil.com', // and reads `\` as `/`
		'\\\\evil.com',
		'https://evil.com/',
		'https://somefreq.com.evil.com/',
		'https://somefreq.com@evil.com/',
		'http://somefreq.com/', // another scheme is another origin
		'javascript:alert(1)',
		'data:text/html,hi',
	])
		assert.equal(returnAddress(requested, ORIGIN), HOME, JSON.stringify(requested))
	assert.equal(returnAddress(null, ORIGIN), HOME)
	assert.equal(returnAddress('', ORIGIN), HOME)
	// Over http (dev), an https address is another origin.
	assert.equal(returnAddress('https:evil.com', 'http://localhost:8788'), 'http://localhost:8788/')
})

const STATE = 'Ab3_-xYz'

test('live cookies are prefixed, Secure, HttpOnly and scoped to the whole site', () => {
	const cookies = authCookies(false)
	assert.equal(
		cookies.session.set('abc', 2592000),
		'__Host-Http-session=abc; Max-Age=2592000; Path=/; HttpOnly; SameSite=Strict; Secure',
	)
	assert.equal(
		cookies.signIn(STATE).set('{"a":"b c"}', 600),
		`__Host-signin-${STATE}=%7B%22a%22%3A%22b%20c%22%7D; Max-Age=600; Path=/; HttpOnly; SameSite=Lax; Secure`,
	)
	for (const cookie of [cookies.session, cookies.signIn(STATE)]) {
		const cleared = cookie.clear()
		assert.match(cleared, /^__Host-[^=]+=; Max-Age=0; Path=\/; HttpOnly; SameSite=\w+; Secure$/)
		assert.doesNotMatch(cleared, /Domain/i)
	}
})

test("dev cookies have the site's own names and no Secure", () => {
	const cookies = authCookies(true)
	assert.equal(
		cookies.session.set('abc', 60),
		'somefreq-session=abc; Max-Age=60; Path=/; HttpOnly; SameSite=Strict',
	)
	assert.equal(
		cookies.signIn(STATE).clear(),
		`somefreq-signin-${STATE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
	)
})

test('each sign-in under way has its own cookie, named by a state that can name one', () => {
	const cookies = authCookies(false)
	const header = [
		cookies.signIn('one').set('first', 600),
		cookies.signIn('two').set('second', 600),
	]
		.map((cookie) => cookie.split(';')[0])
		.join('; ')
	assert.equal(cookies.signIn('one').read(header), 'first')
	assert.equal(cookies.signIn('two').read(header), 'second')
	assert.equal(cookies.signIn('three').read(header), null)
	// The state comes from the callback's address: nothing that could add attributes or another
	// cookie to the header.
	for (const state of [null, '', 'a; Domain=evil.com', 'a=b', 'a b', 'a,b', 'x'.repeat(129)])
		assert.equal(cookies.signIn(state), null, JSON.stringify(state))
})

test('cookies are read by exact name, and a value round-trips', () => {
	const live = authCookies(false)
	const value = '{"checks":{"state":"s"},"returnTo":"https://somefreq.com/a?b=c;d"}'
	const set = live.signIn(STATE).set(value, 600).split(';')[0]
	const header = `other=1; ${set}; __Host-Http-session=xyz`
	assert.equal(live.signIn(STATE).read(header), value)
	assert.equal(live.session.read(header), 'xyz')
	// Live never reads the dev names, so a cookie set over http can't stand in for one.
	assert.equal(live.session.read('somefreq-session=xyz; session=xyz'), null)
	assert.equal(authCookies(true).session.read(header), null)
	assert.equal(live.session.read(null), null)
	assert.equal(live.session.read('__Host-Http-session=%E0%A4%A'), null) // malformed
})

test('only requests from our own pages may change anything', () => {
	const origins = ['https://somefreq.com']
	const from = (headers) => fromOurPages(new Headers(headers), origins)
	assert.equal(from({ 'Sec-Fetch-Site': 'same-origin' }), true)
	for (const site of ['same-site', 'cross-site', 'none'])
		assert.equal(from({ 'Sec-Fetch-Site': site, Origin: 'https://somefreq.com' }), false, site)
	// A browser that doesn't send Sec-Fetch-Site: Origin decides.
	assert.equal(from({ Origin: 'https://somefreq.com' }), true)
	assert.equal(from({ Origin: 'https://evil.com' }), false)
	assert.equal(from({ Origin: 'null' }), false)
	assert.equal(from({}), false)
})
