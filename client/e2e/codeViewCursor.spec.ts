import type { Page } from '@playwright/test'
import type { TiptapEditorHTMLElement } from '@tiptap/vue-3'
import { expect, test } from './fixtures'
import { openTests, selectBlock, settle } from './helpers'

// The cursor across the code view (codeViewCursor.ts), on the test page's "Warnings" cases and a
// table: each way it goes to the same place, or the nearest the other view has, its line at the
// same height on the screen.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

const codeViewButton = (page: Page) => page.getByRole('button', { name: 'Code view' })
// The editor on screen: in the code view, the page's is hidden.
const shownEditor = (page: Page) => page.locator('.tiptap:visible')
const switchView = async (page: Page, toCode: boolean) => {
	await codeViewButton(page).click()
	await expect(codeViewButton(page)).toHaveAttribute('aria-pressed', String(toCode))
	await expect(shownEditor(page)).toBeFocused()
	await expect(page.locator('.tiptap')).toHaveCount(toCode ? 2 : 1)
}

/** What's selected in the view on screen, or the text either side of its cursor, and its line's height. */
const cursor = (page: Page) =>
	page.evaluate(() => {
		const editor = [...document.querySelectorAll<TiptapEditorHTMLElement>('.tiptap')].find(
			(el) => el.checkVisibility(),
		)!.editor!
		const { selection, doc } = editor.state
		const top = Math.round(editor.view.coordsAtPos(selection.from).top)
		if ('node' in selection) {
			const { attrs } = selection.node as { attrs: { id?: string } }
			return { block: attrs.id, top }
		}
		const { $from } = selection
		const text = $from.parent.textContent
		return {
			before: text.slice(0, $from.parentOffset),
			after: text.slice($from.parentOffset),
			selected: doc.textBetween(selection.from, selection.to),
			top,
		}
	})

/**
 * The page's cursor `from` characters into the text of the block with this id, or `from` to `to`
 * selected. Put in, not clicked: in WebKit a click's cursor sometimes lands after the next key.
 */
const putOnPage = (page: Page, id: string, from: number, to = from) =>
	page.evaluate(
		({ id, from, to }) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			let start = -1
			editor.state.doc.descendants((node, pos) => {
				if (node.attrs['id'] === id) start = pos + 1
			})
			editor
				.chain()
				.setTextSelection({ from: start + from, to: start + to })
				.focus()
				.run()
		},
		{ id, from, to },
	)

/**
 * The code view's cursor put just before, or in, the first `find` in its code (`plus` later), or
 * `length` of it selected from there.
 */
const putInCode = (page: Page, find: string, plus = 0, length = 0) =>
	page.evaluate(
		({ find, plus, length }) => {
			const code = [...document.querySelectorAll<TiptapEditorHTMLElement>('.tiptap')].find(
				(el) => el.checkVisibility(),
			)!.editor!
			const at = code.getText().indexOf(find)
			if (at < 0) throw new Error(`putInCode: no ${find}`)
			// Its code starts after the code block's opening, at 1.
			code.commands.setTextSelection({ from: at + plus + 1, to: at + plus + length + 1 })
		},
		{ find, plus, length },
	)

test('a cursor in text is at the same place in the code and back, its line where it was', async ({
	page,
}) => {
	await putOnPage(page, 'warned-stack-text', 3)
	// Its line well inside the screen, 400px down.
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		scrollBy({ top: editor.view.coordsAtPos(editor.state.selection.from).top - 400 })
	})
	await settle(page)
	const before = await cursor(page)
	expect(before).toMatchObject({ before: 'Two', after: ' arrangements' })

	await switchView(page, true)
	const inCode = await cursor(page)
	expect(inCode.before).toMatch(/<p id="warned-stack-text">Two$/)
	expect(inCode.after).toMatch(/^ arrangements<\/p>/)
	expect(inCode.top, 'its line where it was on the screen').toBe(before.top)

	// Moved in the code: the page's cursor goes there.
	for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight')
	await settle(page)
	const moved = await cursor(page)
	await switchView(page, false)
	expect(await cursor(page)).toMatchObject({
		before: 'Two arr',
		after: 'angements',
		top: moved.top,
	})
})

test('selected text is selected in the code, and back', async ({ page }) => {
	await putOnPage(page, 'warned-stack-text', 4, 7)
	await settle(page)
	expect(await cursor(page)).toMatchObject({ selected: 'arr' })
	await switchView(page, true)
	expect(await cursor(page)).toMatchObject({ selected: 'arr' })
	await switchView(page, false)
	expect(await cursor(page)).toMatchObject({ before: 'Two ', selected: 'arr' })
})

test('a selected block is its whole code selected, and comes back selected', async ({ page }) => {
	const toolbar = page.locator('.floating-toolbar')
	for (const [id, code] of [
		['center-picture', '<img class="sl-center" id="center-picture" src="/favicon.png" />'],
		[
			'warned-stack',
			'<layout-stack class="sl-inset" id="warned-stack"><p id="warned-stack-text">Two arrangements</p></layout-stack>',
		],
	] as const) {
		await selectBlock(page, id)
		await switchView(page, true)
		expect(await cursor(page), id).toMatchObject({ selected: code })
		await switchView(page, false)
		expect(await cursor(page), id).toMatchObject({ block: id })
		await expect(toolbar, `${id}'s toolbar`).toBeVisible()
	}
})

test("a block's whole code selected comes back as the block, with its toolbar", async ({
	page,
}) => {
	// Inside the Stack, deeper than the toolbar goes until a block there is selected.
	const paragraph = '<p id="warned-stack-text">Two arrangements</p>'
	await page.locator('#warned-line').click()
	await switchView(page, true)
	await putInCode(page, paragraph, 0, paragraph.length)
	await switchView(page, false)
	expect(await cursor(page)).toMatchObject({ block: 'warned-stack-text' })
	// The toolbar on the paragraph, not the Stack around it, which has a warning.
	await expect(
		page.locator('.floating-toolbar').getByRole('button', { name: /^Attributes/ }),
	).toHaveAccessibleName('Attributes')
})

test('a cursor between tags or in one goes to the nearest place on the page', async ({ page }) => {
	await page.locator('#warned-stack-text').click()
	const stackLine =
		'<layout-stack class="sl-inset" id="warned-stack"><p id="warned-stack-text">Two arrangements</p></layout-stack>'
	const backFrom = async (find: string, plus: number) => {
		await switchView(page, true)
		await putInCode(page, find, plus)
		await switchView(page, false)
		return cursor(page)
	}
	// In a block's setting: that block, at the start of its text.
	expect(await backFrom('sl-inset" id="warned-stack"', 3), 'in a setting').toMatchObject({
		before: '',
		after: 'Two arrangements',
	})
	// In a closing tag, or after it on its line: the end of the block it closes.
	expect(await backFrom('arrangements</p></layout-stack>', 20), 'in a closing tag').toMatchObject(
		{
			before: 'Two arrangements',
			after: '',
		},
	)
	expect(await backFrom(stackLine, stackLine.length), 'at the end of the line').toMatchObject({
		before: 'Two arrangements',
		after: '',
	})
	// In an inline piece's tag: just before the piece, in the line's text.
	expect(await backFrom('<span style="width: 10cqw', 8), "in a piece's tag").toMatchObject({
		before: 'A line with ',
		after: 'a piece in it',
	})
	// In a picture's tag: the picture.
	expect(await backFrom('<img class="sl-center"', 6), "in a picture's tag").toMatchObject({
		block: 'center-picture',
	})
	// Between a table's cells, where the browser moves any text out of the table: at the start of
	// a line, the next cell; at the end of one, the cell on it.
	expect(
		await backFrom('<td>\n        <layout-stack class="sf-gap-sm" id="t1-stack"', -6),
		'between cells',
	).toMatchObject({
		before: '',
		after: 'In a cell',
	})
	expect(
		await backFrom(
			'</td>\n      <td>\n        <layout-stack class="sf-gap-sm" id="t1-stack"',
			5,
		),
		'after a cell on its line',
	).toMatchObject({ before: 'Short', after: '' })
	// At the start of a closing tag's line: the end of the block it closes, here the cell's last text.
	expect(
		await backFrom(
			'>\n      </td>\n      <td>\n        <layout-columns class="sf-gap-md sl-collapse-sm" id="t2-columns"',
			2,
		),
		"at the start of a closing tag's line",
	).toMatchObject({ before: 'c', after: '' })
})

test('a run of text selected exactly in the code comes back as text selected', async ({ page }) => {
	await page.locator('#warned-line').click()
	await switchView(page, true)
	await putInCode(page, 'Two arrangements</p>', 0, 'Two arrangements'.length)
	await switchView(page, false)
	expect(await cursor(page)).toMatchObject({ selected: 'Two arrangements' })
})

test('select all in the code view selects the whole page', async ({ page }) => {
	await page.locator('#warned-line').click()
	await switchView(page, true)
	await page.keyboard.press('ControlOrMeta+a')
	await switchView(page, false)
	const { selected, whole } = await page.evaluate(() => {
		const { doc, selection } =
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		return {
			selected: doc.textBetween(selection.from, selection.to),
			whole: doc.textBetween(0, doc.content.size),
		}
	})
	expect(selected).toBe(whole)
})

test('bold turned on at the cursor is kept through a look at the code', async ({ page }) => {
	await putOnPage(page, 'warned-line', 3)
	await settle(page)
	await page.keyboard.press('ControlOrMeta+b')
	await switchView(page, true)
	await switchView(page, false)
	await page.keyboard.type('q')
	await expect(page.locator('#warned-line strong')).toHaveText('q')
})

test("an icon font's character in the page stays, and the cursor goes where it was", async ({
	page,
}) => {
	// Material Icons' "error": U+E000, from Unicode's private use, as the cursor's markers are.
	const icon = String.fromCodePoint(0xe000)
	await putOnPage(page, 'warned-line', 0)
	await page.keyboard.type(icon)
	await putOnPage(page, 'warned-stack-text', 3)
	await switchView(page, true)
	const inCode = await cursor(page)
	expect(inCode.selected).toBe('')
	expect(inCode.before).toMatch(/>Two$/)
	await page.keyboard.type('x')
	await switchView(page, false)
	await expect(page.locator('#warned-line')).toHaveText(`${icon}A line with a piece in it`)
	await expect(page.locator('#warned-stack-text')).toHaveText('Twox arrangements')
	expect(await cursor(page)).toMatchObject({ before: 'Twox' })
})

test("the end of a code block's last line comes back there", async ({ page }) => {
	// A code block ending in a line break, as pasted code often does.
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.commands.insertContentAt(editor.state.doc.content.size, {
			type: 'codeBlock',
			content: [{ type: 'text', text: 'one\ntwo\n' }],
		})
	})
	await page.locator('#warned-line').click()
	await switchView(page, true)
	await putInCode(page, 'one\ntwo\n</code>', 'one\ntwo'.length)
	await switchView(page, false)
	expect(await cursor(page)).toMatchObject({ before: 'one\ntwo', after: '\n' })
})

test('a cursor in a tag is placed in code only the page reads, as the page reads it', async ({
	page,
}) => {
	await page.locator('#warned-stack-text').click()
	await switchView(page, true)
	// A stray closing tag, which the browser leaves out and Prettier's reader refuses.
	await putInCode(page, '</layout-stack>', '</layout-stack>'.length)
	await page.keyboard.type('</b>')
	await putInCode(page, 'sl-inset" id="warned-stack"', 3)
	await switchView(page, false)
	expect(await cursor(page)).toMatchObject({ before: '', after: 'Two arrangements' })
})

test("code the page can't read keeps the code view and its cursor", async ({ page }) => {
	await page.locator('#warned-stack-text').click()
	await switchView(page, true)
	await page.keyboard.type('<nope>')
	const typed = await cursor(page)
	await codeViewButton(page).click()
	await settle(page)
	await expect(codeViewButton(page)).toHaveAttribute('aria-pressed', 'true')
	expect(await cursor(page)).toEqual(typed)
})
