// From api/: pnpm test, which builds dist/ first: the routes are read from it.
import { drizzle } from 'drizzle-orm/d1'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createMemoryD1 } from '../../client/e2e/d1Memory.mjs'
import { appRouter } from '../dist/routes/appRouter.js'

const d1 = createMemoryD1(fileURLToPath(new URL('../migrations/', import.meta.url)))
const user = appRouter.createCaller({
	db: drizzle(d1),
	session: { checkedUser: async () => ({ roles: [] }) },
})

// An update could send a marker's tags whole, replacing the ones it had (docs/database.md, "A
// write sends only what changed"); nothing sent them, as tags are added and taken off one at a time.
test("a marker's update changes its fields, and is refused its tags", async () => {
	const { marker } = await user.mapMarker.insert({
		title: 'Kept',
		lat: 1,
		lng: 1,
		tags: ['a', 'b'],
	})
	const markerId = marker.mapMarkersId
	await assert.rejects(user.mapMarker.update({ markerId, tags: ['c'] }), { code: 'BAD_REQUEST' })
	await user.mapMarker.update({ markerId, title: '  Renamed ' })
	const [after] = await user.mapMarker.select({ search: markerId })
	assert.equal(after?.title, 'Renamed')
	assert.deepEqual([...(after?.tags ?? [])].sort(), ['a', 'b'])
})
