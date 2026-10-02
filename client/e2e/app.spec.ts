import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { box, breakpoints, openTests, settle, steadyRequests, useTheme } from './helpers'

// App screens: outside documents, a layout measures the layout around it, as before.

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

/**
 * Answer these API calls (by the end of their name) with the data given, whatever the database
 * holds; other calls go through.
 */
async function fakeReplies(page: Page, replies: Record<string, unknown>): Promise<void> {
	await page.route('**/trpc/**', async (route) => {
		const calls = new URL(route.request().url()).pathname.replace('/trpc/', '').split(',')
		const faked = calls.map((call) => Object.keys(replies).find((name) => call.endsWith(name)))
		if (!faked.some(Boolean)) return route.fallback()
		const response = await route.fetch()
		const answers = await response.json()
		faked.forEach((name, at) => {
			if (name) answers[at] = { result: { data: { json: replies[name] } } }
		})
		return route.fulfill({ response, json: answers })
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
