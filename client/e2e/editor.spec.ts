import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
	box,
	nodePosition,
	openTests,
	placed,
	selectBlock,
	settle,
	taskItemLayout,
} from './helpers'

// The editor around the test cases: what's saved, selecting blocks, editing a to-do item,
// the toolbar, and coming back to the editor.

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

// A custom block goes by its alias (the tag the code view shows), never its ID; a built-in one by
// its label, never its type's name.
test('the block pickers name every block they offer', async ({ page }) => {
	const picker = async (iconName: string) => {
		const button = page.locator(
			`.floating-toolbar button[popovertarget]:has(span:text-is("${iconName}"))`,
		)
		await button.click()
		const rows = page.locator(`#${await button.getAttribute('popovertarget')} .picker-item`)
		await expect(rows.first()).toBeVisible()
		const names = await rows.locator('span:last-child').allTextContents()
		await page.keyboard.press('Escape')
		return names
	}
	await selectBlock(page, 'c1-card')
	const wrapIn = await picker('frame_source')
	expect(wrapIn).toContain('layout-section')
	expect(wrapIn.filter((name) => /^[0-9a-f]{8}-/.test(name))).toEqual([])

	// The to-do list, as its node-path crumb selects it, in view.
	await page.evaluate(
		(at) => {
			document.getElementById('task-plain')!.scrollIntoView({ block: 'center' })
			const editor = (document.querySelector('.tiptap') as any).editor
			editor.chain().focus().setNodeSelection(editor.state.doc.resolve(at).before()).run()
		},
		await nodePosition(page, 'task-plain'),
	)
	expect(await picker('add')).toEqual(['Task Item'])
})

/** The cursor at the end of a paragraph straight on the page, so the toolbar acts on it. */
const cursorInParagraph = (page: Page) =>
	page.evaluate(() => {
		const editor = (document.querySelector('.tiptap') as any).editor
		let end: number | undefined
		editor.state.doc.forEach((node: any, offset: number) => {
			if (end !== undefined || node.type.name !== 'paragraph' || !node.content.size) return
			editor.view.nodeDOM(offset).scrollIntoView({ block: 'center' })
			end = offset + node.nodeSize - 1
		})
		editor.chain().focus().setTextSelection(end).run()
	})

/** Opens the toolbar menu with this icon, and returns its panel. */
const openMenu = async (page: Page, iconName: string) => {
	const button = page.locator(
		`.floating-toolbar button[popovertarget]:has(span:text-is("${iconName}"))`,
	)
	await button.click()
	return page.locator(`#${await button.getAttribute('popovertarget')}`)
}

// Change Type asks the editor whether a paragraph can become each block type, and the editor
// warned once for each one it can't. An open menu is worked out again on every keystroke.
test('Change Type on a paragraph logs no warnings', async ({ page }) => {
	const warnings: string[] = []
	page.on('console', (message) => {
		// The app's own code: the browser's own warnings (an unused preload) have the page's address.
		if (message.type() === 'warning' && message.location().url.includes('/assets/'))
			warnings.push(message.text())
	})
	await cursorInParagraph(page)
	await expect(
		(await openMenu(page, 'change_circle')).locator('.picker-item').first(),
	).toBeVisible()
	await page.keyboard.type('abc')
	await settle(page)
	expect(warnings).toEqual([])
})

// A menu's list checks every block type against the block the toolbar is on, and the toolbar
// updates after every change: a closed menu has no list, so typing doesn't work one out for each.
test("typing doesn't fill the toolbar's closed menus", async ({ page }) => {
	await cursorInParagraph(page)
	await page.keyboard.type('abc')
	await settle(page)
	await expect(
		page.locator(
			'.floating-toolbar .popover-box:not(:popover-open) :is(.picker-item, .picker-empty)',
		),
	).toHaveCount(0)
	await expect(
		(await openMenu(page, 'change_circle')).locator('.picker-item').first(),
	).toBeVisible()
})

test('a class given to a to-do item while editing shows at once', async ({ page }) => {
	const item = page.locator('#task-plain')
	const before = await taskItemLayout(item)
	const at = await nodePosition(page, 'task-plain')
	// As the Attributes panel writes it: new attributes on the item's node.
	await page.evaluate((at) => {
		const editor = (document.querySelector('.tiptap') as any).editor
		const node = editor.state.doc.nodeAt(at)
		editor.view.dispatch(
			editor.state.tr.setNodeMarkup(at, null, { ...node.attrs, class: 'sf-depth-1' }),
		)
	}, at)
	await settle(page)
	await expect(item).toHaveClass(/(^|\s)sf-depth-1(\s|$)/)
	expect(await taskItemLayout(item)).toEqual(before)
})

test('ticking a to-do item updates it without redrawing it', async ({ page }) => {
	const item = page.locator('#task-plain')
	await item.evaluate((el) => ((el as any).drawnBeforeTicking = true))
	await item.locator(':scope > label input').check()
	await expect(item).toHaveAttribute('data-checked', 'true')
	expect(await item.evaluate((el) => (el as any).drawnBeforeTicking)).toBe(true)
})

// With blocks selected the toolbar shows only the selection's tools, but a selected block can
// still change in place: ticked, or turned into a heading by typing or a shortcut. It stays
// selected. Deleting one drops just that one, even when the block after it is just like it.
test('selected blocks stay selected when they change in place', async ({ page }) => {
	// Two dividers after the to-do list, for the last step.
	const listEnd = async () =>
		page.evaluate(
			(at) => (document.querySelector('.tiptap') as any).editor.state.doc.resolve(at).after(),
			await nodePosition(page, 'task-plain'),
		)
	await page.evaluate(
		(at) => {
			const editor = (document.querySelector('.tiptap') as any).editor
			const divider = () => editor.schema.nodes.horizontalRule.create()
			editor.view.dispatch(editor.state.tr.insert(at, [divider(), divider()]))
		},
		await listEnd(),
	)

	const ids = ['row-column-1', 'row-column-2', 'task-plain', 'task-own']
	const positions = await Promise.all(ids.map((id) => nodePosition(page, id)))
	await page.evaluate(
		(positions) => {
			const editor = (document.querySelector('.tiptap') as any).editor
			const key = editor.state.plugins.find((p: any) => p.key.startsWith('multiSelect$')).spec
				.key
			editor.view.dispatch(editor.state.tr.setMeta(key, { action: 'addMany', positions }))
		},
		[...positions, await listEnd()],
	)
	const selected = page.locator('.tiptap .sf-on-selected:not(hr)')
	const selectedDivider = page.locator('.tiptap hr.sf-on-selected')
	const texts = ['Column 1', 'Column 2', 'Plain item', 'Item with a class of its own']
	await expect(selected).toHaveText(texts)
	await expect(selectedDivider).toHaveCount(1)

	await page.locator('#task-plain > label input').check()
	await expect(page.locator('#task-plain')).toHaveAttribute('data-checked', 'true')
	await expect(selected, 'a to-do ticked').toHaveText(texts)

	// The cursor at the start of a block's text (Home doesn't go there on a Mac).
	const cursorIn = async (id: string) =>
		page.evaluate(
			(at) => {
				const editor = (document.querySelector('.tiptap') as any).editor
				editor
					.chain()
					.focus()
					.setTextSelection(at + 1)
					.run()
			},
			await nodePosition(page, id),
		)
	await cursorIn('row-column-1')
	await page.keyboard.type('## ')
	await expect(page.locator('#row-parent h2')).toHaveText('Column 1')
	await expect(selected, '"## " typed').toHaveText(texts)

	await cursorIn('row-column-2')
	await page.keyboard.press('ControlOrMeta+Alt+3')
	await expect(page.locator('#row-parent h3')).toHaveText('Column 2')
	await expect(selected, 'the heading shortcut').toHaveText(texts)

	// The first divider, selected as its node-path crumb does, then Backspace.
	const dividers = await page.locator('.tiptap hr').count()
	await page.evaluate(
		(at) => {
			const editor = (document.querySelector('.tiptap') as any).editor
			editor.chain().focus().setNodeSelection(at).run()
		},
		await listEnd(),
	)
	await page.keyboard.press('Backspace')
	await expect(page.locator('.tiptap hr')).toHaveCount(dividers - 1)
	await expect(selectedDivider, 'a divider deleted: the next one stays unselected').toHaveCount(0)
	await expect(selected, 'a divider deleted').toHaveText(texts)
})

test('leaving the editor and coming back shows its content again, without a reload', async ({
	page,
}) => {
	const lastCase = page.locator('#align-cluster-x-end-last')
	await expect(lastCase).toBeAttached()
	// As the site nav does: moving between pages without loading the app again.
	const go = (to: string) =>
		page.evaluate(
			(to) =>
				(
					document.querySelector('#app') as any
				).__vue_app__.config.globalProperties.$router.push(to),
			to,
		)
	await go('/contact')
	await expect(page.locator('main h1')).toHaveText('Contact')
	await go('/editor?seed=tests')
	await expect(lastCase).toBeAttached()
})
