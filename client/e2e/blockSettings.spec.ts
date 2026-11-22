import type { Page } from '@playwright/test'
import type { TiptapEditorHTMLElement } from '@tiptap/vue-3'
import { expect, test } from './fixtures'
import { box, openTests, selectBlock, settle } from './helpers'

// A tool changes a block's settings in place: a block selected whole stays selected, and keeps
// its other settings (client/src/assets/sf-system.md, "Editor integration").

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

const toolbar = (page: Page) => page.locator('.floating-toolbar')
const panel = (page: Page) => page.locator('.toolbar-panel:popover-open')
const named = (name: string) => new RegExp(`(^|\\s)${name}(\\s|$)`)
const selected = named('ProseMirror-selectednode')

const setPage = (page: Page, html: string) =>
	page.evaluate((html) => {
		document
			.querySelector<TiptapEditorHTMLElement>('.tiptap')!
			.editor!.commands.setContent(html)
	}, html)

for (const [tool, pick, gives] of [
	['Colour', 'primary', 'sf-bg-primary-1'],
	['Font', 'mono', 'sf-font-mono'],
	['Aspect ratio', '16:9', 'sl-aspect-16-9'],
	['Corners', '2', 'sf-radius-2'],
	['Shadow', 'md', 'sf-shadow-md'],
] as const) {
	test(`a pick in ${tool} keeps a Card clicked by its frame selected`, async ({ page }) => {
		await setPage(
			page,
			'<p>Above</p><layout-card id="card" class="sf-size-md"><p id="in-card">In a Card</p></layout-card>',
		)
		const card = page.locator('#card')
		const frame = await box(card)
		const text = await box(page.locator('#in-card'))
		await page.mouse.click(text.left + 20, (frame.top + text.top) / 2)
		await settle(page)
		await expect(card).toHaveClass(selected)

		await toolbar(page).getByRole('button', { name: tool, exact: true }).click()
		// Font's family chips each show "Aa" in their family, named by their title.
		await (
			tool === 'Font'
				? panel(page).getByTitle(pick, { exact: true })
				: panel(page).getByRole('button', { name: pick, exact: true })
		).click()
		await expect(card).toHaveClass(named(gives))
		await expect(card).toHaveClass(selected)
		// No cursor went into its text: the text's tools stay away.
		await expect(toolbar(page).getByRole('button', { name: 'Bold', exact: true })).toHaveCount(
			0,
		)
	})
}

// A block inside a line changes in place too.
test('a pick in Font sizes an icon selected whole, which stays selected', async ({ page }) => {
	await setPage(
		page,
		'<p>Go <span id="icon" class="material-symbols-rounded sf-icon">home</span> now</p>',
	)
	await selectBlock(page, 'icon')
	const icon = page.locator('#icon')
	await expect(icon).toHaveClass(selected)
	await toolbar(page).getByRole('button', { name: 'Font', exact: true }).click()
	await panel(page).getByRole('button', { name: '2xl', exact: true }).click()
	await expect(icon).toHaveClass(named('sf-text-2xl'))
	await expect(icon).toHaveClass(named('sf-icon'))
	await expect(icon).toHaveClass(selected)
})

// Font goes by the theme's sizes, not by what a class starts with: sf-text-block isn't one.
test("Font shows and replaces a block's size, keeping its other sf-text- classes and its font", async ({
	page,
}) => {
	await setPage(
		page,
		'<p id="block" class="sf-text-block sf-text-lg" style="font-family: Georgia">A block</p>',
	)
	await selectBlock(page, 'block')
	await toolbar(page).getByRole('button', { name: 'Font', exact: true }).click()
	await expect(panel(page).getByRole('button', { name: 'lg', exact: true })).toHaveClass(
		named('sf-on-selected'),
	)
	await panel(page).getByRole('button', { name: '2xl', exact: true }).click()
	const block = page.locator('#block')
	await expect(block).toHaveClass(named('sf-text-2xl'))
	await expect(block).toHaveClass(named('sf-text-block'))
	await expect(block).not.toHaveClass(named('sf-text-lg'))
	// A size keeps the block's own font.
	await expect(block).toHaveAttribute('style', 'font-family: Georgia;')
})

for (const [kind, html] of [
	['a paragraph', '<p id="block">A block</p>'],
	['a Card', '<layout-card id="block"><p>In a Card</p></layout-card>'],
	[
		'a to-do item',
		'<ul data-type="taskList"><li data-type="taskItem" id="block"><p>An item</p></li></ul>',
	],
] as const) {
	test(`after Undo and Redo ${kind} selected whole is selected again`, async ({ page }) => {
		// Opened as the editor opens a page, outside the undo history: changes within half a second
		// are one Undo step, so Undo could take the page back too.
		await page.evaluate((html) => {
			document
				.querySelector<TiptapEditorHTMLElement>('.tiptap')!
				.editor!.chain()
				.setMeta('addToHistory', false)
				.setContent(`<p>Above</p>${html}`)
				.run()
		}, html)
		await selectBlock(page, 'block')
		await toolbar(page).getByRole('button', { name: 'Corners', exact: true }).click()
		await panel(page).getByRole('button', { name: '2', exact: true }).click()
		const block = page.locator('#block')
		await toolbar(page).getByRole('button', { name: 'Undo', exact: true }).click()
		await expect(block).not.toHaveClass(named('sf-radius-2'))
		await expect(block, 'after Undo').toHaveClass(selected)
		await toolbar(page).getByRole('button', { name: 'Redo', exact: true }).click()
		await expect(block).toHaveClass(named('sf-radius-2'))
		await expect(block, 'after Redo').toHaveClass(selected)
	})
}

test('a language picked keeps a code block selected and colours its code, Undo and Redo too', async ({
	page,
}) => {
	await setPage(page, '<p>Above</p><pre id="code"><code>const edge = true</code></pre>')
	await selectBlock(page, 'code')
	const code = page.locator('#code')
	const coloured = code.locator('[class^="hljs-"]')
	await toolbar(page).getByRole('button', { name: 'Language', exact: true }).click()
	await panel(page).getByRole('button', { name: 'JavaScript', exact: true }).click()
	await expect(coloured).not.toHaveCount(0)
	await expect(code).toHaveClass(selected)
	for (const round of [1, 2]) {
		await page.keyboard.press('ControlOrMeta+z')
		await expect(coloured, `Undo ${round}`).toHaveCount(0)
		await page.keyboard.press('ControlOrMeta+Shift+z')
		await expect(coloured, `Redo ${round}`).not.toHaveCount(0)
	}
	await expect(code).toHaveClass(selected)
})

test("a video's new address keeps its class, style and id, and plays from the start", async ({
	page,
}) => {
	await setPage(
		page,
		'<p>Above</p><iframe data-youtube-video id="video" class="sl-center" style="max-width: 400px" src="https://www.youtube.com/embed/3lTUAWOgoHs?start=30"></iframe>',
	)
	const video = page.locator('#video')
	await expect(video).toHaveAttribute('src', /start=30/)
	await selectBlock(page, 'video')
	await toolbar(page).getByRole('button', { name: 'youtube address', exact: true }).click()
	const address = toolbar(page).getByRole('textbox', { name: 'youtube address' })
	await address.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
	await address.press('Enter')
	await expect(video).toHaveAttribute('src', /\/embed\/dQw4w9WgXcQ/)
	await expect(video).not.toHaveAttribute('src', /start=/)
	await expect(video).toHaveClass(named('sl-center'))
	await expect(video).toHaveClass(selected)
	await expect(video).toHaveAttribute('style', 'max-width: 400px;')
})

test("a picture's new address keeps its class, style and id", async ({ page }) => {
	await setPage(
		page,
		'<p>Above</p><img id="picture" class="sl-aspect-16-9" style="width: 50%" src="/favicon.png" />',
	)
	await selectBlock(page, 'picture')
	await toolbar(page).getByRole('button', { name: 'image address', exact: true }).click()
	const address = toolbar(page).getByRole('textbox', { name: 'image address' })
	await address.fill('/faviconAlt.png')
	await address.press('Enter')
	const picture = page.locator('#picture')
	await expect(picture).toHaveAttribute('src', '/faviconAlt.png')
	await expect(picture).toHaveClass(named('sl-aspect-16-9'))
	await expect(picture).toHaveClass(selected)
	await expect(picture).toHaveAttribute('style', 'width: 50%;')
})

// The block settings panel has a width of its own, so it measures itself: at its 300px, narrower
// than xs, the names go above the fields, whatever the page's width.
test('the block settings panel stacks its rows by its own width', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 844 })
	await settle(page)
	await page.getByText('A card', { exact: true }).click()
	await page
		.getByRole('button', { name: /^Attributes/ })
		.first()
		.click()
	const name = await box(panel(page).locator('label').getByText('id', { exact: true }))
	const field = await box(panel(page).getByLabel('id', { exact: true }))
	expect(name.bottom, 'the name above its field').toBeLessThanOrEqual(field.top)
})
