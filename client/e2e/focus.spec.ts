import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { openTests } from './helpers'

// Keyboard focus (sf-system.md, "Line parts"): a ring in the text colour against the element. An
// element with a line keeps it, stepped out round the ring, so both show; a field with an error
// keeps its own focus look.

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
		const text = `rgb(${token('--sf-fg_primary').split(/\s+/).join(', ')})`
		const px = (name: string) => parseFloat(token(name))
		return {
			ring: own.boxShadow === `${text} 0px 0px 0px ${token('--sf-stroke-2')}`,
			outlineInText: own.outlineStyle === 'solid' && own.outlineColor === text,
			// A small thing's gap and the ring's width.
			steppedOut: own.outlineOffset === `${px('--sf-stroke-1') + px('--sf-stroke-2')}px`,
			outline: own.outlineStyle,
			shadow: own.boxShadow,
		}
	})

test('focus shows with a line and without one', async ({ page, browserName }) => {
	await page.locator('#start').focus()

	// Picked: the ring against the swatch, its solid line stepped out round it.
	await tabTo(page, browserName, 'picked')
	expect(await focusLook(page, 'picked')).toMatchObject({ ring: true, steppedOut: true })
	expect((await focusLook(page, 'picked')).outline).toBe('solid')

	// No line: the outline, in the text colour.
	await tabTo(page, browserName, 'plain')
	expect(await focusLook(page, 'plain')).toMatchObject({ outlineInText: true })

	// A field with an error: no line, and no ring from one.
	await tabTo(page, browserName, 'field')
	expect(await focusLook(page, 'field')).toMatchObject({ outline: 'none', shadow: 'none' })
})
