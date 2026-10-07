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
	// 𠀀 is two code units, and the cut that makes room for -2 falls between them: the half goes.
	const astral = `a${'𠀀'.repeat(127)}b`
	await addPage(astral)
	const halved = await addPage(astral)
	assert.ok(halved.slug.isWellFormed())
	for (const { slug } of [first, second, halved]) {
		assert.ok(slug.length <= 256)
		assert.equal((await admin.adminPages.getBySlug({ slug }))?.slug, slug)
	}
})

test('a slug holds letters and numbers in any alphabet, lowercased and composed', async () => {
	const slugs = []
	for (const name of ['Ελλάδα', 'Москва 2026', '日本', 'Café', 'Cafe\u0301']) {
		slugs.push((await addPage(name)).slug)
	}
	// The last is the same name with its accent stored apart, so the same slug, moved aside.
	assert.deepEqual(slugs, ['ελλάδα', 'москва-2026', '日本', 'café', 'café-2'])
	assert.equal((await admin.adminPages.getBySlug({ slug: 'ΕΛΛΆΔΑ' }))?.name, 'Ελλάδα')
	assert.equal((await admin.adminPages.getBySlug({ slug: 'cafe\u0301' }))?.name, 'Café')

	const tag = await admin.adminTags.create({ name: 'News' })
	await admin.adminTags.update({ tagId: tag.tagId, slug: 'Νέα' })
	assert.equal((await admin.publicTags.getBySlug({ slug: 'νέα' }))?.tagId, tag.tagId)
	// Lowercased after the hyphens, as an address is, so an all-capitals address finds the page.
	await addPage('ΟΔΟΣ.ΤΕΣΤ')
	assert.equal((await admin.adminPages.getBySlug({ slug: 'ΟΔΟΣ-ΤΕΣΤ' }))?.name, 'ΟΔΟΣ.ΤΕΣΤ')
	// Lowercased, İ leaves a dot on its i, which goes: istanbul, as it's typed.
	assert.equal((await addPage('İstanbul')).slug, 'istanbul')
	assert.equal((await admin.adminPages.getBySlug({ slug: 'İSTANBUL' }))?.name, 'İstanbul')
	// What shows nothing (the selector after ☀ and ❤) and marks on nothing are dropped.
	assert.equal((await addPage('Summer ☀\ufe0f')).slug, 'summer')
	for (const slug of ['a b', 'a_b', 'a/b', 'a\ufe0f', '\u0301a']) {
		await assert.rejects(admin.adminTags.update({ tagId: tag.tagId, slug }), {
			code: 'BAD_REQUEST',
		})
	}
})

test('a name with no letter or number, which makes no slug, is refused', async () => {
	const refused = {
		code: 'BAD_REQUEST',
		message: 'A name needs a letter or a number for its address',
	}
	await assert.rejects(addPage('!!!'), refused)
	await assert.rejects(addPage('❤\ufe0f'), refused)
	// A Hangul filler: a letter that shows nothing.
	await assert.rejects(addPage('\u3164'), refused)
	await assert.rejects(admin.adminTags.create({ name: '🎉' }), refused)
})

test('however many rows share a name, the next gets a slug', async () => {
	const pages = []
	for (let i = 0; i < 52; i++) pages.push(await addPage('Many'))
	assert.equal(pages.at(-1).slug, 'many-52')
	await admin.adminPages.delete({ pageId: pages[2].pageId })
	assert.equal((await addPage('Many')).slug, 'many-3')
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
