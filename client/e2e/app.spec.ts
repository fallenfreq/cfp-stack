import { expect, test } from './fixtures'
import { box, breakpoints, settle, steadyRequests, useTheme } from './helpers'

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
