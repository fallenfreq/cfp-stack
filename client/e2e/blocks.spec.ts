import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { box, breakpoints, css, openTests, setShellWidth, settle, taskItemLayout } from './helpers'

// A block rendered by a component is two boxes: the component's own box (the block, wearing its
// classes) and a content box holding its blocks. These check that layout rules reach through the
// content box as they do for plain blocks (sf-system.md, "Component blocks"). Looks are the
// theme's, so a block is compared with a plain twin rather than with a particular look.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

/** What a divide line could look like, for each block inside a block and for a component's own parts. */
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
		return {
			items: [...(content ?? root).children].map(look),
			ownParts: content ? [...root.children].filter((el) => el !== content).map(look) : [],
		}
	})

test('divide lines in a Stack look like those in a plain stack', async ({ page }) => {
	const block = await dividerLooks(page, 'divide-stack')
	const twin = await dividerLooks(page, 'divide-stack-twin')
	expect(twin.items[1], 'the theme draws a divide line').not.toBe(twin.items[0])
	expect(block.items).toEqual(twin.items)
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

test('a picture with a shape keeps it in a column narrower than the picture; a centred one keeps its size', async ({
	page,
}) => {
	const column = await box(page.locator('#shape-picture-column'))
	const picture = page.locator('#shape-picture')
	const own = await picture.evaluate((img: HTMLImageElement) => img.naturalWidth)
	expect(own, 'the picture is wider than its column').toBeGreaterThan(column.width)
	const shaped = await box(picture)
	expect(Math.abs(shaped.width - column.width), 'width').toBeLessThanOrEqual(1)
	expect(Math.abs(shaped.height - (shaped.width * 9) / 16), 'shape').toBeLessThanOrEqual(1)
	const centred = page.locator('#center-picture')
	const size = await centred.evaluate((img: HTMLImageElement) => [
		img.naturalWidth,
		img.naturalHeight,
	])
	const placedAt = await box(centred)
	expect([Math.round(placedAt.width), Math.round(placedAt.height)], 'centred').toEqual(size)
})

test('a Card set to bleed reaches the edges of the inset around it', async ({ page }) => {
	const inset = await box(page.locator('#inset'))
	const bleed = await box(page.locator('#inset-bleed'))
	const onTheLine = await box(page.locator('#inset-first'))
	expect(onTheLine.left, 'the theme gives the inset a margin').toBeGreaterThan(inset.left + 1)
	expect(Math.abs(bleed.left - inset.left)).toBeLessThanOrEqual(1)
	expect(Math.abs(bleed.right - inset.right)).toBeLessThanOrEqual(1)
})

test("in a Card used as an inset, a block or a video set to bleed reaches the card's edges", async ({
	page,
}) => {
	const card = page.locator('#card-inset')
	const edges = await box(card)
	const bleed = await box(page.locator('#card-inset-bleed'))
	const first = await box(page.locator('#card-inset-first'))
	for (const id of ['card-inset-bleed', 'card-inset-video']) {
		const spans = await box(page.locator(`#${id}`))
		expect(Math.abs(spans.left - edges.left), id).toBeLessThanOrEqual(1)
		expect(Math.abs(spans.right - edges.right), id).toBeLessThanOrEqual(1)
	}
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
		page.locator('#pin-card'),
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

test('below md a hidden Card or video leaves one gap, not two', async ({ page }) => {
	await setShellWidth(page, breakpoints().md! - 40)
	for (const [hidden, prefix] of [
		['hide-card', 'hide'],
		['video-hide', 'video-hide'],
	] as const) {
		expect(await page.locator(`#${hidden}`).evaluate((el) => el.checkVisibility())).toBe(false)
		const gap = parseFloat(await css(page.locator(`#${prefix}-stack`), 'row-gap'))
		const above = await box(page.locator(`#${prefix}-above`))
		const below = await box(page.locator(`#${prefix}-below`))
		expect(gap).toBeGreaterThan(0)
		expect(Math.abs(below.top - above.bottom - gap), hidden).toBeLessThanOrEqual(1)
	}
})

test('a video fills its width up to 36rem, or the limit in its own style, at 16:9', async ({
	page,
}) => {
	const rem = parseFloat(await css(page.locator('html'), 'font-size'))
	for (const [id, limit] of [
		['video-default', 36],
		['video-narrow', 20],
	] as const) {
		const video = await box(page.locator(`#${id}`))
		expect(Math.abs(video.width - limit * rem), `${id}: width`).toBeLessThanOrEqual(1)
		expect(Math.abs(video.height - (video.width * 9) / 16), `${id}: 16:9`).toBeLessThanOrEqual(
			1,
		)
	}
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

test("in a row, a Stack and a Card stretch to the row's height, as a plain block does", async ({
	page,
}) => {
	const row = (await box(page.locator('#stretch-tall'))).height
	const content = (await box(page.locator('#stretch-plain p'))).height
	expect(row, 'the tall block makes the row taller than a short one').toBeGreaterThan(
		content + 40,
	)
	for (const id of ['stretch-plain', 'stretch-stack', 'stretch-card'])
		expect(Math.abs((await box(page.locator(`#${id}`))).height - row), id).toBeLessThanOrEqual(
			1,
		)
	// A component straight in a plain row, here a row of shared columns.
	const sharedRow = (await box(page.locator('#stretch-row-tall'))).height
	const card = (await box(page.locator('#stretch-row-card'))).height
	expect(Math.abs(card - sharedRow), 'stretch-row-card').toBeLessThanOrEqual(1)
})

test('in a row, a block with wide content is as wide as a plain block', async ({ page }) => {
	const plain = await box(page.locator('#wide-plain'))
	// The word on one line; in the column it's broken to fit.
	const word = await page.locator('#wide-plain p').evaluate((p) => {
		const line = document.createElement('span')
		line.style.cssText = `white-space: nowrap; font: ${getComputedStyle(p).font}`
		line.textContent = p.textContent
		document.body.append(line)
		const width = line.getBoundingClientRect().width
		line.remove()
		return width
	})
	expect(word, 'the word is wider than the column').toBeGreaterThan(plain.width)
	const stack = await box(page.locator('#wide-stack'))
	expect(Math.abs(stack.width - plain.width), 'keeps a plain row its column').toBeLessThanOrEqual(
		1,
	)
	// A Columns block's column widens for its content.
	const widened = await box(page.locator('#widen-plain'))
	const short = (await box(page.locator('#scroll-plain'))).width
	expect(widened.width, "the word widens a Columns block's column").toBeGreaterThan(short + 40)
	const widen = (await box(page.locator('#widen-stack'))).width
	expect(
		Math.abs(widen - widened.width),
		'widens a Columns block its column',
	).toBeLessThanOrEqual(1)
	// A block that scrolls sideways keeps its column.
	const scroll = (await box(page.locator('#scroll-stack'))).width
	expect(Math.abs(scroll - short), 'a block that scrolls keeps its column').toBeLessThanOrEqual(1)
})

test('in a row, a block with a shape keeps its shape and its column, as a plain block does', async ({
	page,
}) => {
	const column = (await box(page.locator('#shape-short'))).width
	const tall = (await box(page.locator('#shape-tall'))).height
	expect(tall, 'the row is taller than a column is wide').toBeGreaterThan(column + 40)
	for (const id of ['shape-stack', 'shape-plain']) {
		const own = await box(page.locator(`#${id}`))
		expect(Math.abs(own.width - column), `${id} keeps its column`).toBeLessThanOrEqual(1)
		expect(Math.abs(own.height - own.width), `${id} keeps its shape`).toBeLessThanOrEqual(1)
	}
	// More text than its shape holds: it grows taller, not wider.
	const wordy = await box(page.locator('#shape-wordy'))
	expect(Math.abs(wordy.width - column), 'shape-wordy keeps its column').toBeLessThanOrEqual(1)
	expect(wordy.height, 'shape-wordy holds more than its shape').toBeGreaterThan(wordy.width)
	// A height of its own: the shape sets the width, as on the page.
	for (const id of ['shape-own', 'shape-own-plain']) {
		const own = await box(page.locator(`#${id}`))
		expect([Math.round(own.width), Math.round(own.height)], id).toEqual([100, 100])
	}
})

test("in a row, a block's own space above and below stays inside the row, as a plain block's does", async ({
	page,
}) => {
	const plain = await box(page.locator('#spaced-plain'))
	const content = (await box(page.locator('#spaced-plain p'))).height
	expect(plain.height, 'the plain block stretches').toBeGreaterThan(content + 40)
	const stack = await box(page.locator('#spaced-stack'))
	expect(Math.abs(stack.top - plain.top), 'top').toBeLessThanOrEqual(1)
	expect(Math.abs(stack.bottom - plain.bottom), 'bottom').toBeLessThanOrEqual(1)
})

/** The first column of the row a block sits in, from the row's own tracks. */
const firstColumn = (page: Page, id: string) =>
	page.locator(`#${id}`).evaluate((el) => {
		const row = el.parentElement!.closest('.sl-columns')!
		const s = getComputedStyle(row)
		const left =
			row.getBoundingClientRect().left
			+ parseFloat(s.borderLeftWidth)
			+ parseFloat(s.paddingLeft)
		const width = parseFloat(s.gridTemplateColumns.split(' ')[0]!)
		return { left, right: left + width, width }
	})

test('in a row, a Centre is as wide as its measure allows, centred, as on the page', async ({
	page,
}) => {
	const centre = page.locator('#row-center')
	const column = await firstColumn(page, 'row-center')
	const measure = parseFloat(await css(centre, 'max-width'))
	const own = await box(centre)
	expect(Math.abs(own.width - Math.min(column.width, measure)), 'width').toBeLessThanOrEqual(1)
	const [left, right] = [own.left - column.left, column.right - own.right]
	expect(Math.abs(left - right), 'centred').toBeLessThanOrEqual(1)
	// A plain centred column: the same width in the same size of column.
	const plain = await box(page.locator('#row-center-plain'))
	expect(Math.abs(plain.width - own.width), 'plain').toBeLessThanOrEqual(1)
})

test('a centred column is as wide as its measure allows in a stack or an inset, and as wide as its text in a layout aligned sideways, as a Centre is', async ({
	page,
}) => {
	const measure = parseFloat(await css(page.locator('#stack-center'), 'max-width'))
	for (const where of ['stack', 'inset', 'aligned']) {
		const centre = await box(page.locator(`#${where}-center`))
		const plain = await box(page.locator(`#${where}-center-plain`))
		if (where === 'aligned') expect(centre.width, where).toBeLessThan(measure / 2)
		else expect(Math.abs(centre.width - measure), where).toBeLessThanOrEqual(1)
		expect(Math.abs(plain.width - centre.width), `${where}, plain`).toBeLessThanOrEqual(1)
	}
})

// Each was narrower, or wider, than its plain twin while a component block was two boxes.
test('in a cluster or a Cover, a Centre sits as a plain centred stack does', async ({ page }) => {
	for (const where of ['cluster', 'cover']) {
		const centre = await box(page.locator(`#${where}-center`))
		const plain = await box(page.locator(`#${where}-center-plain`))
		expect(Math.abs(centre.width - plain.width), `${where}: width`).toBeLessThanOrEqual(1)
		expect(Math.abs(centre.left - plain.left), `${where}: left`).toBeLessThanOrEqual(1)
	}
})

test('in a row, collapsing Columns holding a long word are as wide as plain columns', async ({
	page,
}) => {
	const columns = await box(page.locator('#word-columns'))
	const plain = await box(page.locator('#word-columns-plain'))
	expect(Math.abs(columns.width - plain.width)).toBeLessThanOrEqual(1)
})

test('in a row, a Card set to hide or show below a width does, as on the page', async ({
	page,
}) => {
	const shown = (id: string) => page.locator(`#${id}`).evaluate((el) => el.checkVisibility())
	expect([await shown('row-hide'), await shown('row-show')], 'wide').toEqual([true, false])
	await setShellWidth(page, breakpoints().md! - 40)
	expect([await shown('row-hide'), await shown('row-show')], 'below md').toEqual([false, true])
})

test('in a row aligned to the top, a Stack and a Card keep their own height, as a plain block does', async ({
	page,
}) => {
	const plain = (await box(page.locator('#top-plain'))).height
	expect((await box(page.locator('#top-tall'))).height, 'the row is taller').toBeGreaterThan(
		plain + 40,
	)
	for (const id of ['top-stack', 'top-card'])
		expect(
			Math.abs((await box(page.locator(`#${id}`))).height - plain),
			id,
		).toBeLessThanOrEqual(1)
})

test('a to-do item with a class of its own keeps its checkbox beside its text', async ({
	page,
}) => {
	const plain = await taskItemLayout(page.locator('#task-plain'))
	expect(plain.besideCheckbox).toBe(true)
	expect(await taskItemLayout(page.locator('#task-own'))).toEqual(plain)
})
