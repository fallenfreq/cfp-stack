// From api/: pnpm test, which builds dist/ first: the routes are read from it.
import { drizzle } from 'drizzle-orm/d1'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createMemoryD1 } from '../../client/e2e/d1Memory.mjs'
import { appRouter } from '../dist/routes/appRouter.js'

const d1 = createMemoryD1(fileURLToPath(new URL('../migrations/', import.meta.url)))
const admin = appRouter.createCaller({
	db: drizzle(d1),
	session: { checkedUser: async () => ({ roles: ['admin'] }) },
})
const content = (text) =>
	JSON.stringify({
		type: 'doc',
		content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
	})
const movedOn = {
	code: 'CONFLICT',
	message: 'This page was saved somewhere else after you opened it',
}

const named = async (name) => (await admin.adminPages.list()).filter((page) => page.name === name)
const stored = (pageId) => admin.adminPages.getWithTags({ pageId })

// A new page's first save, and each try after it, from one editor.
const firstSave = (savedFrom, name, text, newVersion = 1) =>
	admin.adminPages.create({ name, contentJson: content(text), savedFrom, newVersion })

// An editor open on a page: its own key, and the version it was opened at.
const openEditor = async (pageId) => ({
	pageId,
	savedFrom: randomUUID(),
	version: (await stored(pageId)).version,
})
// A save from the version the editor last had confirmed, making the next one unless told.
const save = (editor, text, newVersion = editor.version + 1) =>
	admin.adminPages.save({
		pageId: editor.pageId,
		contentJson: content(text),
		version: editor.version,
		newVersion,
		savedFrom: editor.savedFrom,
	})

test('a first save sent twice with one key makes one page, with the second', async () => {
	const key = randomUUID()
	const first = await firstSave(key, 'Twice', 'first try')
	const second = await firstSave(key, 'Twice renamed', 'second try', 2)
	assert.equal(second.pageId, first.pageId)
	assert.equal(second.slug, first.slug)
	assert.equal(second.version, 2)
	const page = await stored(first.pageId)
	assert.equal(page.contentJson, content('second try'))
	assert.equal(page.name, 'Twice renamed')
	assert.deepEqual(await named('Twice'), [])
})

test('a first save sent twice into a collection pairs it once', async () => {
	const key = randomUUID()
	const { tagId } = await admin.adminTags.create({ name: 'Twice collection' })
	const send = (newVersion) =>
		admin.adminPages.create({
			name: 'Twice collected',
			contentJson: content('made'),
			savedFrom: key,
			newVersion,
			tagIds: [tagId],
		})
	const first = await send(1)
	assert.equal((await send(2)).pageId, first.pageId)
	assert.deepEqual(
		(await stored(first.pageId)).tags.map((tag) => tag.tagId),
		[tagId],
	)
})

test('a first save arriving after its own retry is refused, and makes no second page', async () => {
	const key = randomUUID()
	const retry = await firstSave(key, 'Late first', 'retry', 2)
	await assert.rejects(firstSave(key, 'Late first', 'first try'), movedOn)
	assert.equal((await named('Late first')).length, 1)
	assert.equal((await stored(retry.pageId)).contentJson, content('retry'))
})

test('a retry after the first try’s page was deleted makes one page', async () => {
	const key = randomUUID()
	const first = await firstSave(key, 'Deleted first', 'first try')
	await admin.adminPages.delete({ pageId: first.pageId })
	const retry = await firstSave(key, 'Deleted first', 'retry', 2)
	assert.deepEqual(
		(await named('Deleted first')).map((page) => page.pageId),
		[retry.pageId],
	)
})

// The accepted second page: a new page's first try, held up, lands after its retry made the page
// and another editor saved that, so no page had the key. It made a second page with the key, and
// the first editor's every save of its own page then failed on the key's index.
test('a second page made by a late first try leaves its editor saving its own page', async () => {
	const key = randomUUID()
	const made = await firstSave(key, 'Raced', 'retry', 2)
	const other = await openEditor(made.pageId)
	await save(other, 'other tab')
	const second = await firstSave(key, 'Raced', 'held first try')
	assert.notEqual(second.pageId, made.pageId)
	const editor = { pageId: made.pageId, savedFrom: key, version: made.version }
	await assert.rejects(save(editor, 'mine'), movedOn)
	// Save over it, from the version the page has now.
	editor.version = (await stored(made.pageId)).version
	assert.deepEqual(await save(editor, 'mine'), { version: 4 })
	assert.equal((await stored(made.pageId)).contentJson, content('mine'))
	assert.equal((await stored(second.pageId)).contentJson, content('held first try'))
})

test('a save from an older version is refused, and the newer content stays', async () => {
	const { pageId } = await firstSave(randomUUID(), 'Two editors', 'made')
	const a = await openEditor(pageId)
	const b = await openEditor(pageId)
	assert.deepEqual(await save(b, 'from b'), { version: 2 })
	await assert.rejects(save(a, 'from a'), movedOn)
	const page = await stored(pageId)
	assert.equal(page.contentJson, content('from b'))
	assert.equal(page.version, 2)
})

test('a save sent again after a lost answer is taken; its older try arriving late is not', async () => {
	// The first try landed, its answer lost: the retry, from the same version, is still taken.
	const { pageId } = await firstSave(randomUUID(), 'Lost answer', 'made')
	const editor = await openEditor(pageId)
	await save(editor, 'first try')
	assert.deepEqual(await save(editor, 'more typed', 3), { version: 3 })
	assert.equal((await stored(pageId)).contentJson, content('more typed'))

	// The first try was held up and arrives after the retry: refused, the retry's content stays.
	const held = await openEditor(pageId)
	await save(held, 'retry', held.version + 2)
	await assert.rejects(save(held, 'held first try'), movedOn)
	const page = await stored(pageId)
	assert.equal(page.contentJson, content('retry'))
	assert.equal(page.version, 5)
})

test('another editor’s save in between refuses the first editor’s next save', async () => {
	const { pageId } = await firstSave(randomUUID(), 'In between', 'made')
	const a = await openEditor(pageId)
	await save(a, 'a saves')
	a.version = 2
	const b = await openEditor(pageId)
	await save(b, 'b saves')
	await assert.rejects(save(a, 'a again'), movedOn)
	assert.equal((await stored(pageId)).contentJson, content('b saves'))
})

test('a rename, address, published or collections change leaves the version', async () => {
	const { pageId } = await firstSave(randomUUID(), 'Settings', 'made')
	const editor = await openEditor(pageId)
	await save(editor, 'saved')
	const tag = await admin.adminTags.create({ name: 'Settings collection' })
	await admin.adminPages.update({ pageId, name: 'Settings renamed' })
	await admin.adminPages.update({ pageId, slug: 'settings-moved' })
	await admin.adminPages.update({ pageId, published: true })
	await admin.adminPages.setTag({ pageId, tagId: tag.tagId, tagged: true })
	assert.equal((await stored(pageId)).version, 2)
	// So the editor that opened the page before them still saves from the version it has.
	editor.version = 2
	assert.deepEqual(await save(editor, 'after the changes'), { version: 3 })
})

test('update no longer takes content, and is refused it', async () => {
	const { pageId } = await firstSave(randomUUID(), 'No content', 'made')
	await assert.rejects(admin.adminPages.update({ pageId, contentJson: content('sent') }), {
		code: 'BAD_REQUEST',
	})
	assert.equal((await stored(pageId)).contentJson, content('made'))
})

test('a save that doesn’t raise the version, or has no key, is refused', async () => {
	const { pageId } = await firstSave(randomUUID(), 'Inputs', 'made')
	const editor = await openEditor(pageId)
	const refused = { code: 'BAD_REQUEST' }
	await assert.rejects(save(editor, 'same', editor.version), refused)
	await assert.rejects(save({ ...editor, version: 0 }, 'zero', 1), refused)
	await assert.rejects(save({ ...editor, savedFrom: 'not a key' }, 'no key'), refused)
	await assert.rejects(firstSave(undefined, 'Inputs', 'no key'), refused)
})

test('a save of a page that is gone answers 404', async () => {
	const { pageId } = await firstSave(randomUUID(), 'Gone', 'made')
	const editor = await openEditor(pageId)
	await admin.adminPages.delete({ pageId })
	await assert.rejects(save(editor, 'too late'), { code: 'NOT_FOUND', message: 'Page not found' })
})

test('the public page leaves out the version and the editor’s key', async () => {
	const { pageId, slug } = await firstSave(randomUUID(), 'Public', 'made')
	await admin.adminPages.update({ pageId, published: true })
	const shown = await admin.publicPages.getBySlug({ slug })
	assert.equal(shown?.contentJson, content('made'))
	assert.ok(!('version' in shown) && !('savedFrom' in shown))
	const editing = await admin.adminPages.getBySlug({ slug })
	assert.equal(editing?.version, 1)
	assert.match(editing?.savedFrom ?? '', /^[0-9a-f-]{36}$/)
})
