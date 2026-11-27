import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { openTests } from './helpers'

// Keyboard focus (sf-system.md, "Line parts"): a ring in the text colour. An element with a line
// keeps it where it is, and the ring reaches just past it, so both show; under the line, the
// surface it sits on, so a dashed line's gaps stay gaps. A field typed into shows its cursor
// instead, with no ring, and keeps its error line (sf-system.md, "A field typed into shows focus
// with its cursor").

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
	await page.evaluate(() => {
		const row = document.createElement('div')
		row.style.cssText = 'position: fixed; top: 40px; left: 40px; display: flex; gap: 16px'
		row.innerHTML =
			'<input id="start" class="sf sf-field" aria-label="Start">'
			+ '<button id="picked" class="sf sf-swatch sf-size-2xs sf-on-selected" aria-label="Picked colour"></button>'
			+ '<button id="plain" class="sf">Plain</button>'
			+ '<input id="field" class="sf sf-field sf-on-focus sf-is-error" aria-label="With an error">'
		document.body.append(row)
	})
})

/** Move keyboard focus to the next control, as Tab does (WebKit on a Mac skips buttons on Tab). */
const tabTo = async (page: Page, browserName: string, id: string) => {
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
	await expect(page.locator(`#${id}`)).toBeFocused()
	expect(await page.locator(`#${id}`).evaluate((el) => el.matches(':focus-visible'))).toBe(true)
}

/** How focus shows on an element, with the theme's values it should use. */
const focusLook = (page: Page, id: string) =>
	page.locator(`#${id}`).evaluate((el) => {
		const own = getComputedStyle(el)
		const token = (name: string) => own.getPropertyValue(name).trim()
		const rgb = (value: string) => `rgb(${value.split(/\s+/).join(', ')})`
		const text = rgb(token('--sf-fg_primary'))
		const surface = rgb(token('--sfx-surface-color') || token('--sf-surface-0'))
		const px = (name: string) => parseFloat(token(name))
		// How far the line reaches past the edge, from where it sits and its width.
		const reach = parseFloat(own.outlineOffset) + parseFloat(own.outlineWidth)
		return {
			// Under the line, the surface it sits on; past it, the ring in the text colour, as wide as
			// the line.
			ringOutside:
				own.boxShadow
				=== `${surface} 0px 0px 0px ${reach}px, ${text} 0px 0px 0px ${reach + px('--sf-stroke-2')}px`,
			outlineInText: own.outlineStyle === 'solid' && own.outlineColor === text,
			// No ring: the outline, or the shadow's last ring, see-through.
			noRing:
				/, 0\)$/.test(own.outlineColor)
				|| /, 0\) 0px 0px 0px [\d.]+px$/.test(own.boxShadow),
			offset: own.outlineOffset,
			outline: own.outlineStyle,
		}
	})

test('focus shows with a line and without one', async ({ page, browserName }) => {
	// A field: no ring.
	await page.locator('#start').focus()
	expect(await focusLook(page, 'start')).toMatchObject({ noRing: true })

	// Picked: the swatch's solid line where it was, the ring just outside it.
	const restingOffset = (await focusLook(page, 'picked')).offset
	await tabTo(page, browserName, 'picked')
	expect(await focusLook(page, 'picked')).toMatchObject({
		ringOutside: true,
		outline: 'solid',
		offset: restingOffset,
	})

	// No line: the outline, in the text colour.
	await tabTo(page, browserName, 'plain')
	expect(await focusLook(page, 'plain')).toMatchObject({ outlineInText: true })

	// A field with an error: its dashed line, and no ring.
	await tabTo(page, browserName, 'field')
	expect(await focusLook(page, 'field')).toMatchObject({ noRing: true, outline: 'dashed' })
})
