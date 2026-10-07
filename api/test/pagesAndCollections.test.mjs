// From api/: pnpm test, which builds dist/ first: the routes are read from it.
import { drizzle } from 'drizzle-orm/d1'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createMemoryD1 } from '../../client/e2e/d1Memory.mjs'
import { appRouter } from '../dist/routes/appRouter.js'

const d1 = createMemoryD1(fileURLToPath(new URL('../migrations/', import.meta.url)))
const admin = appRouter.createCaller({
	db: drizzle(d1),
	session: { checkedUser: async () => ({ roles: ['admin'] }) },
})
const contentJson = JSON.stringify({ type: 'doc', content: [] })
const addPage = (name) => admin.adminPages.create({ name, contentJson })
const taken = { code: 'CONFLICT', message: 'That slug is already in use' }

test('a slug the admin chooses that another row has answers 409', async () => {
	const about = await addPage('About')
	const contact = await addPage('Contact')
	await assert.rejects(
		admin.adminPages.update({ pageId: contact.pageId, slug: about.slug }),
		taken,
	)

	const news = await admin.adminTags.create({ name: 'News' })
	const events = await admin.adminTags.create({ name: 'Events' })
	await assert.rejects(admin.adminTags.update({ tagId: events.tagId, slug: news.slug }), taken)
	await assert.rejects(admin.adminTags.create({ name: 'Other', slug: news.slug }), taken)
})

test('a slug made from a name fits its column, so its address takes it', async () => {
	const long = 'a'.repeat(256)
	const first = await addPage(long)
	const second = await addPage(long)
	assert.equal(first.slug, long)
	assert.equal(second.slug, `${'a'.repeat(254)}-2`)
	// Lowercased, İ is two characters, so its slug is longer than its name.
	const dotted = await addPage('İ'.repeat(200))
	for (const { slug } of [first, second, dotted]) {
		assert.ok(slug.length <= 256)
		assert.equal((await admin.adminPages.getBySlug({ slug }))?.slug, slug)
	}
	assert.doesNotMatch(dotted.slug, /-$/)
})

test('names are trimmed, and a name of spaces is refused', async () => {
	const page = await addPage('  Trimmed  ')
	assert.equal((await admin.adminPages.getBySlug({ slug: page.slug }))?.name, 'Trimmed')
	await assert.rejects(addPage('   '), { code: 'BAD_REQUEST' })
	await assert.rejects(admin.adminPages.update({ pageId: page.pageId, name: ' ' }), {
		code: 'BAD_REQUEST',
	})
	await assert.rejects(admin.adminTags.create({ name: '   ' }), { code: 'BAD_REQUEST' })
})
