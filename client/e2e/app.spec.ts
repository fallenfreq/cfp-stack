import type { Page, Route } from '@playwright/test'
import type { JSONContent, TiptapEditorHTMLElement } from '@tiptap/vue-3'
import { expect, test } from './fixtures'
import {
	appMessages,
	box,
	breakpoints,
	moveTo,
	openTests,
	settle,
	steadyRequests,
	useTheme,
} from './helpers'

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

// Sign-in can land after a page's public copy is asked for, with it (the home page's are asked
// together) or later. The read moves to the admin's copy, and the public copy stays on screen until
// it arrives: the home page went blank meanwhile. The copy of another page or collection never
// stays: a collection moved to while the admin's list loaded kept the list before.
test('sign-in landing keeps the page on screen, and never another page', async ({
	page,
	themeClass,
}) => {
	await steadyRequests(page)
	// Who's signed in and the admin's copies, each held until let through.
	const held: Record<string, Promise<void>> = {}
	const hold = (call: string) => {
		let release!: () => void
		held[call] = new Promise<void>((resolve) => (release = resolve))
		return release
	}
	let published = true
	const replies = (call: string, input: { slug?: string; collectionSlug?: string }) => {
		const copy = call.startsWith('admin') ? 'admin' : 'public'
		if (call === 'publicPages.getBySlug' && !published) return null
		if (call === 'session.get')
			return { name: 'Admin', email: 'admin@example.test', roles: ['admin'] }
		if (call.endsWith('Tags.getBySlug'))
			return { tagId: 1, name: input.slug, slug: input.slug, published: true }
		if (call.endsWith('Pages.getBySlug'))
			return storedPage(input.slug!, 'Home', [
				{ type: 'paragraph', content: [{ type: 'text', text: `The ${copy} home.` }] },
			])
		if (call.endsWith('Pages.listByCollection'))
			return [{ slug: 'listed', name: `${copy} in ${input.collectionSlug}`, imageUrl: null }]
		return undefined
	}
	// As fakeReplies does: a batch with other calls in it goes to the API for theirs.
	await page.route('**/trpc/**', async (route) => {
		const url = new URL(route.request().url())
		const calls = url.pathname.replace('/trpc/', '').split(',')
		const inputs = JSON.parse(url.searchParams.get('input') ?? '{}')
		const answers = calls.map((call, at) => replies(call, inputs[at]?.json ?? {}))
		if (answers.every((answer) => answer === undefined)) return route.fallback()
		await Promise.all(
			Object.entries(held).map(
				([name, wait]) => calls.some((call) => call.startsWith(name)) && wait,
			),
		)
		const real = answers.includes(undefined) ? await (await route.fetch()).json() : []
		return route.fulfill({
			json: answers.map((answer, at) =>
				answer === undefined ? real[at] : { result: { data: { json: answer } } },
			),
		})
	})
	const asked = (call: string) => page.waitForRequest((request) => request.url().includes(call))

	let letThrough = hold('adminPages.')
	let adminRead = asked('adminPages.getBySlug')
	await page.goto('/')
	await useTheme(page, themeClass)
	await adminRead
	await settle(page)
	const text = page.locator('main .tiptap p')
	await expect(text, 'while the admin copy loads').toHaveText('The public home.')
	letThrough()
	await expect(text).toHaveText('The admin home.')

	// Not published, the public read finds nothing, which doesn't stand in: there is a page.
	published = false
	letThrough = hold('adminPages.')
	adminRead = asked('adminPages.getBySlug')
	await page.goto('/')
	await adminRead
	await settle(page)
	await expect(page.locator('main').getByText('Loading…')).toBeVisible()
	await expect(page.getByText('Nothing here yet.'), 'not published').toHaveCount(0)
	letThrough()
	await expect(text).toHaveText('The admin home.')

	// A collection's list is asked for after sign-in is known, unless that's slow. Then a collection
	// seen before, while the admin's list still loads: its own public list shows, not the one before.
	const letSignIn = hold('session.get')
	letThrough = hold('adminPages.')
	await page.goto('/c/second')
	await expect(page.getByText('public in second')).toBeVisible()
	await moveTo(page, '/c/first')
	await expect(page.getByText('public in first')).toBeVisible()
	adminRead = asked('adminPages.listByCollection')
	letSignIn()
	await adminRead
	await settle(page)
	await expect(page.getByText('public in first'), 'while the admin list loads').toBeVisible()
	await moveTo(page, '/c/second')
	await expect(page.getByText('public in second')).toBeVisible()
	await expect(page.getByText('public in first'), 'the collection before').toHaveCount(0)
	letThrough()
	await expect(page.getByText('admin in second')).toBeVisible()
})

// Each dark mode switch registered the secret pink mode key, and the second was refused with a
// log line; the key is the app's.
test('opening a page logs nothing, and the pink mode key works', async ({ page }) => {
	const logged = appMessages(page, ['log', 'info', 'warning', 'error'])
	await steadyRequests(page)
	await page.goto('/contact')
	await expect(page.locator('main h1')).toHaveText('Contact')
	await settle(page)
	expect(logged).toEqual([])

	const html = page.locator('html')
	await page.keyboard.press('Control+Shift+K')
	await expect(html).toHaveClass(/(^|\s)theme-pink(\s|$)/)
	await page.keyboard.press('Control+Shift+K')
	await expect(html).not.toHaveClass(/(^|\s)theme-pink(\s|$)/)
})

// The sheet follows the theme's breakpoint for narrow screens. It waited for the theme to load,
// and with the theme already loaded, stopping the wait threw.
test('a collection opened once the theme has loaded logs no errors', async ({ page }) => {
	const errors = appMessages(page, ['error'])
	await steadyRequests(page)
	await fakeReplies(page, sheetCollection())
	await page.goto('/contact')
	await page.waitForFunction(
		() =>
			(document.querySelector('#app') as any).__vue_app__.config.globalProperties.$pinia.state
				.value.themeTokens?.hydrated,
	)
	await moveTo(page, '/c/test?open=in-sheet')
	await expect(page.locator('.sheet .tiptap p')).toHaveText('Shown to the end')
	expect(errors).toEqual([])
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
		document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.commands.focus('end'),
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
	let saved: JSONContent | null = null
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
	const blocks = (saved as JSONContent | null)?.content?.map((block) => [
		block.type,
		block.content?.map((text) => text.text).join(''),
	])
	expect(blocks).toEqual([['paragraph', 'From the code.']])
	await expect(codeView, 'still in the code view').toHaveAttribute('aria-pressed', 'true')
})

/** Type at the end of the page in the editor, once it has the keys (it takes them a frame later). */
async function typeAtEnd(page: Page, text: string) {
	await page.locator('.tiptap').first().waitFor()
	await page.evaluate(() =>
		document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.commands.focus('end'),
	)
	await expect(page.locator('.tiptap').first()).toBeFocused()
	await page.keyboard.type(text)
}

const leaveQuestion = (page: Page) =>
	page.getByRole('dialog', { name: 'Leave without saving your changes?' })

/** Press Save, opening the editor's actions first if they're closed. */
async function pressSave(page: Page) {
	const actions = page.getByRole('button', { name: 'Editor actions' })
	if ((await actions.getAttribute('aria-expanded')) !== 'true') await actions.click()
	await page.getByRole('button', { name: 'Save' }).click()
}

/** Whether closing the tab asks first (the browser's own question, answered Stay). */
async function closingAsks(page: Page): Promise<boolean> {
	let asked = false
	page.once('dialog', (dialog) => {
		asked = dialog.type() === 'beforeunload'
		return dialog.dismiss()
	})
	await page.close({ runBeforeUnload: true })
	// Answered Stay, the tab stays; with no question, it's gone.
	await expect.poll(() => asked || page.isClosed()).toBe(true)
	return asked
}

// Leaving the editor dropped what wasn't saved, without a word: a link, Back, another page in the
// editor, closing the tab.
test('leaving a page with unsaved edits asks first, and Cancel keeps them', async ({
	page,
	themeClass,
}) => {
	await openStored(page, themeClass, oneParagraph)
	// A page of the app before it, for Back.
	await moveTo(page, '/contact')
	await moveTo(page, '/editor/stored')
	const text = page.locator('.tiptap p').first()
	await expect(text).toHaveText('A paragraph.')
	await typeAtEnd(page, ' Typed.')
	const question = leaveQuestion(page)
	const contact = page.getByRole('link', { name: 'Contact' }).first()
	const ways: [string, () => Promise<unknown>][] = [
		['a link', () => contact.click()],
		['Back', () => page.goBack()],
		[
			'another page in the editor',
			async () => {
				await page.getByRole('button', { name: 'Demo' }).click()
				await page.getByRole('link', { name: 'Editor' }).click()
			},
		],
	]
	for (const [way, leave] of ways) {
		await leave()
		await expect(question, way).toBeVisible()
		await question.getByRole('button', { name: 'Cancel' }).click()
		await expect(question, way).toBeHidden()
		await expect(page, way).toHaveURL(/\/editor\/stored$/)
		await expect(text, way).toHaveText('A paragraph. Typed.')
	}
	// A question straight after another stays: the dialog took the first one's late close (Chrome)
	// as Cancel for the second.
	await contact.click()
	await expect(question).toBeVisible()
	// Cancel, then Back in the same moment, faster than a person.
	await page.evaluate(() => {
		const buttons = document.querySelectorAll<HTMLButtonElement>('dialog[open] button')
		;[...buttons].find((button) => button.textContent?.trim() === 'Cancel')!.click()
		history.back()
	})
	await expect(question).toBeVisible()
	await settle(page)
	await settle(page)
	await expect(question, 'still asking').toBeVisible()
	await question.getByRole('button', { name: 'Cancel' }).click()
	await expect(page).toHaveURL(/\/editor\/stored$/)

	// Left for another page in the editor, the edits made there are asked about too.
	await page.getByRole('button', { name: 'Demo' }).click()
	await page.getByRole('link', { name: 'Editor' }).click()
	await question.getByRole('button', { name: 'Leave' }).click()
	await expect(page).toHaveURL(/\/editor\?seed=true$/)
	const demo = page.locator('.tiptap').first()
	await typeAtEnd(page, 'Typed in the demo.')
	await expect(demo).toContainText('Typed in the demo.')
	expect(await closingAsks(page), 'closing the tab').toBe(true)
	await expect(demo, 'kept on Stay').toContainText('Typed in the demo.')
})

// Code typed in the code view goes into the page only on leaving the code view or on Save.
test('leaving with code not yet put into the page asks first', async ({ page, themeClass }) => {
	await openStored(page, themeClass, oneParagraph)
	await expect(page.locator('.tiptap p').first()).toHaveText('A paragraph.')
	await page.getByRole('button', { name: 'Code view' }).click()
	await page.locator('.tiptap:visible').click()
	await page.keyboard.press('ControlOrMeta+a')
	await page.keyboard.type('<p>From the code.</p>')
	await page.getByRole('link', { name: 'Contact' }).first().click()
	await expect(leaveQuestion(page)).toBeVisible()
})

// Only edits Save would keep are asked about: none for a page as it opened, undone back to it, or
// saved (what's typed while it saves isn't), and none for a visitor, who can't save.
test('leaving asks only about edits Save would keep', async ({ page, themeClass }) => {
	const contact = page.getByRole('link', { name: 'Contact' }).first()
	const leavesFreely = async (why: string) => {
		await contact.click()
		await expect(page, why).toHaveURL(/\/contact$/)
		await expect(leaveQuestion(page), why).toHaveCount(0)
	}
	const text = page.locator('.tiptap p').first()
	await openStored(page, themeClass, oneParagraph)
	await expect(text).toHaveText('A paragraph.')
	await leavesFreely('as it opened')

	await moveTo(page, '/editor/stored')
	await expect(text).toHaveText('A paragraph.')
	await typeAtEnd(page, 'x')
	await expect(text).toHaveText('A paragraph.x')
	await page.keyboard.press('ControlOrMeta+z')
	await expect(text).toHaveText('A paragraph.')
	await leavesFreely('undone back')

	await moveTo(page, '/editor/stored')
	await expect(text).toHaveText('A paragraph.')
	await page.route(
		(url) => url.pathname.includes('adminPages.update'),
		(route) => route.fulfill({ json: [{ result: { data: { json: null } } }] }),
	)
	await typeAtEnd(page, ' Typed.')
	await expect(text).toHaveText('A paragraph. Typed.')
	await pressSave(page)
	await expect(page.getByText('Saved', { exact: true })).toBeVisible()
	await leavesFreely('saved')

	// A new page moves to its own address when it's first saved: that's not leaving it, even with
	// more typed while it saved, which stays unsaved.
	let finishSave!: () => void
	const saveHeld = new Promise<void>((resolve) => (finishSave = resolve))
	await page.route(
		(url) => url.pathname.includes('adminPages.create'),
		async (route) => {
			await saveHeld
			await route.fulfill({
				json: [{ result: { data: { json: { pageId: 2, slug: 'new-page' } } } }],
			})
		},
	)
	await moveTo(page, '/editor')
	await typeAtEnd(page, 'A new page.')
	await expect(text).toHaveText('A new page.')
	// Nor is a place on the same page.
	await moveTo(page, '/editor#further')
	await expect(leaveQuestion(page), 'a place on the page').toHaveCount(0)
	await expect(text).toHaveText('A new page.')
	await pressSave(page)
	await page.getByRole('textbox', { name: 'Page name' }).fill('New page')
	await page.getByRole('button', { name: 'Submit' }).click()
	await typeAtEnd(page, ' More.')
	finishSave()
	await expect(page).toHaveURL(/\/editor\/new-page$/)
	await expect(leaveQuestion(page), 'given its address').toHaveCount(0)
	await expect(text).toHaveText('A new page. More.')
	await contact.click()
	await expect(leaveQuestion(page), 'typed while it saved').toBeVisible()
	await leaveQuestion(page).getByRole('button', { name: 'Leave' }).click()
	await expect(page).toHaveURL(/\/contact$/)

	// A visitor, signed out, on the demo.
	await page.unrouteAll()
	await steadyRequests(page)
	const demo = page.locator('.tiptap').first()
	await page.goto('/editor?seed=true')
	await typeAtEnd(page, 'Typed by a visitor.')
	await expect(demo).toContainText('Typed by a visitor.')
	await leavesFreely('a visitor')
	await moveTo(page, '/editor?seed=true')
	await typeAtEnd(page, 'Typed by a visitor.')
	await expect(demo).toContainText('Typed by a visitor.')
	expect(await closingAsks(page), 'a visitor closing the tab').toBe(false)
})

// An admin whose sign-in has ended counts as signed out, as here once the server refuses a save
// for it, yet can sign in again and save.
test('an admin whose sign-in has ended is still asked before leaving', async ({
	page,
	themeClass,
}) => {
	await openStored(page, themeClass, oneParagraph)
	const text = page.locator('.tiptap p').first()
	await expect(text).toHaveText('A paragraph.')
	await page.route(
		(url) => url.pathname.includes('adminPages.update'),
		(route) =>
			route.fulfill({
				status: 401,
				json: [
					{
						error: {
							json: {
								message: 'Not signed in',
								code: -32001,
								data: { code: 'UNAUTHORIZED', httpStatus: 401 },
							},
						},
					},
				],
			}),
	)
	await typeAtEnd(page, ' Typed.')
	await expect(text).toHaveText('A paragraph. Typed.')
	await pressSave(page)
	await expect(page.getByText('Not signed in')).toBeVisible()
	const contact = page.getByRole('link', { name: 'Contact' }).first()
	const question = leaveQuestion(page)
	await contact.click()
	await question.getByRole('button', { name: 'Leave' }).click()
	await expect(page).toHaveURL(/\/contact$/)

	// And on a page opened after.
	await moveTo(page, '/editor')
	await typeAtEnd(page, 'A new page.')
	await expect(text).toHaveText('A new page.')
	await contact.click()
	await expect(question, 'a page opened after').toBeVisible()
	await question.getByRole('button', { name: 'Cancel' }).click()
	expect(await closingAsks(page), 'closing the tab').toBe(true)
})

// Back or Forward pressed again while leaving asks: the address bar ends on the page shown.
// vue-router gives up the older move, but its answer still moves the history.
test('Back and Forward while leaving asks keep the address on the page shown', async ({
	page,
	themeClass,
}) => {
	await openStored(page, themeClass, oneParagraph)
	await moveTo(page, '/contact')
	await moveTo(page, '/')
	await moveTo(page, '/editor/stored')
	const question = leaveQuestion(page)
	const text = page.locator('.tiptap p').first()
	await expect(text).toHaveText('A paragraph.')
	await typeAtEnd(page, ' Typed.')
	await expect(text).toHaveText('A paragraph. Typed.')
	const onThePage = async (why: string) => {
		await settle(page)
		await expect(page, why).toHaveURL(/\/editor\/stored$/)
		await expect(text, why).toHaveText('A paragraph. Typed.')
	}

	await page.goBack()
	await expect(question).toBeVisible()
	await page.goBack()
	await expect(question).toBeVisible()
	await question.getByRole('button', { name: 'Cancel' }).click()
	await onThePage('Back twice, then Cancel')

	await page.goBack()
	await expect(question).toBeVisible()
	await page.goForward()
	await expect(question, 'Forward to the page takes the question down').toHaveCount(0)
	await onThePage('Back, then Forward')

	await page.goBack()
	await expect(question).toBeVisible()
	await page.goBack()
	await expect(question).toBeVisible()
	await question.getByRole('button', { name: 'Leave' }).click()
	await expect(page.locator('main h1')).toHaveText('Contact')
	await settle(page)
	await expect(page, 'Back twice, then Leave').toHaveURL(/\/contact$/)
})

// Leaving while a save is under way, its name question included, waits for it, then asks only
// if something is still unsaved. Meanwhile a new page's save leaves the address alone: changing
// it cancelled the move, or took the place of the page Back went to.
test('leaving while a save is under way waits for it', async ({ page, themeClass }) => {
	const contact = page.getByRole('link', { name: 'Contact' }).first()
	const question = leaveQuestion(page)
	const text = page.locator('.tiptap p').first()
	const name = page.getByRole('textbox', { name: 'Page name' })
	/** Answer API calls to `call` with `data`, each once the function returned is called. */
	const hold = async (call: string, data: unknown) => {
		let finish!: () => void
		const held = new Promise<void>((resolve) => (finish = resolve))
		await page.route(
			(url) => url.pathname.includes(call),
			async (route) => {
				await held
				await route.fulfill({ json: [{ result: { data: { json: data } } }] })
			},
		)
		return finish
	}
	let creates = 0
	page.on('request', (request) => {
		if (request.url().includes('adminPages.create')) creates++
	})

	// A stored page. A move overtaken while it waits asks nothing (vue-router drops it): here by a
	// place on the page, with more typed while it saved.
	await openStored(page, themeClass, oneParagraph)
	await expect(text).toHaveText('A paragraph.')
	let finishSave = await hold('adminPages.update', null)
	await typeAtEnd(page, ' Typed.')
	await expect(text).toHaveText('A paragraph. Typed.')
	await pressSave(page)
	await typeAtEnd(page, ' More.')
	await expect(text).toHaveText('A paragraph. Typed. More.')
	await contact.click()
	await moveTo(page, '/editor/stored#further')
	finishSave()
	await expect(page.getByText('Saved', { exact: true })).toBeVisible()
	await settle(page)
	await expect(question, 'overtaken').toHaveCount(0)
	await expect(page).toHaveURL(/\/editor\/stored#further$/)

	// Nothing is asked while it saves, nor once it has.
	finishSave = await hold('adminPages.update', null)
	await pressSave(page)
	await contact.click()
	await settle(page)
	await expect(question, 'while it saves').toHaveCount(0)
	await expect(page).toHaveURL(/\/editor\/stored#further$/)
	finishSave()
	await expect(page).toHaveURL(/\/contact$/)
	await expect(question, 'once saved').toHaveCount(0)

	// A new page, Back while its name is asked for: that question stays, and once the page is
	// named and saved it leaves without another.
	finishSave = await hold('adminPages.create', { pageId: 2, slug: 'new-page' })
	await moveTo(page, '/editor')
	await typeAtEnd(page, 'A new page.')
	await expect(text).toHaveText('A new page.')
	await pressSave(page)
	await expect(name).toBeVisible()
	await page.goBack()
	await settle(page)
	await expect(name, 'still asked for').toBeVisible()
	await name.fill('New page')
	await page.getByRole('button', { name: 'Submit' }).click()
	await settle(page)
	await expect(question, 'while it saves').toHaveCount(0)
	finishSave()
	await expect(page).toHaveURL(/\/contact$/)
	await expect(question, 'once saved').toHaveCount(0)
	expect(creates, 'saved').toBe(1)

	// A new page, a link while its first save is under way, more typed meanwhile: asked once it
	// has saved. Staying, the page shows its address at the next save.
	finishSave = await hold('adminPages.create', { pageId: 3, slug: 'another-page' })
	await moveTo(page, '/editor')
	await typeAtEnd(page, 'Another page.')
	await expect(text).toHaveText('Another page.')
	await pressSave(page)
	await name.fill('Another page')
	await page.getByRole('button', { name: 'Submit' }).click()
	await typeAtEnd(page, ' More.')
	await expect(text).toHaveText('Another page. More.')
	await contact.click()
	await settle(page)
	await expect(question, 'while it saves').toHaveCount(0)
	finishSave()
	await expect(question, 'more typed meanwhile').toBeVisible()
	await question.getByRole('button', { name: 'Cancel' }).click()
	await expect(page, 'the address left alone').toHaveURL(/\/editor$/)
	await expect(text).toHaveText('Another page. More.')
	await pressSave(page)
	await expect(page, 'shown at the next save').toHaveURL(/\/editor\/another-page$/)
	await contact.click()
	await expect(page).toHaveURL(/\/contact$/)
	await expect(question).toHaveCount(0)
})

// A change the server refuses on the admin pages says why, in the words errors.ts gives each kind,
// and the list reloads to show what the server has (a row deleted elsewhere goes). With no answer
// it doesn't: a reload would get none either, and say so again.
test('a change the server refuses on the admin pages says why, and the list reloads', async ({
	page,
	themeClass,
}) => {
	await steadyRequests(page)
	await fakeReplies(page, {
		'session.get': { name: 'Admin', email: 'admin@example.test', roles: ['admin'] },
		'adminTags.list': [{ tagId: 1, name: 'News', slug: 'news', published: true, pageCount: 0 }],
	})
	// A refusal as the server sends it (api/src/config/trpc.ts).
	const refusal =
		(status: number, code: string, message: string, zodError: unknown = null) =>
		(route: Route) =>
			route.fulfill({
				status,
				json: [{ error: { json: { message, code: -32000, data: { code, zodError } } } }],
			})
	let answer = (_route: Route): Promise<void> => Promise.resolve()
	await page.route(
		(url) => url.pathname.includes('adminTags.update'),
		(route) => answer(route),
	)
	let reloads = 0
	page.on('request', (request) => {
		if (request.url().includes('adminTags.list')) reloads++
	})
	await page.goto('/admin/collections')
	await useTheme(page, themeClass)

	// Each: the action, what's typed, the answer, what the toast says, and whether the list reloads.
	const cases: [string, string, string, (route: Route) => Promise<void>, string, boolean][] = [
		[
			'a refusal, in its words',
			'Change slug',
			'events',
			refusal(409, 'CONFLICT', 'That slug is already in use'),
			'That slug is already in use',
			true,
		],
		[
			'a refused input, by field',
			'Rename',
			'   ',
			refusal(400, 'BAD_REQUEST', '[…]', {
				formErrors: [],
				fieldErrors: { name: ['Too small: expected string to have >=1 characters'] },
			}),
			// Named as the page labels it.
			'Name: Too small: expected string to have >=1 characters',
			true,
		],
		[
			'a failure on the server',
			'Rename',
			'Renamed',
			refusal(500, 'INTERNAL_SERVER_ERROR', 'Internal Server Error'),
			'Something went wrong on our side. Please try again.',
			true,
		],
		[
			'no answer',
			'Rename',
			'Renamed',
			(route) => route.abort(),
			"Couldn't get an answer from the server. Please try again.",
			false,
		],
	]
	for (const [name, action, typed, reply, said, reloadsAfter] of cases) {
		answer = reply
		const reloadsBefore = reloads
		await page.getByRole('button', { name: 'Actions' }).click()
		await page.getByRole('button', { name: action }).locator('visible=true').click()
		await page.locator('dialog[open] input').fill(typed)
		await page.keyboard.press('Enter')
		const toast = page.getByRole('alert').filter({ hasText: said })
		await expect(toast, name).toBeVisible()
		if (reloadsAfter) {
			await expect
				.poll(() => reloads, `${name}: the list reloads`)
				.toBeGreaterThan(reloadsBefore)
		} else {
			// Time for a reload to have been asked for, had there been one.
			await page.waitForTimeout(500)
			expect(reloads, `${name}: no reload`).toBe(reloadsBefore)
		}
		// Out of the way of the next case.
		await toast.getByRole('button', { name: 'Dismiss' }).click()
	}
})

// A new name shows in the editor at once; one the server refuses says why and goes back to the
// name the server has. It stayed; with a second rename sent before the first was refused, both
// refused, it went back to the first, which the server never had. The same refusal twice is one
// toast, counted.
test('a name the server refuses in the editor goes back to the one it has', async ({
	page,
	themeClass,
}) => {
	await openStored(page, themeClass, oneParagraph)
	// The first rename's answer waits until the second has been made. Made close together, the two
	// can go in one request, which gets an answer for each.
	let answer: (() => void) | undefined
	const answered = new Promise<void>((done) => (answer = done))
	await page.route(
		(url) => url.pathname.includes('adminPages.update'),
		async (route) => {
			await answered
			const calls = new URL(route.request().url()).pathname.split(',')
			await route.fulfill({
				status: 404,
				json: calls.map(() => ({
					error: {
						json: {
							message: 'Page not found',
							code: -32004,
							data: { code: 'NOT_FOUND' },
						},
					},
				})),
			})
		},
	)
	const name = page.locator('.editor-top-bar input')
	await expect(name).toHaveValue('Stored')
	await name.fill('First')
	await name.press('Enter')
	await expect(name).toHaveValue('First')
	await name.fill('Second')
	await name.press('Enter')
	await expect(name).toHaveValue('Second')
	answer?.()
	const toast = page.getByRole('alert').filter({ hasText: 'Page not found' })
	await expect(toast).toContainText('×2')
	await expect(toast).toHaveCount(1)
	await expect(name).toHaveValue('Stored')
})

// A page made from a collection goes into it as it's made, in one write. Made first, a page whose
// collection then failed was left out of it for good: Save only updated it after. A save that
// fails stores nothing, so the next sends it all again.
test('a new page made from a collection is saved into it in one write', async ({
	page,
	themeClass,
}) => {
	await steadyRequests(page)
	await fakeReplies(page, {
		'session.get': { name: 'Admin', email: 'admin@example.test', roles: ['admin'] },
	})
	const writes: [string, string, unknown][] = []
	let refuse = true
	await page.route(
		(url) => /adminPages\.(create|update)/.test(url.pathname),
		(route) => {
			const { json } = route.request().postDataJSON()[0]
			writes.push([
				new URL(route.request().url()).pathname.split('.').pop()!,
				json.name,
				json.tagIds,
			])
			if (!refuse)
				return route.fulfill({
					json: [{ result: { data: { json: { pageId: 2, slug: 'collected' } } } }],
				})
			return route.fulfill({
				status: 500,
				json: [
					{
						error: {
							json: {
								message: 'Internal Server Error',
								code: -32603,
								data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
							},
						},
					},
				],
			})
		},
	)
	await page.goto('/editor?autoTag=7')
	await useTheme(page, themeClass)
	const save = async () => {
		await pressSave(page)
		await page.getByRole('textbox', { name: 'Page name' }).fill('Collected')
		await page.getByRole('button', { name: 'Submit' }).click()
	}
	await typeAtEnd(page, 'A new page.')
	await save()
	await expect.poll(() => writes.length).toBe(1)
	refuse = false
	await save()
	await expect(page).toHaveURL(/\/editor\/collected$/)
	expect(writes).toEqual([
		['create', 'Collected', [7]],
		['create', 'Collected', [7]],
	])
})

// A tag box ticked for a save that fails is unticked again: the list reloads as it was, which
// doesn't change the box by itself. It stayed ticked.
test('a tag box whose save fails is unticked again', async ({ page, themeClass }) => {
	await steadyRequests(page)
	await fakeReplies(page, {
		'session.get': { name: 'Admin', email: 'admin@example.test', roles: ['admin'] },
		'adminPages.list': [
			{
				pageId: 1,
				slug: 'stored',
				name: 'Stored',
				imageUrl: null,
				published: true,
				createdAt: null,
				updatedAt: null,
			},
		],
		'adminTags.list': [{ tagId: 1, name: 'News', slug: 'news', published: true, pageCount: 0 }],
		'adminPages.listTagAssignments': [],
	})
	await page.route(
		(url) => url.pathname.includes('adminPages.update'),
		(route) => route.abort(),
	)
	await page.goto('/admin/pages')
	await useTheme(page, themeClass)
	await page.getByRole('button', { name: /^Tags for Stored/ }).click()
	const box = page.getByRole('checkbox', { name: 'News' })
	await box.click()
	await expect(
		page.getByRole('alert').filter({ hasText: "Couldn't get an answer from the server." }),
	).toBeVisible()
	await expect(box).not.toBeChecked()
})

// A promise of ours that fails with nothing waiting on it says so, as an error nothing caught
// does; one from another site's script (Google Maps', a browser extension's) is left to the
// browser.
test("a promise of ours that fails with nothing waiting says so, another site's doesn't", async ({
	page,
	themeClass,
}) => {
	await steadyRequests(page)
	const failing = (whose: string) => `Promise.reject(new Error('${whose} failed'))`
	// Served for other sites to use (CORS), as a map's script is. Chrome tells the page nothing of
	// another site's script's failures without it, which would leave this nothing to check.
	await page.route('https://elsewhere.test/widget.js', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: failing('Widget'),
		}),
	)
	await page.route('**/e2e-not-caught.js', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: failing('Ours') }),
	)
	await page.goto('/')
	await useTheme(page, themeClass)
	// The failures the page is told of.
	await page.evaluate(() => {
		// The check's own list on the page.
		const heard: string[] = ((window as Window & { heard?: string[] }).heard = [])
		addEventListener('unhandledrejection', (event) => heard.push(event.reason.message))
	})
	await page.evaluate(
		(src) =>
			new Promise((loaded) => {
				const script = document.createElement('script')
				script.crossOrigin = 'anonymous'
				script.src = src
				script.onload = loaded
				document.head.append(script)
			}),
		'https://elsewhere.test/widget.js',
	)
	await page.addScriptTag({ url: '/e2e-not-caught.js' })
	await expect
		.poll(() => page.evaluate(() => (window as Window & { heard?: string[] }).heard))
		.toEqual(['Widget failed', 'Ours failed'])
	const toast = page
		.getByRole('alert')
		.filter({ hasText: 'Something went wrong. Please try again.' })
	await expect(toast).toBeVisible()
	// Shown once: the other site's would have counted on it.
	await expect(toast).not.toContainText('×')
})
