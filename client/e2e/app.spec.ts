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

test("a stored page sits on the page's line, as an app screen does", async ({
	page,
	themeClass,
}) => {
	// The home page, whatever the database holds: a plain heading and paragraph, with no
	// spacing of their own.
	const content = {
		type: 'doc',
		content: [
			{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Home' }] },
			{ type: 'paragraph', content: [{ type: 'text', text: 'A paragraph.' }] },
		],
	}
	await steadyRequests(page)
	await page.route('**/trpc/**', async (route) => {
		const calls = new URL(route.request().url()).pathname.replace('/trpc/', '').split(',')
		const at = calls.findIndex((call) => call.endsWith('Pages.getBySlug'))
		if (at < 0) return route.fallback()
		const response = await route.fetch()
		const replies = await response.json()
		replies[at] = {
			result: {
				data: {
					json: {
						slug: 'home',
						name: 'Home',
						published: true,
						contentJson: JSON.stringify(content),
					},
				},
			},
		}
		return route.fulfill({ response, json: replies })
	})
	await page.goto('/')
	await useTheme(page, themeClass)
	const title = page.locator('main h1')
	await expect(title).toHaveText('Home')
	const nav = await box(page.locator('.site-nav'))
	expect((await box(title)).left, 'off the screen edge').toBeGreaterThan(0)
	expect(Math.abs((await box(title)).left - nav.left)).toBeLessThanOrEqual(1)
})
