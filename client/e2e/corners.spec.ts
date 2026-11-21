import type { Page } from '@playwright/test'
import type { TiptapEditorHTMLElement } from '@tiptap/vue-3'
import { expect, test } from './fixtures'
import { openTests, selectBlock } from './helpers'

// Corners offers the theme's sizes only, and none; a size of the block's own is kept until a pick
// replaces it (client/src/assets/sf-system.md, "Corners").

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

const toolbar = (page: Page) => page.locator('.floating-toolbar')
const panel = (page: Page) => page.locator('.toolbar-panel:popover-open')

const setPage = (page: Page, html: string) =>
	page.evaluate((html) => {
		document
			.querySelector<TiptapEditorHTMLElement>('.tiptap')!
			.editor!.commands.setContent(html)
	}, html)

const openCorners = async (page: Page, id: string) => {
	await selectBlock(page, id)
	await toolbar(page).getByRole('button', { name: 'Corners', exact: true }).click()
	await expect(panel(page)).toBeVisible()
}

const chip = (page: Page, name: string) => panel(page).getByRole('button', { name, exact: true })

test('a block takes a theme size and none takes it off, with no sizes of its own', async ({
	page,
}) => {
	await setPage(page, '<p id="block">A block</p>')
	await openCorners(page, 'block')
	await expect(panel(page)).toContainText('Corners')
	await expect(panel(page).locator('input')).toHaveCount(0)
	await expect(panel(page).getByRole('button')).toHaveText(['none', '0', '1', '2', '3', 'full'])

	await chip(page, '2').click()
	const block = page.locator('#block')
	await expect(block).toHaveAttribute(
		'class',
		'sf-radius-2 sf-on-selected ProseMirror-selectednode',
	)
	// The block stays selected and the panel open: a second pick follows.
	await chip(page, 'none').click()
	await expect(block).not.toHaveAttribute('class', /sf-radius-/)
	await expect(panel(page)).toContainText('Corners')
})

test("none gives a Card the theme's corners, where 0 makes it square", async ({ page }) => {
	await setPage(page, '<layout-card id="card"><p>In a Card</p></layout-card>')
	const card = page.locator('#card')
	const themeCorner = await card.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
	expect(themeCorner).not.toBe('0px')

	await openCorners(page, 'card')
	await chip(page, '0').click()
	await expect(card).toHaveCSS('border-top-left-radius', '0px')
	await chip(page, 'none').click()
	await expect(card).toHaveCSS('border-top-left-radius', themeCorner)
})

// However a block's own size is written, the tool says so and a pick replaces it whole, leaving
// the rest of its style.
for (const [kind, start] of [
	['in pixels', 'style="border-radius: 12px; padding: 4px"'],
	['on one corner', 'style="border-top-right-radius: 3px; padding: 4px"'],
	['on logical corners', 'style="border-start-start-radius: 5px; padding: 4px"'],
	['as oval corners', 'style="border-radius: 10px 20px / 5px; padding: 4px"'],
	['over a theme size', 'class="sf-radius-2" style="border-radius: 12px; padding: 4px"'],
] as const) {
	for (const picked of ['3', 'none']) {
		test(`a block's own size ${kind} is not a theme size, and ${picked} replaces it`, async ({
			page,
		}) => {
			await setPage(page, `<p id="block" ${start}>A block</p>`)
			await openCorners(page, 'block')
			await expect(panel(page)).toContainText('Not a theme size')

			await chip(page, picked).click()
			const block = page.locator('#block')
			await expect(block).toHaveAttribute('style', 'padding: 4px;')
			if (picked === 'none') await expect(block).not.toHaveAttribute('class', /sf-radius-/)
			else
				await expect(block).toHaveAttribute(
					'class',
					`sf-radius-${picked} sf-on-selected ProseMirror-selectednode`,
				)
			await expect(panel(page)).toContainText('Corners')
		})
	}
}

test('a size class the theme has no size for is not a theme size', async ({ page }) => {
	await setPage(page, '<p id="block" class="sf-radius-9">A block</p>')
	await openCorners(page, 'block')
	await expect(panel(page)).toContainText('Not a theme size')
	await chip(page, '1').click()
	await expect(page.locator('#block')).toHaveAttribute(
		'class',
		'sf-radius-1 sf-on-selected ProseMirror-selectednode',
	)
})

test('after Undo the panel shows what the block has', async ({ page }) => {
	await setPage(page, '<p id="block" style="border-radius: 12px">A block</p>')
	await openCorners(page, 'block')
	await chip(page, '3').click()
	await expect(panel(page)).toContainText('Corners')
	await page.keyboard.press('ControlOrMeta+z')
	await expect(page.locator('#block')).toHaveAttribute('style', 'border-radius: 12px;')
	await expect(panel(page)).toContainText('Not a theme size')
})

test('the chosen size picked again changes nothing', async ({ page }) => {
	// Opened as the editor opens a page, outside the undo history. The size class isn't last, as
	// after another tool's pick: written again, it would be.
	await page.evaluate(() => {
		document
			.querySelector<TiptapEditorHTMLElement>('.tiptap')!
			.editor!.chain()
			.setMeta('addToHistory', false)
			.setContent('<p id="block" class="sf-radius-2 sf-shadow-md">A block</p>')
			.run()
	})
	await openCorners(page, 'block')
	await chip(page, '2').click()
	await expect(toolbar(page).getByRole('button', { name: 'Undo', exact: true })).toBeDisabled()
})

test("a block's own corner size is pointed out; square or a theme size is not", async ({
	page,
}) => {
	await setPage(
		page,
		'<p id="own" style="border-radius: 12px">A block</p>'
			+ '<p id="square" style="border-radius: 0">A block</p>'
			+ '<p id="themed" class="sf-radius-2">A block</p>',
	)
	await expect(page.locator('#own')).toHaveClass(/\bsf-is-warning\b/)
	await expect(page.locator('#square')).not.toHaveClass(/\bsf-is-(warning|error)\b/)
	await expect(page.locator('#themed')).not.toHaveClass(/\bsf-is-(warning|error)\b/)

	await selectBlock(page, 'own')
	const attributes = toolbar(page).getByRole('button', { name: /^Attributes/ })
	await expect(attributes).toHaveAccessibleName('Attributes: 1 warning')
	await attributes.click()
	await expect(panel(page)).toContainText(
		"A fixed corner size doesn't change with the theme: use a theme size",
	)
})
