import { expect, test } from '../fixtures'
import { settle, steadyRequests } from '../helpers'

// Where the root theme's line sits, and picked's words (sf-system.md, "Line parts"): the line lies
// over the element's 1px edge, big or small, a swatch alone keeps a gap, and a state never
// changes the edge. Picked words are the brand's words; a coloured chip keeps its own.

test('the line lies over the edge, and the edge stays as it is', async ({ page }) => {
	await steadyRequests(page)
	await page.goto('/')
	await settle(page)

	const measured = await page.evaluate(() => {
		const host = document.createElement('div')
		host.className = 'sf-depth-0'
		document.body.append(host)
		// Words as the pixel drawn: the browser may write one colour in different syntaxes.
		const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
		const drawn = (color: string) => {
			ctx.clearRect(0, 0, 1, 1)
			ctx.fillStyle = color
			ctx.fillRect(0, 0, 1, 1)
			return ctx.getImageData(0, 0, 1, 1).data.join()
		}
		const look = (html: string) => {
			host.innerHTML = html
			const own = getComputedStyle(host.firstElementChild!)
			return { offset: own.outlineOffset, edge: own.borderTopColor, words: drawn(own.color) }
		}
		const token = (name: string) => getComputedStyle(host).getPropertyValue(name).trim()
		return {
			edge: token('--sf-stroke-1'),
			gap: token('--sf-stroke-2'),
			picked: look('<p class="sf-on-selected">Picked</p>'),
			pickedChip: look('<button class="sf sf-chip sf-size-xs sf-on-selected">Large</button>'),
			pickedSwatch: look('<button class="sf-swatch sf-on-selected"></button>'),
			card: look('<div class="sf-depth-1 sf-loudness-1">A card</div>'),
			cardWithError: look('<div class="sf-depth-1 sf-loudness-1 sf-is-error">A card</div>'),
			chip: look('<button class="sf sf-chip sf-size-xs">Large</button>'),
			chipWithWarning: look(
				'<button class="sf sf-chip sf-size-xs sf-is-warning">Large</button>',
			),
			field: look('<input class="sf sf-field" />'),
			fieldWithError: look('<input class="sf sf-field sf-is-error" />'),
			current: look('<button class="sf sf-chip sf-on-current">Large</button>'),
			dangerChip: look('<button class="sf sf-chip sf-variant-danger">Delete</button>'),
			pickedDangerChip: look(
				'<button class="sf sf-chip sf-variant-danger sf-on-selected">Delete</button>',
			),
		}
	})

	// Over the edge on a block and on a small chip; a swatch keeps its gap.
	expect(measured.picked.offset).toBe(`-${measured.edge}`)
	expect(measured.pickedChip.offset).toBe(`-${measured.edge}`)
	expect(measured.pickedSwatch.offset).toBe(measured.gap)
	// An error or warning shows with the line; the edge keeps its own colour.
	expect(measured.cardWithError.edge).toBe(measured.card.edge)
	expect(measured.chipWithWarning.edge).toBe(measured.chip.edge)
	expect(measured.fieldWithError.edge).toBe(measured.field.edge)
	// Picked words: the brand's words, as the current item's; a danger chip keeps its red.
	expect(measured.pickedChip.words).toBe(measured.current.words)
	expect(measured.pickedDangerChip.words).toBe(measured.dangerChip.words)
})

test("a picked swatch's line stays full under the pointer; another swatch's is a faint hint", async ({
	page,
}) => {
	await steadyRequests(page)
	await page.goto('/')
	await settle(page)
	await page.evaluate(() => {
		const host = document.createElement('div')
		host.className = 'sf-depth-0'
		host.style.cssText = 'position: fixed; inset: 40px auto auto 40px; display: flex; gap: 16px'
		host.innerHTML =
			'<button id="picked" class="sf-swatch sf-on-hover sf-on-selected" style="width: 24px; height: 24px; background: teal"></button>'
			+ '<button id="other" class="sf-swatch sf-on-hover" style="width: 24px; height: 24px; background: teal"></button>'
		document.body.append(host)
	})
	const line = (id: string) =>
		page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).outlineColor)

	const resting = await line('picked')
	await page.locator('#picked').hover()
	expect(await line('picked')).toBe(resting)
	await page.locator('#other').hover()
	expect(await line('other')).toMatch(/^rgba\(.*, 0\.5\)$/)
})

test("a picked swatch's line and focus ring stay off the next swatch; a colour shown in a button doesn't grow it", async ({
	page,
}) => {
	await steadyRequests(page)
	await page.goto('/')
	await settle(page)
	const measured = await page.evaluate(() => {
		const host = document.createElement('div')
		host.className = 'sf-depth-0'
		host.style.cssText =
			'position: fixed; inset: 40px auto auto 40px; display: flex; gap: var(--sf-spacing-2xs)'
		host.innerHTML =
			'<button id="picked" class="sf-swatch sf-on-selected" style="width: 24px; height: 24px"></button>'
			+ '<button id="next" class="sf-swatch" style="width: 24px; height: 24px"></button>'
			+ '<button id="shows" class="sf"><span class="sf-swatch" style="display: block; width: 16px; height: 16px"></span></button>'
		document.body.append(host)
		const picked = host.querySelector('#picked')!
		const own = getComputedStyle(picked)
		const line = parseFloat(own.outlineOffset) + parseFloat(own.outlineWidth)
		const ring = line + parseFloat(own.getPropertyValue('--sf-stroke-2'))
		const shows = host.querySelector<HTMLElement>('#shows')!
		const swatchIn = shows.firstElementChild!.getBoundingClientRect()
		const button = shows.getBoundingClientRect()
		const padding = getComputedStyle(shows)
		return {
			apart:
				host.querySelector('#next')!.getBoundingClientRect().left
				- picked.getBoundingClientRect().right,
			line,
			ring,
			// The button holds just the colour and its own padding and edge.
			buttonGrows:
				button.width
				- swatchIn.width
				- parseFloat(padding.paddingLeft)
				- parseFloat(padding.paddingRight)
				- parseFloat(padding.borderLeftWidth)
				- parseFloat(padding.borderRightWidth),
		}
	})
	expect(measured.line).toBeGreaterThan(0)
	expect(measured.ring).toBeLessThan(measured.apart)
	expect(measured.buttonGrows).toBe(0)
})
