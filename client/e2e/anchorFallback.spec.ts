import type { Browser, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { openSeeded, settle } from './helpers'

// Safari before 26 has no anchor positioning, and Chrome can't switch it off, so these checks fake
// such a browser: the page is told the feature is missing and the CSS placement is turned off.
// There useAnchorFallback places popovers and tooltips from script, and each has to land exactly
// where Chrome's CSS puts it. Every case opens on one page, in turn, to keep page loads down.

const DEMO_END = '.tiptap.ProseMirror li:has-text("HTML source (code view) toggle")'
const OPEN_BOX = ':is(.popover-box, .tooltip-popup):popover-open'

// As text: a function would be passed through the test's own compiler first.
const WITHOUT_ANCHOR_POSITIONING = `{
	const supports = CSS.supports.bind(CSS)
	CSS.supports = (...args) => (/position-area|anchor/.test(args.join(' ')) ? false : supports(...args))
}`
const NO_CSS_PLACEMENT =
	'.popover-box, .tooltip-popup { position-area: none !important; position-try-fallbacks: none !important; }'

/** Select the paragraph, aim the toolbar at it, put its top at this share of the screen height,
 * and open a toolbar panel. In that order: focusing the editor scrolls the cursor into view. */
const panelBeside = (share: number, button: 'first' | 'last' | number) => async (page: Page) => {
	const paragraph = page.locator('.tiptap p').nth(12)
	await paragraph.evaluate((el) => {
		const editor = (document.querySelector('.tiptap') as any).editor
		editor
			.chain()
			.focus()
			.setTextSelection(editor.view.posAtDOM(el, 0) + 1)
			.run()
	})
	await settle(page)
	await page.locator('.editor-top-bar').getByText('paragraph', { exact: true }).click()
	await paragraph.evaluate((el, share) => {
		window.scrollBy(0, el.getBoundingClientRect().top - innerHeight * share)
	}, share)
	await settle(page)
	const buttons = page.locator('.floating-toolbar [popovertarget]:visible')
	await (
		typeof button === 'number'
			? buttons.nth(button)
			: button === 'first'
				? buttons.first()
				: buttons.last()
	).click()
}

const CASES: { name: string; open: (page: Page) => Promise<void> }[] = [
	{
		// An edit just above moves the toolbar down, with no scroll or resize.
		name: 'a toolbar panel after an edit above it',
		open: async (page) => {
			await panelBeside(0.4, 'first')(page)
			await expect(page.locator(OPEN_BOX)).toBeVisible()
			await page
				.locator('.tiptap p')
				.nth(12)
				.evaluate((el) => {
					const editor = (document.querySelector('.tiptap') as any).editor
					const before = editor.view.posAtDOM(el, 0) - 1
					editor.commands.insertContentAt(
						before,
						'<p>A new line above</p><p>And another</p>',
						{
							updateSelection: false,
						},
					)
				})
			await settle(page)
		},
	},
	{
		name: 'the nav menu',
		open: (page) => page.locator('.site-nav [popovertarget]:visible').first().click(),
	},
	{
		name: 'a tooltip at the screen edge',
		open: (page) => page.locator('.editor-top-bar .tooltip-root').last().hover(),
	},
	{
		name: 'a tooltip',
		open: async (page) => {
			await page.locator('.tiptap p').first().click()
			await settle(page)
			await page.locator('.floating-toolbar').getByRole('button', { name: 'Bold' }).hover()
		},
	},
	{ name: 'a toolbar panel', open: panelBeside(0.4, 'first') },
	{ name: 'a toolbar panel from its last button', open: panelBeside(0.4, 'last') },
	{ name: 'a toolbar panel with no room below', open: panelBeside(0.9, 'first') },
	// At 400px its panel is too wide for either edge of its button, so it spreads across.
	{ name: 'a toolbar panel from its second button', open: panelBeside(0.4, 1) },
	{
		name: 'a toolbar panel after the page scrolls',
		open: async (page) => {
			await panelBeside(0.4, 'first')(page)
			await expect(page.locator(OPEN_BOX)).toBeVisible()
			await page.evaluate(() => window.scrollBy(0, 80))
			await settle(page)
		},
	},
]

/** Where each case's box lands, with the CSS placing it or the script. */
async function placements(
	browser: Browser,
	width: number,
	themeClass: string | null,
	script: boolean,
): Promise<number[][]> {
	const page = await browser.newPage({ viewport: { width, height: 800 } })
	if (script) await page.addInitScript({ content: WITHOUT_ANCHOR_POSITIONING })
	await openSeeded(page, 'true', DEMO_END, themeClass)
	if (script) await page.addStyleTag({ content: NO_CSS_PLACEMENT })
	const found: number[][] = []
	for (const c of CASES) {
		await page.evaluate(() => window.scrollTo(0, 0))
		await c.open(page)
		const box = page.locator(OPEN_BOX)
		await expect(box, c.name).toBeVisible()
		// The script places the box before it first shows, at the next frame.
		await settle(page)
		const r = (await box.boundingBox())!
		found.push([r.x, r.y, r.width, r.height])
		await page.mouse.move(0, 0)
		await page.evaluate((open) => {
			for (const b of document.querySelectorAll<HTMLElement>(open)) b.hidePopover()
		}, OPEN_BOX)
	}
	await page.close()
	return found
}

for (const width of [1440, 400])
	test(`without anchor positioning, popovers and tooltips sit where the CSS puts them, ${width}px`, async ({
		browser,
		themeClass,
	}) => {
		const css = await placements(browser, width, themeClass, false)
		const script = await placements(browser, width, themeClass, true)
		CASES.forEach((c, at) => {
			const [want, got] = [css[at]!, script[at]!]
			expect
				.soft(
					Math.max(...want.map((n, i) => Math.abs(n - got[i]!))),
					`${c.name}: CSS ${want.map(Math.round)}, script ${got.map(Math.round)}`,
				)
				.toBeLessThanOrEqual(1)
		})
	})

// Only the script reaches the last place, so it's checked on its own: a panel too tall for the
// room above and below its button stays on screen and scrolls, and keeps its scroll position
// when it's placed again.
test('without anchor positioning, a panel too tall for the screen scrolls, and stays scrolled', async ({
	browser,
	themeClass,
}) => {
	const page = await browser.newPage({ viewport: { width: 1440, height: 330 } })
	await page.addInitScript({ content: WITHOUT_ANCHOR_POSITIONING })
	await openSeeded(page, 'true', DEMO_END, themeClass)
	await page.addStyleTag({ content: NO_CSS_PLACEMENT })
	await panelBeside(0.6, 'first')(page)
	const box = page.locator(OPEN_BOX)
	await expect(box).toBeVisible()
	await settle(page)
	const panel = () =>
		box.evaluate((el) => ({
			bottom: el.getBoundingClientRect().bottom,
			scrolls: el.scrollHeight > el.clientHeight,
			scrollTop: el.scrollTop,
		}))
	const before = await panel()
	expect(before.scrolls, 'it scrolls').toBe(true)
	expect(before.bottom, 'it ends on screen').toBeLessThanOrEqual(330 + 1)

	await box.evaluate((el) => (el.scrollTop = 30))
	await page.evaluate(() => window.scrollBy(0, 1))
	await settle(page)
	expect((await panel()).scrollTop, 'placed again, it keeps its scroll position').toBe(30)
	await page.close()
})
