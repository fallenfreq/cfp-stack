import type { Browser, Page } from '@playwright/test'
import type { TiptapEditorHTMLElement } from '@tiptap/vue-3'
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
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
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
					const editor =
						document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
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

// On a screen too short for a panel above or below its button, it stays where it last fitted
// (else below), and scrolling the page brings it into view. Each case opens a panel, then scrolls
// the page to put its button at each place in turn: at the top of the screen, in the middle or at
// the bottom. At an edge it fits beside the button (it's never taller than the screen less the
// button); in the middle there's too little room above or below it, under either theme.
// `onScreen` says whether all of the panel shows at each.
type ButtonAt = 'top' | 'middle' | 'bottom'
const SHORT_SCREEN: {
	name: string
	viewport: { width: number; height: number }
	open: (page: Page) => Promise<void>
	steps: ButtonAt[]
	onScreen: boolean[]
}[] = [
	{
		// Off the bottom; scrolled into view; off it again; above once there's room above; then
		// it fits nowhere, so it stays above, stopped at the top of the screen.
		name: 'a panel on a short screen',
		viewport: { width: 1440, height: 330 },
		open: panelBeside(0.6, 'first'),
		steps: ['middle', 'top', 'middle', 'bottom', 'middle'],
		onScreen: [false, true, false, true, true],
	},
	{
		// Too wide for either edge of its button, and fits nowhere: below, slid onto the screen
		// at the side. At the top, it spreads across the screen below the button.
		name: 'a wide panel on a short narrow screen',
		viewport: { width: 400, height: 330 },
		open: panelBeside(0.6, 1),
		steps: ['middle', 'top'],
		onScreen: [false, true],
	},
]

/** Scroll the page to put the open box's button at the top of the screen, in the middle or at
 * the bottom. */
const moveButton = (page: Page, to: ButtonAt) =>
	page.locator(OPEN_BOX).evaluate((box, to) => {
		const button = document
			.querySelector(`[popovertarget="${CSS.escape(box.id)}"]`)!
			.getBoundingClientRect()
		const at = {
			top: 0,
			middle: (innerHeight - button.height) / 2,
			bottom: innerHeight - button.height,
		}[to]
		window.scrollBy(0, button.top - at)
	}, to)

/** Where a box lands at each step, with the CSS placing it or the script. */
async function placementsWhileScrolling(
	browser: Browser,
	c: (typeof SHORT_SCREEN)[number],
	themeClass: string | null,
	script: boolean,
): Promise<number[][]> {
	const page = await browser.newPage({ viewport: c.viewport })
	if (script) await page.addInitScript({ content: WITHOUT_ANCHOR_POSITIONING })
	await openSeeded(page, 'true', DEMO_END, themeClass)
	if (script) await page.addStyleTag({ content: NO_CSS_PLACEMENT })
	await c.open(page)
	const box = page.locator(OPEN_BOX)
	await expect(box, c.name).toBeVisible()
	const found: number[][] = []
	for (const to of c.steps) {
		await moveButton(page, to)
		await settle(page)
		const r = (await box.boundingBox())!
		found.push([r.x, r.y, r.width, r.height])
	}
	await page.close()
	return found
}

for (const c of SHORT_SCREEN)
	test(`${c.name}: scrolling the page brings it into view, without anchor positioning too`, async ({
		browser,
		browserName,
		themeClass,
	}) => {
		// Known not to work yet in Safari 26 (sf-system-todo.md, 19): where the panel fits nowhere,
		// it runs off the top of the screen, as WebKit doesn't slide it back. When fixed, Playwright
		// reports "expected to fail, but passed": remove test.fail().
		test.fail(browserName === 'webkit' && c.name === 'a panel on a short screen')
		const css = await placementsWhileScrolling(browser, c, themeClass, false)
		const script = await placementsWhileScrolling(browser, c, themeClass, true)
		css.forEach((want, step) => {
			const [x, y, width, height] = want as [number, number, number, number]
			const name = `step ${step + 1}, its button ${c.steps[step]}`
			expect
				.soft(
					x >= 0
						&& y >= 0
						&& x + width <= c.viewport.width + 1
						&& y + height <= c.viewport.height + 1,
					`${name}: all on screen`,
				)
				.toBe(c.onScreen[step])
			const got = script[step]!
			expect
				.soft(
					Math.max(...want.map((n, i) => Math.abs(n - got[i]!))),
					`${name}: CSS ${want.map(Math.round)}, script ${got.map(Math.round)}`,
				)
				.toBeLessThanOrEqual(1)
		})
	})

// Where a panel fits nowhere, it's slid up onto the screen only on a page that doesn't scroll. So
// when the page stops scrolling, and then starts again, with its button still, it's placed again:
// slid up, then off the bottom, the same with the CSS or the script.
test('a panel that fits nowhere is placed again when the page stops or starts scrolling', async ({
	browser,
	themeClass,
}) => {
	const steps = ['the page stops scrolling', 'the page scrolls again'] as const
	const measure = async (script: boolean) => {
		const page = await browser.newPage({ viewport: { width: 1440, height: 330 } })
		if (script) await page.addInitScript({ content: WITHOUT_ANCHOR_POSITIONING })
		await openSeeded(page, 'true', DEMO_END, themeClass)
		if (script) await page.addStyleTag({ content: NO_CSS_PLACEMENT })
		await panelBeside(0.6, 'first')(page)
		const box = page.locator(OPEN_BOX)
		await expect(box).toBeVisible()
		await moveButton(page, 'middle')
		await settle(page)
		const buttonTop = () =>
			box.evaluate(
				(el) =>
					document
						.querySelector(`[popovertarget="${CSS.escape(el.id)}"]`)!
						.getBoundingClientRect().top,
			)
		const before = await buttonTop()
		const found: number[][] = []
		for (const step of steps) {
			await page.evaluate((step) => {
				if (step === 'the page stops scrolling') {
					// The frame pinned to the screen, scrolled to where the page was.
					const y = scrollY
					const frame = document.querySelector<HTMLElement>('.app-frame')!
					Object.assign(frame.style, {
						position: 'fixed',
						inset: '0',
						overflow: 'hidden',
					})
					frame.scrollTop = y
				} else {
					const more = document.createElement('div')
					more.style.blockSize = '200vh'
					document.body.append(more)
				}
			}, step)
			await settle(page)
			expect(await buttonTop(), `${step}: the button still`).toBe(before)
			const r = (await box.boundingBox())!
			found.push([r.x, r.y, r.width, r.height])
		}
		await page.close()
		return found
	}
	const css = await measure(false)
	const script = await measure(true)
	css.forEach((want, step) => {
		const [, y, , height] = want as [number, number, number, number]
		expect.soft(y + height <= 330 + 1, `${steps[step]}: all on screen`).toBe(step === 0)
		const got = script[step]!
		expect
			.soft(
				Math.max(...want.map((n, i) => Math.abs(n - got[i]!))),
				`${steps[step]}: CSS ${want.map(Math.round)}, script ${got.map(Math.round)}`,
			)
			.toBeLessThanOrEqual(1)
	})
})

// A panel taller than the screen less its button stops at that height and scrolls, the same with
// the CSS or the script, and the script keeps its scroll position when it places it again.
test('a panel too tall for the screen stops at its height and scrolls', async ({
	browser,
	themeClass,
}) => {
	const measure = async (script: boolean) => {
		const page = await browser.newPage({ viewport: { width: 1440, height: 200 } })
		if (script) await page.addInitScript({ content: WITHOUT_ANCHOR_POSITIONING })
		await openSeeded(page, 'true', DEMO_END, themeClass)
		if (script) await page.addStyleTag({ content: NO_CSS_PLACEMENT })
		await panelBeside(0.6, 'first')(page)
		const box = page.locator(OPEN_BOX)
		await expect(box).toBeVisible()
		await settle(page)
		const panel = () =>
			box.evaluate((el) => {
				const button = document.querySelector(`[popovertarget="${CSS.escape(el.id)}"]`)!
				return {
					room: innerHeight - button.getBoundingClientRect().height,
					height: el.getBoundingClientRect().height,
					scrolls: el.scrollHeight > el.clientHeight,
					scrollTop: el.scrollTop,
				}
			})
		const first = await panel()
		expect(first.scrolls, 'it scrolls').toBe(true)
		expect(first.height, 'no taller than the screen less its button').toBeLessThanOrEqual(
			first.room,
		)
		if (script) {
			const halfway = await box.evaluate(
				(el) => (el.scrollTop = Math.round((el.scrollHeight - el.clientHeight) / 2)),
			)
			await page.evaluate(() => window.scrollBy(0, 1))
			await settle(page)
			expect((await panel()).scrollTop, 'placed again, it keeps its scroll position').toBe(
				halfway,
			)
		}
		await page.close()
		return first.height
	}
	expect(
		Math.abs((await measure(false)) - (await measure(true))),
		'the same height',
	).toBeLessThanOrEqual(1)
})

// In the browser as it is. Safari 26 places a box anchored to an unpositioned element in a fixed bar
// as though the bar scrolled with the page; the floating toolbar is one, so on a scrolled page its
// panels and tooltips opened off the screen until their triggers were positioned.
test('on a scrolled page, a toolbar panel opens under its button and a tooltip over it', async ({
	page,
	themeClass,
}) => {
	await openSeeded(page, 'true', DEMO_END, themeClass)
	await panelBeside(0.4, 'first')(page)
	await expect(page.locator(OPEN_BOX)).toBeVisible()
	// Its own tooltip waits on the pointer resting there.
	await page.mouse.move(0, 0)
	for (const step of ['a panel', 'a panel, the page scrolled on', 'a tooltip'] as const) {
		if (step === 'a panel, the page scrolled on')
			await page.evaluate(() => window.scrollBy(0, 80))
		if (step === 'a tooltip') {
			await page.evaluate((open) => {
				for (const b of document.querySelectorAll<HTMLElement>(open)) b.hidePopover()
			}, OPEN_BOX)
			await page.locator('.floating-toolbar .tooltip-root:visible').first().hover()
			await expect(page.locator(OPEN_BOX)).toBeVisible()
		}
		await settle(page)
		// How far it is from its trigger: below it for a panel, above it for a tooltip.
		const { scrolled, gap } = await page.locator(OPEN_BOX).evaluate((el) => {
			const tooltip = el.matches('.tooltip-popup')
			const trigger = tooltip
				? el.parentElement!
				: document.querySelector(`[popovertarget="${CSS.escape(el.id)}"]`)!
			const [t, box] = [trigger.getBoundingClientRect(), el.getBoundingClientRect()]
			return { scrolled: scrollY, gap: tooltip ? t.top - box.bottom : box.top - t.bottom }
		})
		expect(scrolled, `${step}: the page is scrolled`).toBeGreaterThan(0)
		expect(gap, `${step}: beside its trigger`).toBeGreaterThanOrEqual(0)
		expect(gap, `${step}: beside its trigger`).toBeLessThan(40)
	}
})
