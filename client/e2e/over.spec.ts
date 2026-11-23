import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
	box,
	columnCount,
	css,
	dividerLooks,
	expectOnCorner,
	measuredBox,
	near,
	openTests,
	settle,
} from './helpers'

// A placed box (sl-over) sits over the box it's in, where its align words say; a side with no
// word is filled (sf-system.md, "Placing a box over another"). A floating mark pokes out past
// its corner by its own margin, the theme's, so each is measured against that margin.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

async function expectCorners(page: Page, rtl: boolean) {
	const corners = await box(page.locator('#over-corners'))
	const [start, end] = rtl ? (['right', 'left'] as const) : (['left', 'right'] as const)
	await expectOnCorner(
		page.locator('#over-top-start'),
		corners,
		{ x: start, y: 'top' },
		'top start',
	)
	await expectOnCorner(page.locator('#over-top-end'), corners, { x: end, y: 'top' }, 'top end')
	await expectOnCorner(
		page.locator('#over-bottom-start'),
		corners,
		{ x: start, y: 'bottom' },
		'bottom start',
	)
	await expectOnCorner(
		page.locator('#over-bottom-end'),
		corners,
		{ x: end, y: 'bottom' },
		'bottom end',
	)
	// Centred, a mark keeps the theme's size, as on a corner, and its middle is the edge's.
	const corner = await box(page.locator('#over-top-start'))
	const middle = (b: typeof corner) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 })
	for (const [id, edge] of [
		['#over-top-center', 'top'],
		['#over-end-center', 'end'],
	] as const) {
		const centred = await box(page.locator(id))
		near(centred.width, corner.width, `${edge} centre, width`)
		near(centred.height, corner.height, `${edge} centre, height`)
		if (edge === 'top') {
			near(middle(centred).x, middle(corners).x, 'top centre, across')
			near(centred.top, corner.top, 'top centre, as high as a top corner')
		} else {
			near(middle(centred).y, middle(corners).y, 'end centre, down')
			const endCorner = await box(page.locator('#over-top-end'))
			near(centred[end], endCorner[end], 'end centre, as far out as an end corner')
		}
	}
}

test('a mark sits on the corner its align words say, or the middle of an edge', async ({
	page,
}) => {
	await expectCorners(page, false)
})

test('right to left, a mark on the end corner is on the left', async ({ page }) => {
	await page.evaluate(() => {
		document.querySelector('.tiptap.ProseMirror')!.closest<HTMLElement>('.page-shell')!.dir =
			'rtl'
	})
	await settle(page)
	await expectCorners(page, true)
})

test('with no word for a side it fills that side: a bar along the foot, a layer over the box', async ({
	page,
}) => {
	const barBox = await box(page.locator('#over-bar-box'))
	const bar = await box(page.locator('#over-bar'))
	near(bar.left, barBox.left, 'bar, left')
	near(bar.right, barBox.right, 'bar, right')
	near(bar.bottom, barBox.bottom, 'bar, foot')
	expect(bar.height, 'the bar is as tall as its caption').toBeLessThan(barBox.height / 2)

	const layerBox = await box(page.locator('#over-layer-box'))
	const layer = await box(page.locator('#over-layer'))
	for (const side of ['left', 'right', 'top', 'bottom'] as const)
		near(layer[side], layerBox[side], `layer, ${side}`)
})

test('centred, a caption is as big as its words, not the edge', async ({ page }) => {
	const on = await box(page.locator('#over-centred-box'))
	const across = await box(page.locator('#over-centred-x'))
	expect(across.width, 'centred across: as wide as its word').toBeLessThan(on.width / 2)
	near(across.left + across.width / 2, on.left + on.width / 2, 'centred across, middle')
	near(across.bottom, on.bottom, 'centred across, foot')

	const down = await box(page.locator('#over-centred-y'))
	expect(down.height, 'centred down: as tall as its word').toBeLessThan(on.height / 2)
	near(down.top + down.height / 2, on.top + on.height / 2, 'centred down, middle')
	near(down.right, on.right, 'centred down, end')
})

test("a mark not placed sits where it's written, filled as a floating one is", async ({ page }) => {
	const mark = page.locator('#over-unplaced')
	const at = await box(mark)
	expect(at.width, 'the theme draws the mark').toBeGreaterThan(0)
	expect(at.top, 'below the text before').toBeGreaterThanOrEqual(
		(await box(page.locator('#over-unplaced-before'))).bottom - 1,
	)
	expect(at.bottom, 'above the text after').toBeLessThanOrEqual(
		(await box(page.locator('#over-unplaced-after'))).top + 1,
	)
	expect(
		await css(page.locator('#over-top-start'), 'background-color'),
		'a floating mark, against one not placed',
	).toBe(await css(mark, 'background-color'))
})

test("a mark first in a box of text doesn't push the text down", async ({ page }) => {
	const after = async (boxId: string, textId: string) =>
		(await box(page.locator(`#${textId}`))).top - (await box(page.locator(`#${boxId}`))).top
	near(
		await after('over-first', 'over-first-text'),
		await after('over-first-twin', 'over-first-twin-text'),
		'text below a mark, against text alone',
	)
})

test("a mark beside a Card in a plain box sits on the Card's corner", async ({ page }) => {
	await expectOnCorner(
		page.locator('#over-card-mark'),
		await box(page.locator('#over-card')),
		{ x: 'right', y: 'top' },
		"the Card's top end",
	)
})

test("a mark in an inset sits on the inset's edge, not its column's", async ({ page }) => {
	const inset = await box(page.locator('#over-inset'))
	const line = await box(page.locator('#over-inset-line'))
	expect(line.right, 'the theme gives the inset a margin').toBeLessThan(inset.right - 1)
	await expectOnCorner(
		page.locator('#over-inset-mark'),
		inset,
		{ x: 'right', y: 'top' },
		'the inset',
	)
})

test('a mark on a pinned Card stays on it and is drawn on top as the area scrolls', async ({
	page,
}) => {
	const area = page.locator('#over-pin-area')
	// In the window's middle, clear of the editor's bars: a point outside the window finds nothing.
	await area.evaluate((el) => {
		el.scrollIntoView({ block: 'center' })
		el.scrollTop = 120
	})
	await settle(page)
	expect(await area.evaluate((el) => el.scrollTop), 'the area scrolled').toBe(120)
	const pinned = await box(page.locator('#over-pin'))
	near(pinned.top, (await box(area)).top, 'the pinned box at the top')
	// On the start corner: WebKit's scrollbar takes points along the end edge.
	const mark = page.locator('#over-pin-mark')
	await expectOnCorner(mark, pinned, { x: 'left', y: 'top' }, 'the pinned box')
	// What's drawn at a point is what a click there finds, and a floating mark lets clicks
	// through, so for this one look it takes them; a stylesheet, so the page isn't changed.
	await page.addStyleTag({ content: '#over-pin-mark { pointer-events: auto !important; }' })
	const drawnOnTop = await mark.evaluate((el) => {
		const { left, top, width, height } = el.getBoundingClientRect()
		return document.elementFromPoint(left + width / 2, top + height - 1) === el
	})
	expect(drawnOnTop, 'the mark is drawn over what scrolls under').toBe(true)
})

/** The id of what's drawn on top at a point, or of the box it's in. A floating mark lets clicks
 * through, so the marks there take them for this look; a stylesheet, so the page isn't changed. */
async function drawnAt(page: Page, x: number, y: number): Promise<string> {
	await page.addStyleTag({ content: '.sl-over { pointer-events: auto !important; }' })
	return page.evaluate(
		([x, y]) => document.elementFromPoint(x!, y!)?.closest('[id]')?.id ?? '',
		[
			x,
			y,
		],
	)
}

test('in a list with no gap, a mark is drawn whole over the next item', async ({ page }) => {
	const mark = page.locator('#over-tight-mark')
	await mark.scrollIntoViewIfNeeded()
	const at = await box(mark)
	const next = await box(page.locator('#over-tight-next'))
	const y = at.bottom - 1
	expect(y, 'the mark pokes out over the next item').toBeGreaterThan(next.top)
	expect(await drawnAt(page, at.left + at.width / 2, y), 'on top').toBe('over-tight-mark')
})

test('a mark on a Card scrolled under a pinned Card is drawn under it', async ({ page }) => {
	const area = page.locator('#over-pin-area')
	await area.evaluate((el) => el.scrollIntoView({ block: 'center' }))
	// The marked Card's top corner under the middle of the pinned one.
	await area.evaluate((el) => {
		const pinned = el.querySelector('#over-pin')!.getBoundingClientRect()
		const under = el.querySelector('#over-under')!.getBoundingClientRect()
		el.scrollTop += under.top - (pinned.top + pinned.height / 2)
	})
	await settle(page)
	const pinned = await box(page.locator('#over-pin'))
	const at = await box(page.locator('#over-under-mark'))
	const [x, y] = [at.left + at.width / 2, at.top + at.height / 2]
	expect(y > pinned.top && y < pinned.bottom, 'the mark is under the pinned Card').toBe(true)
	expect(await drawnAt(page, x, y), 'on top').toBe('over-pin')
})

test('Columns in a placed Stack aligned sideways measure the page, and a bar measures itself', async ({
	page,
}) => {
	const sideways = page.locator('#over-sideways-columns')
	expect((await box(sideways)).width, 'aligned sideways: not 0 wide').toBeGreaterThan(0)
	expect((await measuredBox(sideways)).name, 'aligned sideways: what it measures').toBe('page')

	const inBar = page.locator('#over-bar-columns')
	expect(await measuredBox(inBar), 'along the foot: what it measures').toMatchObject({
		name: '#over-bar-stack',
	})
	expect(await columnCount(inBar), 'stacked by the bar, the page being wide').toBe(1)
})

// The browser places a popover and a dialog itself: one holding a mark keeps that placing. No app
// screen holds one today, so the check adds them outside the page.
test('a popover or dialog holding a mark stays where the browser puts it', async ({ page }) => {
	await page.evaluate(() => {
		const mark =
			'<div class="sf-badge sl-over sl-align-x-end sl-align-y-start sf-is-overlay"></div>'
		const html = `<p>Holds a mark</p>${mark}`
		document.body.insertAdjacentHTML(
			'beforeend',
			`<div id="over-popover" popover>${html}</div>
			<dialog id="over-modal">${html}</dialog>
			<dialog id="over-dialog">${html}</dialog>
			<p id="over-after-dialog">After the dialog</p>`,
		)
		window.scrollTo(0, document.documentElement.scrollHeight / 2)
	})
	await settle(page)
	const scrolled = await page.evaluate(() => window.scrollY)
	// In the window where it opened: a modal takes the focus, and the page would scroll to it.
	const inWindow = async (id: string) => {
		near(await page.evaluate(() => window.scrollY), scrolled, `${id}: the page didn't scroll`)
		const at = await box(page.locator(id))
		const height = await page.evaluate(() => window.innerHeight)
		expect(at.top >= 0 && at.bottom <= height, `${id}: in the window, scrolled`).toBe(true)
		await expectOnCorner(
			page.locator(`${id} > .sf-badge`),
			at,
			{ x: 'right', y: 'top' },
			`${id}'s top end corner`,
		)
	}
	await page.locator('#over-popover').evaluate((el: HTMLElement) => el.showPopover())
	await inWindow('#over-popover')
	await page.locator('#over-popover').evaluate((el: HTMLElement) => el.hidePopover())
	await page.locator('#over-modal').evaluate((el: HTMLDialogElement) => el.showModal())
	await inWindow('#over-modal')
	await page.locator('#over-modal').evaluate((el: HTMLDialogElement) => el.close())

	// Not modal, a dialog sits over what follows it, taking no room. On the page, not the window:
	// opening it moves the focus into it, which scrolls.
	const after = page.locator('#over-after-dialog')
	const onPage = () => after.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
	const before = await onPage()
	await page.locator('#over-dialog').evaluate((el: HTMLDialogElement) => el.show())
	near(await onPage(), before, "what follows an open dialog doesn't move")
})

test('a mark in a divided stack has no divide line', async ({ page }) => {
	const divided = await dividerLooks(page, 'over-divide')
	const twin = await dividerLooks(page, 'over-divide-twin')
	expect(divided.items[1], 'the theme draws a divide line').not.toBe(divided.items[0])
	expect(divided.items[2], 'the mark, against one in an undivided stack').toBe(twin.items[2])
})
