import type { Page } from '@playwright/test'
import type { TiptapEditorHTMLElement } from '@tiptap/vue-3'
import { expect, test } from './fixtures'
import { nodePosition, openTests, selectBlock, settle } from './helpers'

// Warnings on the blocks (pageWarnings.ts), on the test page's "Warnings" cases. Each block a rule
// names is marked; its Attributes panel lists why; the node path and the top bar's count find it.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

const stack = (page: Page) => page.locator('#warned-stack')
const attributes = (page: Page) =>
	page.locator('.floating-toolbar').getByRole('button', { name: /^Attributes/ })
const panel = (page: Page) => page.locator('.toolbar-panel:popover-open')

/** The id of the block selected as a whole. */
const selectedId = (page: Page) =>
	page.evaluate(() => {
		const { selection } =
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		return 'node' in selection ? (selection.node as { attrs: { id?: string } }).attrs.id : null
	})

test("a component's own classes reach the rules, also while it's selected", async ({ page }) => {
	await expect(stack(page)).toHaveClass(/\bsf-is-error\b/)
	await selectBlock(page, 'warned-stack')
	await expect(attributes(page)).toHaveAccessibleName('Attributes: 1 warning')
	await attributes(page).click()
	await expect(panel(page)).toContainText('One block has 2 arrangements: sl-stack and sl-inset')
	// Only the Stack's own: not its mark, which is the editor's.
	await expect(
		panel(page).getByText('Comes with this block: sl-stack', { exact: true }),
	).toBeVisible()

	// A change while it's selected runs the rules again, its own sl-stack still read from its box.
	const classRow = panel(page).getByLabel('class', { exact: true })
	await classRow.fill('sl-inset sf-gap-sm')
	await classRow.press('Enter')
	await expect(stack(page)).toHaveClass(/\bsf-gap-sm\b/)
	await expect(stack(page)).toHaveClass(/\bsf-on-targeted\b/)
	await expect(stack(page)).toHaveClass(/\bsf-is-error\b/)

	// Typed away in the class row, the warning goes.
	await classRow.fill('sf-gap-sm')
	await classRow.press('Enter')
	await expect(stack(page)).not.toHaveClass(/\bsf-is-error\b/)
	await expect(attributes(page)).toHaveAccessibleName('Attributes')
	await expect(panel(page)).not.toContainText('arrangements')
})

test('the node path shows a block with a warning around the cursor', async ({ page }) => {
	await page.locator('#warned-stack-text').click()
	await settle(page)
	const crumbs = page.locator('.node-path button')
	await expect(crumbs.filter({ hasText: 'layout-stack' })).toHaveClass(/\bsf-variant-danger\b/)
	await expect(crumbs.last()).not.toHaveClass(/\bsf-variant-/)
})

test("an inline piece's warning shows on its line, and on the piece when the toolbar's on it", async ({
	page,
}) => {
	const piece = page.locator('#warned-line span')
	await expect(piece).toHaveClass(/\bsf-is-error\b/)
	await selectBlock(page, 'warned-line')
	await expect(attributes(page)).toHaveAccessibleName('Attributes: 1 warning')
	await attributes(page).click()
	await expect(panel(page)).toContainText('cqw measures a container')
	await page.keyboard.press('Escape')

	await piece.click()
	await settle(page)
	const crumb = page.locator('.node-path button', { hasText: /^span$/ })
	await expect(crumb).toHaveClass(/\bsf-variant-danger\b/)
	await crumb.click()
	await settle(page)
	await expect(attributes(page)).toHaveAccessibleName('Attributes: 1 warning')
})

test('the count selects the next block with a warning, then the first', async ({ page }) => {
	const count = page.locator('.editor-top-bar').getByRole('button', { name: /go to the next/ })
	await selectBlock(page, 'warned-stack')
	await count.click()
	await settle(page)
	expect(await selectedId(page)).toBe('warned-line')
	await expect(attributes(page)).toHaveAccessibleName('Attributes: 1 warning')

	// None after it: the first on the page, before the Stack.
	await count.click()
	await settle(page)
	const first = await page.evaluate(
		() =>
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state.selection
				.from,
	)
	expect(first).toBeLessThan(await nodePosition(page, 'warned-stack'))
	await expect(page.locator('.tiptap .ProseMirror-selectednode')).toHaveClass(
		/\bsf-is-(error|warning)\b/,
	)
	await expect(attributes(page)).toHaveAccessibleName(/^Attributes: \d+ warnings?$/)
})

// Each part of a block's line says one thing (sf-system.md, "Line parts"): a targeted block's line
// is thick and half see-through, and keeps what else is true of it (a small block's problem its
// colour and dashes, a picked block's line solid). Lines draw in the colours' inks. The blocks inside keep their own lines.
test('a targeted line keeps what else is true of the block', async ({ page }) => {
	await page.evaluate(() => {
		document
			.querySelector<TiptapEditorHTMLElement>('.tiptap')!
			.editor!.commands.setContent(
				'<p id="small" class="sl-stack sl-inset sf-size-xs">Two arrangements</p>'
					+ '<p id="picked" class="sf-on-selected">Picked</p>'
					+ '<blockquote id="quote"><p id="inside" class="sl-stack sl-inset">Inside</p></blockquote>',
			)
	})
	const lineOf = (id: string) =>
		page.locator(`#${id}`).evaluate((el) => {
			const own = getComputedStyle(el)
			const rgb = (name: string) => own.getPropertyValue(name).trim().split(/\s+/).join(', ')
			return {
				style: own.outlineStyle,
				thick: own.outlineWidth === own.getPropertyValue('--sf-stroke-3').trim(),
				danger: own.outlineColor.startsWith(`rgba(${rgb('--sf-danger_ink')},`),
				solidBrand: own.outlineColor === `rgb(${rgb('--sf-primary_ink')})`,
				halfBrand: own.outlineColor.startsWith(`rgba(${rgb('--sf-primary_ink')},`),
			}
		})

	await selectBlock(page, 'quote')
	expect(await lineOf('quote')).toMatchObject({ style: 'solid', thick: true, halfBrand: true })
	// A problem inside keeps its own thin line.
	expect(await lineOf('inside')).toMatchObject({ style: 'dashed', thick: false, danger: true })

	await selectBlock(page, 'small')
	await expect(page.locator('#small')).toHaveClass(/\bsf-is-error\b/)
	expect(await lineOf('small')).toMatchObject({ style: 'dashed', thick: true, danger: true })

	await selectBlock(page, 'picked')
	expect(await lineOf('picked')).toMatchObject({
		style: 'solid',
		thick: true,
		solidBrand: true,
	})
})
