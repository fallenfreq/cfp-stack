// From api/: node --test 'test/*.test.mjs'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createMemoryD1 } from '../../client/e2e/d1Memory.mjs'

const d1 = createMemoryD1(fileURLToPath(new URL('../migrations/', import.meta.url)))
const addTag = (name) => d1.prepare('INSERT INTO tags (name) VALUES (?)').bind(name)
const tags = async () =>
	(await d1.prepare('SELECT name FROM tags ORDER BY name').all()).results.map((t) => t.name)

// The layout checks, the preview and the seed script run the API's code on the in-memory D1, so
// it runs a batch as D1 does: one transaction (docs/database.md, "How we use it").
test('a batch in the in-memory D1 is one transaction', async () => {
	await d1.batch([addTag('a'), addTag('b')])
	await assert.rejects(d1.batch([addTag('c'), addTag('a'), addTag('d')]), /UNIQUE/)
	// SQLite ends this one itself; the error is still the statement's.
	const rollsBack = d1.prepare('INSERT OR ROLLBACK INTO tags (name) VALUES (?)').bind('a')
	await assert.rejects(d1.batch([addTag('e'), rollsBack]), /UNIQUE/)
	assert.deepEqual(await tags(), ['a', 'b'])
})
