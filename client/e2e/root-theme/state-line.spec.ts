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
		const look = (html: string) => {
			host.innerHTML = html
			const own = getComputedStyle(host.firstElementChild!)
			return { offset: own.outlineOffset, edge: own.borderTopColor, words: own.color }
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
