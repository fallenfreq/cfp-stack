import type { Page } from '@playwright/test'
import type { TiptapEditorHTMLElement } from '@tiptap/vue-3'
import { expect, test } from './fixtures'
import { openTests, selectBlock, settle } from './helpers'

// The colour tools (text, a block's background, a shadow's colour) offer the theme's colours only,
// and write them as classes; a colour not from the theme is kept until one replaces it
// (client/src/assets/sf-system.md, "Colours and alpha").

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

/** Select the words of the block with this id, as a range of text. */
const selectWords = async (page: Page, id: string, words: string) => {
	await page.evaluate(
		({ id, words }) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.state.doc.descendants((node, pos) => {
				if (node.attrs?.['id'] !== id) return
				const from = pos + 1 + node.textContent.indexOf(words)
				editor
					.chain()
					.focus()
					.setTextSelection({ from, to: from + words.length })
					.run()
			})
		},
		{ id, words },
	)
	await settle(page)
}

const openColor = async (page: Page) => {
	await toolbar(page).getByRole('button', { name: 'Colour', exact: true }).click()
	await expect(panel(page)).toBeVisible()
}

test('text takes a theme colour and a see-through step, back to solid, and no free colour', async ({
	page,
}) => {
	await setPage(page, '<p id="words">Some words</p>')
	await selectWords(page, 'words', 'words')
	await openColor(page)
	await expect(panel(page)).toContainText('No colour')
	await expect(panel(page).locator('input[type="color"]')).toHaveCount(0)

	await panel(page).getByRole('button', { name: 'danger', exact: true }).click()
	const span = page.locator('#words span')
	await expect(span).toHaveText('words')
	await expect(span).toHaveAttribute('class', 'sf-color-danger')

	const slider = panel(page).getByRole('slider')
	await slider.fill('0')
	await expect(span).toHaveAttribute('class', 'sf-color-danger sf-color-alpha-1')
	await expect(panel(page)).toContainText('10%')
	await slider.fill(await slider.getAttribute('max').then(String))
	await expect(span).toHaveAttribute('class', 'sf-color-danger')
	await expect(panel(page)).toContainText('100%')
})

test('text with a colour not from the theme says so, and a theme colour replaces it', async ({
	page,
}) => {
	await setPage(page, '<p id="words">Some <span style="color: red">red</span> words</p>')
	await selectWords(page, 'words', 'red')
	await openColor(page)
	await expect(panel(page)).toContainText('Not a theme colour')

	await panel(page).getByRole('button', { name: 'danger', exact: true }).click()
	const span = page.locator('#words span')
	await expect(span).toHaveAttribute('class', 'sf-color-danger')
	await expect(span).not.toHaveAttribute('style')
})

test("a block's background takes a theme colour, which replaces one not from the theme", async ({
	page,
}) => {
	await setPage(page, '<p id="block" style="background-color: red">A block</p>')
	await selectBlock(page, 'block')
	await openColor(page)
	await expect(panel(page)).toContainText('Not a theme colour')

	await panel(page).getByRole('button', { name: 'danger', exact: true }).click()
	const block = page.locator('#block')
	await expect(block).toHaveClass(/\bsf-bg-danger\b/)
	await expect(block).not.toHaveAttribute('style')
})

// It starts with a shadow: picking a size adds toolbar buttons, which can push Shadow, and its
// panel, out of a narrow toolbar's view.
test("a shadow's colour is a theme colour, which replaces one not from the theme", async ({
	page,
}) => {
	await setPage(
		page,
		'<p id="block" class="sf-shadow-md" style="--sf-shadow-color: red">A block</p>',
	)
	await selectBlock(page, 'block')
	await toolbar(page).getByRole('button', { name: 'Shadow', exact: true }).click()
	await expect(panel(page)).toContainText('Not a theme colour')
	await expect(panel(page).locator('input[type="color"]')).toHaveCount(0)

	await panel(page).getByRole('button', { name: 'danger', exact: true }).click()
	const block = page.locator('#block')
	await expect(block).toHaveClass(/\bsf-shadow-md\b/)
	await expect(block).toHaveClass(/\bsf-shadow-color-danger\b/)
	await expect(block).not.toHaveAttribute('style')
})

test('a colour not from the theme, on a block or on its words, is pointed out; a theme colour is not', async ({
	page,
}) => {
	await setPage(
		page,
		'<p id="background" style="background-color: red">A block</p>'
			+ '<p id="words">Some <span style="color: red">red</span> words</p>'
			+ '<p id="themed" class="sf-bg-danger">Some <span class="sf-color-primary-5">themed</span> words</p>',
	)
	await expect(page.locator('#background')).toHaveClass(/\bhas-suggestion\b/)
	await expect(page.locator('#words')).toHaveClass(/\bhas-suggestion\b/)
	await expect(page.locator('#themed')).not.toHaveClass(/\bhas-(suggestion|problem)\b/)

	await selectBlock(page, 'words')
	const attributes = toolbar(page).getByRole('button', { name: /^Attributes/ })
	await expect(attributes).toHaveAccessibleName('Attributes: 1 warning')
	await attributes.click()
	await expect(panel(page)).toContainText(
		"A fixed colour doesn't change with the theme: use a theme colour",
	)
})

test("a shadow with no colour picked has the theme's; any colour picked is kept, back to none", async ({
	page,
}) => {
	await setPage(page, '<p id="block" class="sf-shadow-md">A block</p>')
	await selectBlock(page, 'block')
	await toolbar(page).getByRole('button', { name: 'Shadow', exact: true }).click()
	await expect(panel(page)).toContainText('Theme shadow')

	// The theme's own shadow colour at a step is a pick like any other.
	await panel(page).getByRole('button', { name: 'shadow', exact: true }).click()
	await panel(page).getByRole('slider').fill('1')
	const block = page.locator('#block')
	await expect(block).toHaveAttribute(
		'class',
		'sf-shadow-md sf-shadow-color-shadow sf-shadow-alpha-2',
	)

	// A pick can push Shadow out of a narrow toolbar's view, its panel with it: open it again.
	await page.keyboard.press('Escape')
	await toolbar(page).getByRole('button', { name: 'Shadow', exact: true }).click()
	await panel(page).getByRole('button', { name: 'Theme shadow', exact: true }).click()
	await expect(block).toHaveAttribute('class', 'sf-shadow-md')
	await expect(panel(page)).toContainText('Theme shadow')
})

test('a colour class the theme makes no colour for is not one of its colours', async ({ page }) => {
	await setPage(page, '<p id="words">Some <span class="sf-color-primary">words</span></p>')
	await selectWords(page, 'words', 'words')
	await openColor(page)
	await expect(panel(page)).toContainText('Not a theme colour')
})

// Only a colour picked, or none, replaces a fixed one: a size picked keeps it.
for (const [kind, start] of [
	['beside a theme colour', 'class="sf-shadow-md sf-shadow-color-primary-5"'],
	['on a block with no shadow yet', ''],
]) {
	test(`a shadow's fixed colour ${kind} stays when a size is picked`, async ({ page }) => {
		await setPage(page, `<p id="block" ${start} style="--sf-shadow-color: red">A block</p>`)
		await selectBlock(page, 'block')
		await toolbar(page).getByRole('button', { name: 'Shadow', exact: true }).click()
		await expect(panel(page)).toContainText(start ? 'Not a theme colour' : 'Shadow')
		await panel(page).getByRole('button', { name: 'lg', exact: true }).click()
		const block = page.locator('#block')
		await expect(block).toHaveClass(/\bsf-shadow-lg\b/)
		await expect(block).toHaveAttribute('style', /--sf-shadow-color: red/)
	})
}

test('text with a theme colour and a fixed one shows the fixed one, which is what the page shows', async ({
	page,
}) => {
	await setPage(
		page,
		'<p id="words">Some <span class="sf-color-danger" style="color: red">words</span></p>',
	)
	await selectWords(page, 'words', 'words')
	const swatch = toolbar(page)
		.getByRole('button', { name: 'Colour', exact: true })
		.locator('.color-swatch')
	await expect(swatch).toHaveCSS('background-color', 'rgb(255, 0, 0)')
	await openColor(page)
	await expect(panel(page)).toContainText('Not a theme colour')
})
