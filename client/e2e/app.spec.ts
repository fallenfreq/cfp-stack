import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { box, breakpoints, openTests, settle, steadyRequests, useTheme } from './helpers'

// App screens: outside documents, a layout measures the layout around it.

test('the site nav swaps its links for a menu button when it is narrow', async ({
	page,
	themeClass,
}) => {
	await steadyRequests(page)
	await page.goto('/')
	await useTheme(page, themeClass)
	const nav = page.locator('.site-nav')
	const links = nav.locator('.nav-links.sl-hide-below-sm')
	const menu = nav.locator('.sl-show-below-sm')
	const { sm } = breakpoints() as { sm: number }

	for (const viewport of [1440, sm - 40]) {
		await page.setViewportSize({ width: viewport, height: 900 })
		await settle(page)
		const wide = (await box(nav)).width > sm
		if (viewport < sm) expect(wide, 'the nav is narrow in a narrow window').toBe(false)
		expect(await links.isVisible(), `links at ${viewport}px`).toBe(wide)
		expect(await menu.isVisible(), `menu button at ${viewport}px`).toBe(!wide)
	}
})

test('a page starts as far below the site nav as the nav sits below the top', async ({
	page,
	themeClass,
}) => {
	const roomBelowNav = async (first: string) => {
		await page.evaluate(() => window.scrollTo(0, 0))
		const nav = await box(page.locator('.site-nav'))
		expect(nav.top, 'the theme leaves room above the nav').toBeGreaterThan(0)
		const below = (await box(page.locator(first))).top - nav.bottom
		expect(Math.abs(below - nav.top), `room above ${first}`).toBeLessThanOrEqual(1)
	}
	// The editor's bar adds no room of its own; a page with a title adds none either.
	await openTests(page, themeClass)
	await roomBelowNav('.editor-top-bar')
	await page.goto('/contact')
	await useTheme(page, themeClass)
	await roomBelowNav('main h1')
})

test('while writing, the page scrolls on until its last line sits under the bar, the footer at the bottom', async ({
	page,
	themeClass,
}) => {
	// The page's end, the footer and the room between them (the page margin, with none added).
	const end = () =>
		page.evaluate(() => {
			const content = document.querySelector('main')!.getBoundingClientRect()
			const footer = document.querySelector('.app-footer')!.getBoundingClientRect()
			const margin = parseFloat(
				getComputedStyle(document.querySelector('.app-frame')!).rowGap,
			)
			const bar = document.querySelector('.editor-top-bar')?.getBoundingClientRect()
			const last = document
				.querySelector('.tiptap')!
				.lastElementChild!.getBoundingClientRect()
			return { content: content.bottom, footer, margin, screen: innerHeight, bar, last }
		})
	const scrollTo = (to: 'its end mid-screen' | 'the end') =>
		page.evaluate((to) => {
			const content = document.querySelector('main')!.getBoundingClientRect()
			if (to === 'the end') window.scrollTo(0, document.documentElement.scrollHeight)
			else window.scrollBy(0, content.bottom - innerHeight / 2)
		}, to)

	await openTests(page, themeClass)
	await scrollTo('its end mid-screen')
	await settle(page)
	let at = await end()
	expect(at.footer.top, 'the footer below the content, with room between').toBeGreaterThan(
		at.content + at.margin,
	)
	expect(
		Math.abs(at.footer.bottom - at.screen),
		'at the bottom of the screen',
	).toBeLessThanOrEqual(1)
	await scrollTo('the end')
	await settle(page)
	at = await end()
	expect(
		Math.abs(at.last.top - at.bar!.bottom),
		'the last line just under the bar',
	).toBeLessThanOrEqual(1)
	expect(
		Math.abs(at.footer.bottom - at.screen),
		'the footer still at the bottom',
	).toBeLessThanOrEqual(1)

	// A published page ends with the footer, straight after the content.
	await fakeReplies(page, {
		'Pages.getBySlug': storedPage('home', 'Home', [
			{ type: 'paragraph', content: [{ type: 'text', text: 'A paragraph.' }] },
		]),
	})
	await page.goto('/')
	await useTheme(page, themeClass)
	await expect(page.locator('main p')).toHaveText('A paragraph.')
	await scrollTo('the end')
	await settle(page)
	at = await end()
	expect(Math.abs(at.footer.top - at.content - at.margin), 'no room added').toBeLessThanOrEqual(1)
})

/**
 * Answer these API calls (by the end of their name) with the data given, whatever the database
 * holds; other calls go through.
 */
async function fakeReplies(page: Page, replies: Record<string, unknown>): Promise<void> {
	await page.route('**/trpc/**', async (route) => {
		const calls = new URL(route.request().url()).pathname.replace('/trpc/', '').split(',')
		const faked = calls.map((call) => Object.keys(replies).find((name) => call.endsWith(name)))
		if (!faked.some(Boolean)) return route.fallback()
		// A batch with real calls in it goes to the API for their answers; one of faked calls only
		// never reaches it.
		const answers = faked.every(Boolean) ? [] : await (await route.fetch()).json()
		faked.forEach((name, at) => {
			if (name) answers[at] = { result: { data: { json: replies[name] } } }
		})
		return route.fulfill({ json: answers })
	})
}

/** A stored page with this content, as the API returns it. */
const storedPage = (slug: string, name: string, content: unknown[]) => ({
	slug,
	name,
	published: true,
	contentJson: JSON.stringify({ type: 'doc', content }),
})

test("a stored page sits on the page's line, as an app screen does", async ({
	page,
	themeClass,
}) => {
	// The home page, whatever the database holds: a plain heading and paragraph, with no
	// spacing of their own.
	await steadyRequests(page)
	await fakeReplies(page, {
		'Pages.getBySlug': storedPage('home', 'Home', [
			{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Home' }] },
			{ type: 'paragraph', content: [{ type: 'text', text: 'A paragraph.' }] },
		]),
	})
	await page.goto('/')
	await useTheme(page, themeClass)
	const title = page.locator('main h1')
	await expect(title).toHaveText('Home')
	const nav = await box(page.locator('.site-nav'))
	expect((await box(title)).left, 'off the screen edge').toBeGreaterThan(0)
	expect(Math.abs((await box(title)).left - nav.left)).toBeLessThanOrEqual(1)
})

test("a page in a collection's sheet sits on the sheet's line, and bleeds to its edges", async ({
	page,
	themeClass,
}) => {
	await steadyRequests(page)
	await fakeReplies(page, {
		'Tags.getBySlug': { tagId: 1, name: 'A collection', slug: 'test', published: true },
		'Pages.listByCollection': [],
		'Pages.getBySlug': storedPage('in-sheet', 'In the sheet', [
			{ type: 'paragraph', content: [{ type: 'text', text: 'On the line' }] },
			{
				type: 'div',
				attrs: { class: 'sl-bleed sf-depth-1' },
				content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Edge to edge' }] }],
			},
		]),
	})
	await page.goto('/c/test?open=in-sheet')
	await useTheme(page, themeClass)
	const sheet = page.locator('.sheet')
	const paragraph = sheet.locator('.tiptap p', { hasText: 'On the line' })
	await expect(paragraph).toBeVisible()
	await expect(sheet).toHaveCSS('transform', 'none')

	const body = await box(sheet.locator('.sheet-body'))
	const line = (await box(sheet.locator('.sheet-bar'))).left
	const text = await box(paragraph)
	const bleed = await box(sheet.locator('.tiptap > .sl-bleed'))
	expect(text.left - body.left, 'the sheet has a margin').toBeGreaterThan(1)
	expect(
		Math.abs(text.left - line),
		'the text starts where the top row does',
	).toBeLessThanOrEqual(1)
	expect(Math.abs(bleed.left - body.left), 'the bleed reaches the left edge').toBeLessThanOrEqual(
		1,
	)
	expect(
		Math.abs(bleed.right - body.right),
		'the bleed reaches the right edge',
	).toBeLessThanOrEqual(1)
})

/** A collection whose sheet opens `in-sheet`, a page of one paragraph; other pages can be listed. */
const sheetCollection = (listed: { slug: string; name: string }[] = []) => ({
	'Tags.getBySlug': { tagId: 1, name: 'A collection', slug: 'test', published: true },
	'Pages.listByCollection': listed.map((p) => ({ ...p, imageUrl: null })),
	'Pages.getBySlug': storedPage('in-sheet', 'In the sheet', [
		{ type: 'paragraph', content: [{ type: 'text', text: 'Shown to the end' }] },
	]),
})

test("a page closed in a collection's sheet still shows as the sheet slides away", async ({
	page,
}) => {
	await steadyRequests(page)
	await fakeReplies(page, sheetCollection())
	await page.goto('/c/test?open=in-sheet')
	const sheet = page.locator('.sheet')
	await expect(sheet.locator('.tiptap p')).toHaveText('Shown to the end')
	await expect(sheet).toHaveCSS('transform', 'none')

	// The page's text as the sheet starts to slide away.
	const shownAsItLeaves = sheet.evaluate(
		(sheet) =>
			new Promise<string>((resolve) =>
				new MutationObserver((_, watching) => {
					if (!sheet.classList.contains('slide-leave-active')) return
					watching.disconnect()
					resolve(sheet.querySelector('.page-content')?.textContent ?? '')
				}).observe(sheet, { attributeFilter: ['class'] }),
			),
	)
	await page.getByRole('button', { name: 'Close' }).click()
	expect(await shownAsItLeaves).toBe('Shown to the end')
	await expect(sheet).toHaveCount(0)
	await expect(page.locator('.tiptap'), 'nothing of it left').toHaveCount(0)
})

test("another page opened in a collection's sheet leaves nothing of the one before", async ({
	page,
}) => {
	await steadyRequests(page)
	await fakeReplies(page, sheetCollection([{ slug: 'gone', name: 'Not there' }]))
	await page.goto('/c/test?open=in-sheet')
	const sheet = page.locator('.sheet')
	await expect(sheet.locator('.tiptap p')).toHaveText('Shown to the end')

	// The next page isn't found: the sheet stays, and the page before it goes.
	await fakeReplies(page, { 'Pages.getBySlug': null })
	await page.getByRole('link', { name: 'Not there' }).click()
	await expect(sheet.getByText('Page not found.')).toBeVisible()
	await expect(sheet.locator('.tiptap'), 'nothing of the page before').toHaveCount(0)
})

// The editor opens a stored page as signed in as an admin, the page faked like the ones above.
async function openStored(page: Page, themeClass: string | null, stored: unknown) {
	await steadyRequests(page)
	await fakeReplies(page, {
		'session.get': { name: 'Admin', email: 'admin@example.test', roles: ['admin'] },
		'Pages.getBySlug': stored,
	})
	await page.goto('/editor/stored')
	await useTheme(page, themeClass)
}

/** A stored page holding one paragraph. */
const oneParagraph = {
	pageId: 1,
	...storedPage('stored', 'Stored', [
		{ type: 'paragraph', content: [{ type: 'text', text: 'A paragraph.' }] },
	]),
}

// Opening a page isn't an edit: the editor opens with it, outside the undo history. Undo after it
// opened took the page back out, for Save to store the empty page.
test('undo goes back no further than a stored page as it opened in the editor', async ({
	page,
	themeClass,
}) => {
	await openStored(page, themeClass, oneParagraph)
	const text = page.locator('.tiptap p').first()
	await expect(text).toHaveText('A paragraph.')
	await page.evaluate(() =>
		(document.querySelector('.tiptap') as any).editor.commands.focus('end'),
	)
	// A letter typed and undone, so Undo is known to reach the editor; then once more.
	await page.keyboard.type('x')
	await expect(text).toHaveText('A paragraph.x')
	for (const press of ['the letter', 'once more']) {
		await page.keyboard.press('ControlOrMeta+z')
		await settle(page)
		await expect(text, press).toHaveText('A paragraph.')
	}
})

// A stored page that can't open says so, with no editor: Save can't store what was read of it over
// it, or make a new page at its address.
test("a stored page that can't open says so, with no editor to save", async ({
	page,
	themeClass,
}) => {
	const unopenable = "This page can't be opened."
	const cases: [string, unknown, string][] = [
		[
			'not valid',
			{ pageId: 1, ...storedPage('stored', 'Stored', [{ type: 'noSuchBlock' }]) },
			unopenable,
		],
		['not JSON', { ...oneParagraph, contentJson: 'not JSON' }, unopenable],
		['JSON, not a document', { ...oneParagraph, contentJson: 'null' }, unopenable],
		['not there', null, "There's no page at this address."],
	]
	for (const [name, stored, message] of cases) {
		await openStored(page, themeClass, stored)
		await expect(page.getByText(message), name).toBeVisible()
		await expect(page.locator('.tiptap'), name).toHaveCount(0)
	}

	// A page that opens, then fails to arrive when it's fetched again.
	await openStored(page, themeClass, oneParagraph)
	await expect(page.locator('.tiptap p').first()).toHaveText('A paragraph.')
	await page.route(
		(url) => url.pathname.includes('adminPages.getBySlug'),
		(route) => route.abort(),
	)
	await page.reload()
	await expect(page.getByText("This page couldn't be loaded.")).toBeVisible()
	await expect(page.locator('.tiptap')).toHaveCount(0)
})

// Save in the code view stored the code itself: the page became one code block.
test('Save in the code view saves the page, with the changes made to its code', async ({
	page,
	themeClass,
}) => {
	await openStored(page, themeClass, oneParagraph)
	await expect(page.locator('.tiptap p').first()).toHaveText('A paragraph.')
	let saved: any = null
	await page.route(
		(url) => url.pathname.includes('adminPages.update'),
		(route) => {
			saved = JSON.parse(route.request().postDataJSON()[0].json.contentJson)
			return route.fulfill({ json: [{ result: { data: { json: null } } }] })
		},
	)
	const codeView = page.getByRole('button', { name: 'Code view' })
	await codeView.click()
	await expect(codeView).toHaveAttribute('aria-pressed', 'true')
	const writeCode = async (code: string) => {
		await page.locator('.tiptap:visible').click()
		await page.keyboard.press('ControlOrMeta+a')
		await page.keyboard.type(code)
	}
	const save = page.getByRole('button', { name: 'Save' })
	await page.getByRole('button', { name: 'Editor actions' }).click()
	// Code the page can't read isn't saved, and says so.
	await writeCode('<marquee>Moving</marquee>')
	await save.click()
	await expect(
		page.getByText("Not saved: The page can't read <marquee> in this code."),
	).toBeVisible()
	expect(saved).toBeNull()
	await writeCode('<p>From the code.</p>')
	await save.click()
	await expect.poll(() => saved).not.toBeNull()
	const blocks = saved.content.map((block: any) => [
		block.type,
		block.content?.map((text: any) => text.text).join(''),
	])
	expect(blocks).toEqual([['paragraph', 'From the code.']])
	await expect(codeView, 'still in the code view').toHaveAttribute('aria-pressed', 'true')
})
