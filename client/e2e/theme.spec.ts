import { expect, test } from './fixtures'
import { box, css, openTests, useTheme } from './helpers'
import { TEST_THEME_CLASS } from './testTheme'

// The test theme only proves something if it really differs from the root theme. If a token or
// rule it overrides is renamed in the seed, the override stops applying and this fails.

test('the test theme really differs from the root theme', async ({ page }) => {
	await openTests(page, null)
	const measure = async () => {
		const inset = await box(page.locator('#inset'))
		const onTheLine = await box(page.locator('#inset-first'))
		const divided = page.locator('#divide-card-twin > p').nth(1)
		return {
			gap: await css(page.locator('#hide-stack'), 'row-gap'),
			cardPadding: await css(page.locator('#divide-card'), 'padding-left'),
			pageMargin: Math.round(onTheLine.left - inset.left),
			font: await css(page.locator('#inset-first'), 'font-family'),
			lineHeight: await css(page.locator('#inset-first'), 'line-height'),
			divider: `${await css(divided, 'border-top-style')} ${await css(divided, 'box-shadow')}`,
		}
	}
	const root = await measure()
	await useTheme(page, TEST_THEME_CLASS)
	const test = await measure()
	for (const key of Object.keys(root) as (keyof typeof root)[])
		expect.soft(test[key], `${key} differs`).not.toEqual(root[key])
})
