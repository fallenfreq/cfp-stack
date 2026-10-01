import { expect, test } from './fixtures'
import { box, openTests, placed, selectBlock, settle } from './helpers'

// The editor around the test cases: what's saved, selecting blocks, and the toolbar.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

test('placement classes go on the outer box too, but are never saved', async ({ page }) => {
	const outer = placed(page, 'pin-card')
	await expect(outer).toHaveAttribute('data-node-view-wrapper')
	await expect(outer).toHaveClass(/(^|\s)sl-pin-top(\s|$)/)
	const saved = await page.evaluate(() => {
		const editor = (document.querySelector('.tiptap') as any).editor
		let saved: string | undefined
		editor.state.doc.descendants((node: any) => {
			if (node.attrs?.id === 'pin-card') saved = node.attrs.class
		})
		return saved
	})
	expect(saved).toBe('sf-size-md sl-pin-top')
})

test('clicking between the blocks in an inset Card selects the card', async ({ page }) => {
	await page.locator('#card-inset').scrollIntoViewIfNeeded()
	const above = await box(page.locator('#card-inset-first'))
	const below = await box(page.locator('#card-inset-bleed'))
	expect(below.top - above.bottom).toBeGreaterThan(4)
	await page.mouse.click(above.left + 20, (above.bottom + below.top) / 2)
	await settle(page)
	const selected = await page.evaluate(() => {
		const editor = (document.querySelector('.tiptap') as any).editor
		return editor.state.selection.node?.attrs.id ?? null
	})
	expect(selected).toBe('card-inset')
})

test('the floating toolbar keeps all its tools with a block selected', async ({ page }) => {
	await selectBlock(page, 'c1-card')
	const toolbar = page.locator('.floating-toolbar')
	await expect(toolbar).toBeVisible()
	expect((await box(toolbar)).width).toBeGreaterThan(200)
	const scroller = toolbar.locator('.overflow-row__scroller')
	expect(await scroller.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
})

test("the Attributes panel's class row stacks in the narrow panel", async ({ page }) => {
	await selectBlock(page, 'c1-card')
	const tune = page.locator('.floating-toolbar button:has(span:text-is("tune"))')
	await tune.click()
	const panel = page.locator(`#${await tune.getAttribute('popovertarget')}`)
	await expect(panel).toBeVisible()
	const row = panel.locator('.sl-split.sl-collapse-xs').first()
	const tracks = await row.evaluate(
		(el) =>
			getComputedStyle(el)
				.gridTemplateColumns.split(' ')
				.filter((t) => parseFloat(t) > 0).length,
	)
	expect(tracks).toBe(1)
	expect((await box(row)).width).toBeGreaterThan(200)
})
