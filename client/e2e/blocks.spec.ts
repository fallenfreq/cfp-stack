import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
	box,
	breakpoints,
	css,
	openTests,
	placed,
	setShellWidth,
	settle,
	taskItemLayout,
} from './helpers'

// A block rendered by a component is three boxes: the outer box its parent places, the component's
// root (wearing the block's classes) and a content box holding its blocks. These check that layout
// rules reach through them as they do for plain blocks (sf-system.md, "Component blocks"). Looks
// are the theme's, so a block is compared with a plain twin rather than with a particular look.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

/**
 * What a divide line could look like, for each block inside a block: on the element wearing the
 * block's classes, and on a component block's outer box; and for a component's own parts.
 */
const dividerLooks = (page: Page, id: string) =>
	page.locator(`#${id}`).evaluate((root) => {
		const look = (el: Element) => {
			const s = getComputedStyle(el)
			const before = getComputedStyle(el, '::before').content
			const after = getComputedStyle(el, '::after').content
			return [
				s.borderTopStyle,
				s.borderTopWidth,
				s.borderTopColor,
				s.boxShadow,
				s.outlineStyle,
				before,
				after,
			].join(' | ')
		}
		const content = root.querySelector(':scope > [data-node-view-content]')
		const blocks = [...(content ?? root).children]
		const outer = (block: Element) => block.matches('[data-node-view-wrapper]')
		return {
			items: blocks.map((block) => look(outer(block) ? block.firstElementChild! : block)),
			outerBoxes: blocks.filter(outer).map(look),
			ownParts: content ? [...root.children].filter((el) => el !== content).map(look) : [],
		}
	})

/** An outer box draws nothing of its own (the reset leaves every border solid but 0 wide). */
const drawsNothing = (look: string) => {
	const [style, width, , shadow, , before, after] = look.split(' | ')
	return (
		(style === 'none' || width === '0px')
		&& shadow === 'none'
		&& before === 'none'
		&& after === 'none'
	)
}

test('divide lines in a Stack look like those in a plain stack, on the card itself', async ({
	page,
}) => {
	const block = await dividerLooks(page, 'divide-stack')
	const twin = await dividerLooks(page, 'divide-stack-twin')
	expect(twin.items[1], 'the theme draws a divide line').not.toBe(twin.items[0])
	expect(block.items).toEqual(twin.items)
	expect(block.outerBoxes.every(drawsNothing), "the card's outer box draws no line").toBe(true)
})

test('a Stack given padding is padded as a plain stack is, and a Centre only at its sides', async ({
	page,
}) => {
	const padding = (id: string) =>
		page.locator(`#${id}`).evaluate((el) => {
			const s = getComputedStyle(el)
			return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]
		})
	for (const id of ['padded-stack', 'padded-card-stack']) {
		const twin = await padding(`${id}-twin`)
		expect(parseFloat(twin[0]!), `${id}: the plain stack is padded`).toBeGreaterThan(0)
		expect(await padding(id), id).toEqual(twin)
	}
	const [top, right, bottom, left] = (await padding('padded-center-twin')).map(parseFloat)
	expect([top, bottom], 'a plain centred stack: no padding above or below').toEqual([0, 0])
	expect(Math.min(right!, left!), 'a plain centred stack: padded at the sides').toBeGreaterThan(0)
	expect(await padding('padded-center'), 'the Centre').toEqual(
		await padding('padded-center-twin'),
	)
})

test('divide lines in a Card look like those in a plain card', async ({ page }) => {
	const block = await dividerLooks(page, 'divide-card')
	const twin = await dividerLooks(page, 'divide-card-twin')
	expect(twin.items[1], 'the theme draws a divide line').not.toBe(twin.items[0])
	expect(block.items).toEqual(twin.items)
})

test("a component's own parts and the blocks in its slot are one list of items", async ({
	page,
}) => {
	const { ownParts, items } = await dividerLooks(page, 'divide-slot')
	const undivided = (await dividerLooks(page, 'divide-stack-twin')).items[0]
	// Its own parts are a heading, a paragraph, a row and a paragraph; the slot holds paragraphs.
	expect(ownParts[1], "the paragraph after the component's heading has a line").not.toBe(
		undivided,
	)
	expect(items, 'each block in the slot has the same line').toEqual([ownParts[1], ownParts[1]])
})

test('a scroll frame works around a block that scrolls, as around a plain box', async ({
	page,
}) => {
	const block = page.locator('#frame-block')
	const plain = page.locator('#frame-plain')
	expect(
		await css(plain, 'content', '::after'),
		'the theme draws on a framed scroll area',
	).not.toBe('none')
	for (const pseudo of ['::before', '::after'])
		for (const property of ['content', 'position', 'top', 'left', 'right'])
			expect(await css(block, property, pseudo), `${pseudo} ${property}`).toBe(
				await css(plain, property, pseudo),
			)
})

test('a Card that scrolls sideways keeps each item on one line', async ({ page }) => {
	await setShellWidth(page, breakpoints().sm! - 40)
	const card = page.locator('#scroll-card')
	const items = card.locator(':scope > [data-node-view-content] > p')
	await expect(items).toHaveCount(3)
	expect(
		await card.evaluate((el) => el.scrollWidth > el.clientWidth),
		'the items overflow the card',
	).toBe(true)
	for (const item of await items.all()) {
		const lineHeight = parseFloat(await css(item, 'line-height'))
		expect((await box(item)).height).toBeLessThan(lineHeight * 1.5)
	}
})

test('an image set to cover fills its Card', async ({ page }) => {
	const card = await box(page.locator('#cover-card'))
	const image = page.locator('#cover-card img')
	expect(await css(image, 'object-fit')).toBe('cover')
	const fit = await box(image)
	expect(fit.height).toBeLessThanOrEqual(card.height + 1)
	expect(fit.width).toBeLessThanOrEqual(card.width + 1)
	expect(fit.height).toBeGreaterThan(card.height * 0.8)
})

test('a Card set to bleed reaches the edges of the inset around it', async ({ page }) => {
	const inset = await box(page.locator('#inset'))
	const bleed = await box(placed(page, 'inset-bleed'))
	const onTheLine = await box(page.locator('#inset-first'))
	expect(onTheLine.left, 'the theme gives the inset a margin').toBeGreaterThan(inset.left + 1)
	expect(Math.abs(bleed.left - inset.left)).toBeLessThanOrEqual(1)
	expect(Math.abs(bleed.right - inset.right)).toBeLessThanOrEqual(1)
})

test("in a Card used as an inset, a block set to bleed reaches the card's edges", async ({
	page,
}) => {
	const card = page.locator('#card-inset')
	const edges = await box(card)
	const bleed = await box(page.locator('#card-inset-bleed'))
	const first = await box(page.locator('#card-inset-first'))
	expect(Math.abs(bleed.left - edges.left)).toBeLessThanOrEqual(1)
	expect(Math.abs(bleed.right - edges.right)).toBeLessThanOrEqual(1)
	// Spaced by the inset's gap alone, like any layout's items.
	const gap = parseFloat(await css(card, 'row-gap'))
	expect(gap).toBeGreaterThan(0)
	expect(Math.abs(bleed.top - first.bottom - gap)).toBeLessThanOrEqual(1)
})

const pinnedAfterScrolling = async (page: Page, area: Locator, pinned: Locator) => {
	await area.evaluate((el) => (el.scrollTop = 120))
	await settle(page)
	expect(await area.evaluate((el) => el.scrollTop), 'the area scrolled').toBe(120)
	return (await box(pinned)).top - (await box(area)).top
}

test('a pinned Card stays at the top of its scroll area', async ({ page }) => {
	const offset = await pinnedAfterScrolling(
		page,
		page.locator('#pin-area'),
		placed(page, 'pin-card'),
	)
	expect(Math.abs(offset)).toBeLessThanOrEqual(1)
})

test('a block pinned inside a Card stays at the top of the scroll area around the card', async ({
	page,
}) => {
	const offset = await pinnedAfterScrolling(
		page,
		page.locator('#pin-in-card-area'),
		page.locator('#pin-in-card'),
	)
	expect(Math.abs(offset)).toBeLessThanOrEqual(1)
})

test('below md a hidden Card leaves one gap, not two', async ({ page }) => {
	await setShellWidth(page, breakpoints().md! - 40)
	expect(await placed(page, 'hide-card').evaluate((el) => el.checkVisibility())).toBe(false)
	const gap = parseFloat(await css(page.locator('#hide-stack'), 'row-gap'))
	const above = await box(page.locator('#hide-above'))
	const below = await box(page.locator('#hide-below'))
	expect(gap).toBeGreaterThan(0)
	expect(Math.abs(below.top - above.bottom - gap)).toBeLessThanOrEqual(1)
})

test("a Card set as a row puts its blocks in the parent's columns", async ({ page }) => {
	const within = async (cell: Locator, column: Locator) => {
		const [c, col] = [await box(cell), await box(column)]
		return c.left >= col.left - 1 && c.right <= col.right + 1
	}
	for (const n of [1, 2, 3])
		expect(
			await within(page.locator(`#row-cell-${n}`), page.locator(`#row-column-${n}`)),
			`cell ${n} sits in column ${n}`,
		).toBe(true)
})

test('a to-do item with a class of its own keeps its checkbox beside its text', async ({
	page,
}) => {
	const plain = await taskItemLayout(page.locator('#task-plain'))
	expect(plain.besideCheckbox).toBe(true)
	expect(await taskItemLayout(page.locator('#task-own'))).toEqual(plain)
})
