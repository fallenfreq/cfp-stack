// From api/: node --test 'test/*.test.mjs'  (Node 24 loads the .ts helper as it is)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sealer } from '../src/auth/sealing.ts'

const SECRET = 'a-test-secret-of-at-least-32-characters'
const OTHER = 'another-test-secret-of-32-characters!!'
const PLACE = 'row-1\nsubject-1\naccess_token'

test('a sealed value opens in its place', async () => {
	const tokens = await sealer('session tokens', SECRET)
	const sealed = await tokens.seal('the token', PLACE)
	assert.match(sealed, /^v1\.[\w-]+\.[\w-]+$/)
	assert.doesNotMatch(sealed, /the token/)
	assert.equal(await tokens.open(sealed, PLACE), 'the token')
	// A fresh IV each time.
	assert.notEqual(await tokens.seal('the token', PLACE), sealed)
	// Long values (an ID token) round-trip.
	const long = 'x'.repeat(5000)
	assert.equal(await tokens.open(await tokens.seal(long, PLACE), PLACE), long)
})

test("a sealed value moved to another row or column won't open", async () => {
	const tokens = await sealer('session tokens', SECRET)
	const sealed = await tokens.seal('the token', PLACE)
	for (const place of [
		'row-2\nsubject-1\naccess_token',
		'row-1\nsubject-2\naccess_token',
		'row-1\nsubject-1\nrefresh_token',
	])
		await assert.rejects(tokens.open(sealed, place))
})

test("a changed or malformed value won't open", async () => {
	const tokens = await sealer('session tokens', SECRET)
	const sealed = await tokens.seal('the token', PLACE)
	const [format, iv, data] = sealed.split('.')
	const flipped = (data[0] === 'A' ? 'B' : 'A') + data.slice(1)
	for (const bad of [
		`${format}.${iv}.${flipped}`,
		`v2.${iv}.${data}`,
		`${format}.${iv}`,
		`${sealed}.more`,
		'',
		'the token',
	])
		await assert.rejects(tokens.open(bad, PLACE), JSON.stringify(bad))
})

test('each purpose and each secret has its own key', async () => {
	const sealed = await (await sealer('session tokens', SECRET)).seal('the token', PLACE)
	await assert.rejects((await sealer('something else', SECRET)).open(sealed, PLACE))
	await assert.rejects((await sealer('session tokens', OTHER)).open(sealed, PLACE))
})

test('after rotating, the previous secret still opens but no longer seals', async () => {
	const before = await (await sealer('session tokens', SECRET)).seal('the token', PLACE)
	const rotated = await sealer('session tokens', OTHER, SECRET)
	assert.equal(await rotated.open(before, PLACE), 'the token')
	const after = await rotated.seal('the token', PLACE)
	await assert.rejects((await sealer('session tokens', SECRET)).open(after, PLACE))
	assert.equal(await (await sealer('session tokens', OTHER)).open(after, PLACE), 'the token')
})
