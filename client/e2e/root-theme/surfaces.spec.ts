import { expect, test } from '../fixtures'
import { steadyRequests } from '../helpers'

// How the root theme draws a surface in a context: floating, a card or an ordinary button is
// see-through; contained, it has no background or border; pinned, it is solid, so what scrolls
// under it doesn't show. A box with a fill keeps it instead (fill.spec.ts).

const SURFACES = [
	{ name: 'a card', html: '<div class="sf-depth-2">Card</div>' },
	{ name: 'an ordinary button', html: '<button class="sf sf-loudness-2">Edit</button>' },
]

const MODES = [
	{ name: 'light', themeClass: '' },
	{ name: 'dark', themeClass: 'theme-dark' },
]

/** The see-through part of a computed colour: 1 solid, 0 none. */
const alpha = (color: string) => {
	const parts = /\/\s*([\d.]+)\)$|rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(color)
	return parts ? Number(parts[1] ?? parts[2]) : 1
}

for (const mode of MODES)
	test(`a card or an ordinary button floating, contained or pinned, ${mode.name}`, async ({
		page,
	}) => {
		await steadyRequests(page)
		await page.goto('/')
		const looks = await page.evaluate(
			({ surfaces, modeClass }) => {
				const cases = document.createElement('div')
				cases.className = `${modeClass} sf-depth-1`
				document.body.append(cases)
				const look = (around: string, html: string, classes: string) => {
					const holder = document.createElement('div')
					holder.className = around
					holder.innerHTML = html
					const box = holder.firstElementChild!
					box.classList.add(...classes.split(' '))
					cases.append(holder)
					const style = getComputedStyle(box)
					return { background: style.backgroundColor, border: style.borderTopColor }
				}
				return surfaces.map((surface) => ({
					floating: look('', surface.html, 'sf-is-overlay'),
					contained: look('', surface.html, 'sf-is-contained'),
					pinned: look('sf-is-overflow-right', surface.html, 'sl-pin-right'),
				}))
			},
			{ surfaces: SURFACES, modeClass: mode.themeClass },
		)
		SURFACES.forEach((surface, s) => {
			const { floating, contained, pinned } = looks[s]!
			const floatingAlpha = alpha(floating.background)
			expect.soft(floatingAlpha, `${surface.name}, floating, see-through`).toBeGreaterThan(0)
			expect.soft(floatingAlpha, `${surface.name}, floating, see-through`).toBeLessThan(1)
			expect.soft(contained.background, `${surface.name}, contained`).toBe('rgba(0, 0, 0, 0)')
			expect
				.soft(contained.border, `${surface.name}'s border, contained`)
				.toBe('rgba(0, 0, 0, 0)')
			expect.soft(alpha(pinned.background), `${surface.name}, pinned, solid`).toBe(1)
		})
	})
