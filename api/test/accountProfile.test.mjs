// From api/: pnpm test, which builds dist/ first: the providers are read from it.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { zitadel } from '../dist/providers/zitadel.js'

// Zitadel's answers, stubbed: the profile as saved, and what a save sends.
const saved = {
	givenName: 'Ada',
	familyName: 'Lovelace',
	nickName: '',
	displayName: 'Ada L',
	// With the browser's extensions, which the page doesn't show.
	preferredLanguage: 'en-u-rg-gbzzzz',
	gender: 'GENDER_FEMALE',
}
const account = zitadel(
	{ issuer: 'https://zitadel.example.test', clientId: 'test', clientSecret: 'test' },
	{ ZITADEL_PROJECT_ID: 'test' },
).account({ subject: 'ada', accessToken: 'token' })

async function savesSent(changes) {
	const sent = []
	const real = globalThis.fetch
	globalThis.fetch = async (_url, init = {}) => {
		if (init.method === 'PUT') {
			sent.push(JSON.parse(init.body))
			return Response.json({})
		}
		return Response.json({
			user: {
				username: 'ada',
				human: { profile: saved, email: { email: 'ada@example.test' } },
			},
		})
	}
	try {
		assert.equal(await account.updateProfile(changes), 'done')
	} finally {
		globalThis.fetch = real
	}
	return sent
}

// The form sent every field as it had loaded them, which put back a field changed elsewhere since
// (docs/database.md, "A write sends only what changed").
test('a profile save changes the fields sent, and keeps the rest as saved now', async () => {
	assert.deepEqual(await savesSent({ nickname: 'Countess' }), [
		{
			firstName: 'Ada',
			lastName: 'Lovelace',
			nickName: 'Countess',
			displayName: 'Ada L',
			preferredLanguage: 'en-u-rg-gbzzzz',
			gender: 'GENDER_FEMALE',
		},
	])
	// Nothing changed: Zitadel would refuse it, so nothing is sent.
	assert.deepEqual(await savesSent({ nickname: '' }), [])
	assert.deepEqual(await savesSent({}), [])
})
