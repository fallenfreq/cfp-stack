import type { Page } from '@playwright/test'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { NodeSelection } from '@tiptap/pm/state'
import type { TiptapEditorHTMLElement } from '@tiptap/vue-3'
import { expect, test } from './fixtures'
import {
	appMessages,
	box,
	css,
	moveTo,
	nodePosition,
	openTests,
	selectBlock,
	selectBlockAt,
	settle,
	taskItemLayout,
	toggleSelection,
} from './helpers'

// The editor around the test cases: what's saved, selecting blocks, editing a to-do item,
// the toolbar, and coming back to the editor.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

/** A block's class as saved. */
const savedClass = (page: Page, id: string) =>
	page.evaluate((id) => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		let saved: string | undefined
		editor.state.doc.descendants((node) => {
			if (node.attrs?.id === id) saved = node.attrs.class
		})
		return saved
	}, id)

// A component block is one box, as a plain block is: TipTap's box is the component's own, wearing
// the block's classes. The selection outline the editor adds to it isn't saved.
test('a component block is one box, and what the editor adds to it is never saved', async ({
	page,
}) => {
	const card = page.locator('#pin-card')
	await expect(card).toHaveAttribute('data-node-view-wrapper')
	await expect(card).toHaveClass(/(^|\s)sl-pin-top(\s|$)/)
	expect(await card.evaluate((el) => el.parentElement!.matches('[data-node-view-wrapper]'))).toBe(
		false,
	)
	await selectBlock(page, 'pin-card')
	await expect(card).toHaveClass(/(^|\s)ProseMirror-selectednode(\s|$)/)
	expect(await savedClass(page, 'pin-card')).toBe('sf-size-md sl-pin-top')
})

// The block's box wraps its text normally, not as the editor's document does, and wrapping the
// block sets itself wins.
test("a component block's own text wrapping wins over the editor's", async ({ page }) => {
	const card = page.locator('#c1-card')
	expect(await css(card, 'white-space')).toBe('normal')
	await page.evaluate(
		async (at) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.view.dispatch(
				editor.state.tr.setNodeAttribute(at, 'style', 'white-space: nowrap'),
			)
		},
		await nodePosition(page, 'c1-card'),
	)
	await expect.poll(() => css(card, 'white-space')).toBe('nowrap')
})

// TipTap adds the outline to the selected block's box by hand; the component drawing its box
// again, for its new classes, took it off.
test('a selected block keeps its outline when its classes change', async ({ page }) => {
	await selectBlock(page, 'c1-card')
	const card = page.locator('#c1-card')
	await expect(card).toHaveClass(/(^|\s)ProseMirror-selectednode(\s|$)/)
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const at = editor.state.selection.from
		editor.view.dispatch(editor.state.tr.setNodeAttribute(at, 'class', 'sf-size-lg'))
	})
	await expect(card).toHaveClass(/(^|\s)sf-size-lg(\s|$)/)
	await expect(card).toHaveClass(/(^|\s)ProseMirror-selectednode(\s|$)/)
})

// The highlight of blocks chosen together is the editor's class on the block's box. The component
// draws its box again when the block is selected, left or given new classes; the highlight stays
// exactly while the block is chosen.
test('a block chosen with others is highlighted exactly while it is chosen', async ({ page }) => {
	const card = page.locator('#c1-card')
	const at = await nodePosition(page, 'c1-card')
	const highlighted = async (step: string, want: boolean) => {
		const check = expect(card, step)
		await (want ? check : check.not).toHaveClass(/(^|\s)sf-on-selected(\s|$)/)
	}
	await toggleSelection(page, at)
	await highlighted('chosen', true)
	await cursorInParagraph(page)
	await highlighted('chosen, the cursor elsewhere', true)
	await page.evaluate((at) => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.view.dispatch(editor.state.tr.setNodeAttribute(at, 'class', 'sf-size-lg'))
	}, at)
	await expect(card).toHaveClass(/(^|\s)sf-size-lg(\s|$)/)
	await highlighted('chosen, new classes', true)
	await page.locator('.floating-toolbar').getByRole('button', { name: 'Clear selection' }).click()
	await highlighted('no longer chosen', false)
	await selectBlock(page, 'c1-card')
	await highlighted('no longer chosen, selected', false)
})

// The toolbar's tools for blocks selected together change the page and empty the selection in
// one step.
test('the toolbar moves and deletes blocks selected together, and the selection empties', async ({
	page,
}) => {
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.commands.insertContentAt(
			editor.state.doc.content.size,
			'<p id="ms-a">A</p><p id="ms-b">B</p><p id="ms-c">C</p>',
		)
	})
	const last = (n: number) =>
		page.evaluate((n) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			const ids: unknown[] = []
			editor.state.doc.forEach((node) => ids.push(node.attrs.id))
			return ids.slice(-n)
		}, n)
	const press = (name: string) =>
		page.locator('.floating-toolbar').getByRole('button', { name }).click()
	const chosen = page.locator('.tiptap .sf-on-selected')

	await toggleSelection(page, await nodePosition(page, 'ms-a'))
	await toggleSelection(page, await nodePosition(page, 'ms-b'))
	await expect(chosen).toHaveCount(2)
	await selectBlockAt(page, await nodePosition(page, 'ms-c'))
	await press('Move after target')
	expect(await last(3)).toEqual(['ms-c', 'ms-a', 'ms-b'])
	await expect(chosen).toHaveCount(0)

	await toggleSelection(page, await nodePosition(page, 'ms-a'))
	await press('Delete selected')
	expect(await last(2)).toEqual(['ms-c', 'ms-b'])
	await expect(chosen).toHaveCount(0)
})

// The drag handle finds a block by its box, which for a component block is the component's own.
test('a selected Card moves by its drag handle', async ({ page }) => {
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.commands.insertContentAt(
			editor.state.doc.content.size,
			'<p id="move-above">Above</p><layout-card id="move-card" class="sf-size-md"><p>Moved</p></layout-card><p id="move-below">Below</p><p id="move-end">End</p>',
		)
	})
	await selectBlock(page, 'move-card')
	const below = await box(page.locator('#move-below'))
	await page.locator('.floating-drag-handle-wrapper').dragTo(page.locator('#move-below'), {
		targetPosition: { x: 20, y: below.height - 2 },
	})
	await settle(page)
	const order = await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const ids: string[] = []
		editor.state.doc.forEach((node) => ids.push(node.attrs.id))
		return ids.slice(-4)
	})
	expect(order).toEqual(['move-above', 'move-below', 'move-card', 'move-end'])
})

// Focus on the Card's box also put the cursor just before it, between blocks, where text can't go
// (the editor warns once).
test('clicking between the blocks in an inset Card selects the card', async ({ page }) => {
	const warnings = appMessages(page, ['warning'])
	await page.locator('#card-inset').scrollIntoViewIfNeeded()
	// The floating toolbar follows the scroll a frame later; until then it can cover the spot.
	await settle(page)
	const above = await box(page.locator('#card-inset-first'))
	const below = await box(page.locator('#card-inset-bleed'))
	expect(below.top - above.bottom).toBeGreaterThan(4)
	await page.mouse.click(above.left + 20, (above.bottom + below.top) / 2)
	await settle(page)
	const selected = await page.evaluate(() => {
		const { selection } =
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		return 'node' in selection ? (selection as NodeSelection).node.attrs.id : null
	})
	expect(selected).toBe('card-inset')
	expect(warnings).toEqual([])
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

// A picker shows as a row once set, else as a button to add it.
test("the layout blocks' Attributes panels offer their pickers", async ({ page }) => {
	const pickers = {
		'divide-card': ['radius', 'padding'],
		'padded-stack': ['gap', 'padding'],
		'padded-center': ['gap', 'padding'],
		'row-parent': ['gap', 'collapse'],
		'c2-split': ['gap', 'collapse'],
	}
	const openPanel = async () => {
		const tune = page.locator('.floating-toolbar button:has(span:text-is("tune"))')
		await tune.click()
		const panel = page.locator(`#${await tune.getAttribute('popovertarget')}`)
		await expect(panel).toBeVisible()
		return panel
	}
	for (const [id, names] of Object.entries(pickers)) {
		await selectBlock(page, id)
		const panel = await openPanel()
		for (const name of names)
			await expect(
				panel
					.getByLabel(name, { exact: true })
					.or(panel.getByRole('button', { name: `add ${name}`, exact: true })),
				`${id}: ${name}`,
			).toHaveCount(1)
		await page.keyboard.press('Escape')
	}
	// Picking one sets the theme's first value, so it waits for the theme's tokens.
	await page.waitForFunction(
		() =>
			(document.querySelector('#app') as any).__vue_app__.config.globalProperties.$pinia.state
				.value.themeTokens?.hydrated,
	)
	await selectBlock(page, 'divide-card')
	await (await openPanel()).getByRole('button', { name: 'add padding', exact: true }).click()
	await expect(page.locator('#divide-card')).toHaveClass(/(^|\s)sf-padding-\S+/)
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
	expect(wrapIn).toContain('layout-stack')
	expect(wrapIn.filter((name) => /^[0-9a-f]{8}-/.test(name))).toEqual([])

	// The to-do list, as its node-path crumb selects it, in view.
	await page.evaluate(
		(at) => {
			document.getElementById('task-plain')!.scrollIntoView({ block: 'center' })
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setNodeSelection(editor.state.doc.resolve(at).before()).run()
		},
		await nodePosition(page, 'task-plain'),
	)
	expect(await picker('add')).toEqual(['Task Item'])
})

/** The cursor at the end of a paragraph straight on the page, so the toolbar acts on it. */
const cursorInParagraph = (page: Page) =>
	page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		let end: number | undefined
		editor.state.doc.forEach((node, offset) => {
			if (end !== undefined || node.type.name !== 'paragraph' || !node.content.size) return
			const dom = editor.view.nodeDOM(offset)
			if (dom instanceof Element) dom.scrollIntoView({ block: 'center' })
			end = offset + node.nodeSize - 1
		})
		if (end === undefined) throw new Error('No paragraph with text straight on the page')
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
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const node = editor.state.doc.nodeAt(at)
		if (!node) throw new Error(`No block at ${at}`)
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
	// A mark of the check's own on the element: a redrawn item is a new element, without it.
	await item.evaluate(
		(el: Element & { drawnBeforeTicking?: boolean }) => (el.drawnBeforeTicking = true),
	)
	await item.locator(':scope > label input').check()
	await expect(item).toHaveAttribute('data-checked', 'true')
	expect(
		await item.evaluate(
			(el: Element & { drawnBeforeTicking?: boolean }) => el.drawnBeforeTicking,
		),
	).toBe(true)
})

test('a to-do item with a class of its own keeps its tick box beside its text as it changes', async ({
	page,
}) => {
	const item = page.locator('#task-own')
	const plain = await taskItemLayout(page.locator('#task-plain'))
	await item.locator(':scope > div p').click()
	await page.keyboard.type('!')
	await expect(item.locator(':scope > div')).toHaveText('Item with a class of its own!')
	expect(await taskItemLayout(item), 'typed in').toEqual(plain)
	await item.locator(':scope > label input').check()
	await expect(item).toHaveAttribute('data-checked', 'true')
	expect(await taskItemLayout(item), 'ticked').toEqual(plain)
})

// With blocks selected the toolbar shows only the selection's tools, but a selected block can
// still change in place: ticked, or turned into a heading by typing or a shortcut. It stays
// selected. Deleting one drops just that one, even when the block after it is just like it.
test('selected blocks stay selected when they change in place', async ({ page }) => {
	// Two dividers after the to-do list, for the last step.
	const listEnd = async () =>
		page.evaluate(
			(at) =>
				document
					.querySelector<TiptapEditorHTMLElement>('.tiptap')!
					.editor!.state.doc.resolve(at)
					.after(),
			await nodePosition(page, 'task-plain'),
		)
	await page.evaluate(
		(at) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			const divider = () => editor.schema.node('horizontalRule')
			editor.view.dispatch(editor.state.tr.insert(at, [divider(), divider()]))
		},
		await listEnd(),
	)

	const ids = ['row-column-1', 'row-column-2', 'task-plain', 'task-own']
	for (const at of [
		...(await Promise.all(ids.map((id) => nodePosition(page, id)))),
		await listEnd(),
	])
		await toggleSelection(page, at)
	// The toolbar follows the cursor away from the list, as after a person's next click.
	await cursorInParagraph(page)
	// A to-do item's text is after its tick box, which has a name of its own for screen readers.
	const selected = page.locator(
		'.tiptap .sf-on-selected:not(hr, li), .tiptap li.sf-on-selected > label + div',
	)
	const selectedDivider = page.locator('.tiptap hr.sf-on-selected')
	const texts = ['Column 1', 'Column 2', 'Plain item', 'Item with a class of its own']
	await expect(selected).toHaveText(texts)
	await expect(selectedDivider).toHaveCount(1)

	for (const id of ['task-plain', 'task-own']) {
		await page.locator(`#${id} > label input`).check()
		await expect(page.locator(`#${id}`)).toHaveAttribute('data-checked', 'true')
		await expect(selected, `${id} ticked`).toHaveText(texts)
	}

	// The cursor at the start of a block's text (Home doesn't go there on a Mac).
	const cursorIn = async (id: string) =>
		page.evaluate(
			(at) => {
				const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
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
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setNodeSelection(at).run()
		},
		await listEnd(),
	)
	await page.keyboard.press('Backspace')
	await expect(page.locator('.tiptap hr')).toHaveCount(dividers - 1)
	await expect(selectedDivider, 'a divider deleted: the next one stays unselected').toHaveCount(0)
	await expect(selected, 'a divider deleted').toHaveText(texts)
})

// Opening a page isn't an edit: the editor opens with it, outside the undo history. Undo after it
// opened took the page back out, for Save to store the empty page.
test('undo goes back no further than the page as it opened', async ({ page }) => {
	const content = () =>
		page.evaluate(() =>
			JSON.stringify(
				document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.getJSON(),
			),
		)
	const opened = await content()
	await page.evaluate(() =>
		document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.commands.focus('end'),
	)
	// A letter typed and undone, so Undo is known to reach the editor; then once more.
	await page.keyboard.type('x')
	expect(await content()).not.toBe(opened)
	for (const press of ['the letter', 'once more']) {
		await page.keyboard.press('ControlOrMeta+z')
		await settle(page)
		expect(await content(), press).toBe(opened)
	}
})

// The editor reads back the HTML it writes, which copying puts on the clipboard: a to-do item's
// tick box is drawn, not text. A pasted to-do list started its first item with an empty span.
// Its blocks and text are compared; the classes the editor adds for display are kept on paste.
test('a pasted to-do list has the blocks and text of the one copied', async ({ page }) => {
	const lists = () =>
		page.evaluate(() => {
			const shape = (node: ProseMirrorNode): unknown => ({
				type: node.type.name,
				text: node.text,
				content: node.content.content.map(shape),
			})
			const found: unknown[] = []
			document
				.querySelector<TiptapEditorHTMLElement>('.tiptap')!
				.editor!.state.doc.descendants((node) => {
					if (node.type.name !== 'taskList') return
					found.push(shape(node))
					return false
				})
			return found
		})
	const [copied] = await lists()
	await page.evaluate(
		(at) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setNodeSelection(editor.state.doc.resolve(at).before()).run()
		},
		await nodePosition(page, 'task-plain'),
	)
	await page.keyboard.press('ControlOrMeta+c')
	await page.evaluate(() =>
		document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.commands.focus('end'),
	)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	const after = await lists()
	expect(after).toHaveLength(2)
	expect(after[1]).toEqual(copied)
})

// The code view is the page as code, in an editor of its own. It used to replace the page in the
// page's editor, so Undo crossed between them: in the code view it brought the page back behind
// the code, and after switching back it put the code in the page as a code block.
const codeViewButton = (page: Page) => page.getByRole('button', { name: 'Code view' })
const pageContent = (page: Page) =>
	page.evaluate(() =>
		JSON.stringify(
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.getJSON(),
		),
	)
// The editor on screen: in the code view, the page's is hidden.
const shownEditor = (page: Page) => page.locator('.tiptap:visible')
const shownCode = (page: Page) =>
	page.evaluate(() =>
		[...document.querySelectorAll<TiptapEditorHTMLElement>('.tiptap')]
			.find((el) => el.checkVisibility())!
			.editor!.getText(),
	)
// Each switch puts the keys on the editor on screen, and leaving leaves no copy of the code.
const switchView = async (page: Page, toCode: boolean) => {
	await codeViewButton(page).click()
	await expect(codeViewButton(page)).toHaveAttribute('aria-pressed', String(toCode))
	await expect(shownEditor(page)).toBeFocused()
	await expect(page.locator('.tiptap')).toHaveCount(toCode ? 2 : 1)
}
const replaceCode = async (page: Page, code: string) => {
	await shownEditor(page).click()
	await page.keyboard.press('ControlOrMeta+a')
	await page.keyboard.type(code)
	// A person's pause: Undo takes back changes less than half a second apart as one.
	await page.waitForTimeout(600)
}
const undo = async (page: Page) => {
	await page.keyboard.press('ControlOrMeta+z')
	await settle(page)
}

// The code view writes a video as the page does, its iframe with its own style, and the page reads
// it back the same.
test('a video in the code view is its iframe, and reads back unchanged', async ({ page }) => {
	const video = () =>
		page.locator('#video-narrow').evaluate((el) => ({
			tag: el.tagName,
			onPage: el.parentElement!.matches('.tiptap'),
			style: el.getAttribute('style'),
		}))
	// A video as YouTube's own embed code writes it, with a fixed size, which the page doesn't keep.
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.commands.insertContentAt(
			editor.state.doc.content.size,
			'<iframe data-youtube-video id="video-sized" width="560" height="315" src="https://www.youtube.com/embed/3lTUAWOgoHs"></iframe>',
		)
	})
	const before = await video()
	await switchView(page, true)
	const written = await page.evaluate(
		(code) => {
			const html = new DOMParser().parseFromString(code, 'text/html')
			return ['video-narrow', 'video-sized'].map((id) => {
				const el = html.getElementById(id)
				return (
					el && {
						tag: el.tagName,
						marked: el.hasAttribute('data-youtube-video'),
						style: el.getAttribute('style')?.replace(/;\s*$/, '') ?? null,
						resp: el.hasAttribute('resp'),
						fixedSize: el.hasAttribute('width') || el.hasAttribute('height'),
					}
				)
			})
		},
		await shownCode(page),
	)
	const asVideo = { tag: 'IFRAME', marked: true, resp: false, fixedSize: false }
	expect(written).toEqual([
		{ ...asVideo, style: 'max-width: 20rem' },
		{ ...asVideo, style: null },
	])
	// A change in the code, so the page is read back from it.
	await page.evaluate(() => {
		const code = [...document.querySelectorAll<TiptapEditorHTMLElement>('.tiptap')].find((el) =>
			el.checkVisibility(),
		)!.editor!
		code.commands.insertContentAt(
			code.state.doc.content.size - 1,
			'\n<p>Written in the code view</p>',
		)
	})
	await switchView(page, false)
	await expect(page.getByText('Written in the code view', { exact: true })).toHaveCount(1)
	expect(await video()).toEqual(before)
})

test('undo in the code view undoes only the code', async ({ page }) => {
	const opened = await pageContent(page)
	await switchView(page, true)
	const code = await shownCode(page)
	await shownEditor(page).click()
	await page.keyboard.press('ControlOrMeta+z')
	expect(await shownCode(page), 'nothing typed: the code as it opened').toBe(code)
	await page.keyboard.type('abc')
	expect(await shownCode(page)).not.toBe(code)
	await page.keyboard.press('ControlOrMeta+z')
	expect(await shownCode(page), 'the typing undone').toBe(code)
	expect(await pageContent(page), 'the page untouched').toBe(opened)
	await switchView(page, false)
	expect(await pageContent(page)).toBe(opened)
})

test('looking at the code and back leaves the page and its undo as they were', async ({ page }) => {
	const opened = await pageContent(page)
	await page.evaluate(() =>
		document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.commands.focus('end'),
	)
	await page.keyboard.type('x')
	const typed = await pageContent(page)
	await switchView(page, true)
	await switchView(page, false)
	expect(await pageContent(page)).toBe(typed)
	await undo(page)
	expect(await pageContent(page), 'the letter undone').toBe(opened)
})

test('changed code goes into the page as one change, which Undo takes back', async ({ page }) => {
	const opened = await pageContent(page)
	await switchView(page, true)
	await replaceCode(page, '<p>From the code.</p>')
	await switchView(page, false)
	await expect(page.locator('.tiptap p')).toHaveText(['From the code.'])
	await undo(page)
	expect(await pageContent(page)).toBe(opened)
})

// Switching left the keys on the hidden page: in Safari, typing then edited it.
test('keys pressed after switching go to the code, not the hidden page', async ({ page }) => {
	const opened = await pageContent(page)
	await switchView(page, true)
	await page.keyboard.type('abc')
	expect(await shownCode(page)).toMatch(/^abc/)
	expect(await pageContent(page)).toBe(opened)
})

// The code block's own keys leave it or turn it into a paragraph, which the code view can't hold:
// Enter at the end added and took away a line by turns.
test("the code block's keys stay in the code", async ({ page }) => {
	const errors: string[] = []
	page.on('pageerror', (error) => errors.push(error.message))
	await switchView(page, true)
	const code = await shownCode(page)
	await page.evaluate(() =>
		[...document.querySelectorAll<TiptapEditorHTMLElement>('.tiptap')]
			.find((el) => el.checkVisibility())!
			.editor!.commands.focus('end'),
	)
	await settle(page)
	for (let i = 0; i < 3; i++) await page.keyboard.press('Enter')
	expect(await shownCode(page)).toBe(`${code}\n\n\n`)
	await page.keyboard.press('ControlOrMeta+Alt+c')
	await settle(page)
	expect(errors).toEqual([])
})

// A table's head and foot hold rows like its body.
test('a table written with a head and foot comes back with all its rows', async ({ page }) => {
	await switchView(page, true)
	await replaceCode(
		page,
		'<table><thead><tr><th>Head</th></tr></thead><tbody><tr><td>Body</td></tr></tbody><tfoot><tr><td>Foot</td></tr></tfoot></table>',
	)
	await switchView(page, false)
	await expect(page.locator('.tiptap tr')).toHaveText(['Head', 'Body', 'Foot'])
})

// Tables from elsewhere give their columns widths; the page keeps none, so a table fits its column.
test('a table written with column widths comes back without them', async ({ page }) => {
	await switchView(page, true)
	await replaceCode(
		page,
		'<table><colgroup><col width="900"><col width="900"></colgroup><tbody><tr><td>One</td><td>Two</td></tr></tbody></table>',
	)
	await switchView(page, false)
	const table = page.locator('.tiptap table')
	await expect(table.locator('td')).toHaveText(['One', 'Two'])
	expect(await pageContent(page), 'no widths kept').not.toMatch(/"colwidth":\[/)
	expect((await box(table)).width).toBeLessThanOrEqual((await box(page.locator('.tiptap'))).width)
})

// It used to drop what it couldn't read without a word: a marquee came back as a paragraph.
test("code the page can't read keeps the code view open, saying what", async ({ page }) => {
	const opened = await pageContent(page)
	await switchView(page, true)
	await replaceCode(page, '<p>Kept</p><marquee>Moving</marquee>')
	await codeViewButton(page).click()
	await expect(page.getByText("The page can't read <marquee> in this code.")).toBeVisible()
	await expect(codeViewButton(page)).toHaveAttribute('aria-pressed', 'true')
	expect(await pageContent(page)).toBe(opened)
})

// The page's toolbar works on the page; over the code view it would stay where it was.
test("the page's toolbar and path aren't shown in the code view", async ({ page }) => {
	await selectBlock(page, 'task-plain')
	const toolbar = page.locator('.floating-toolbar')
	const path = page.locator('.node-path button')
	await expect(toolbar).toBeVisible()
	await expect(path).not.toHaveCount(0)
	await switchView(page, true)
	await expect(toolbar).toHaveCount(0)
	await expect(path).toHaveCount(0)
	await switchView(page, false)
	await expect(toolbar).toBeVisible()
	await expect(path).not.toHaveCount(0)
})

test('leaving the editor and coming back shows its content again, without a reload', async ({
	page,
}) => {
	const lastCase = page.locator('#align-cluster-x-end-last')
	await expect(lastCase).toBeAttached()
	await moveTo(page, '/contact')
	await expect(page.locator('main h1')).toHaveText('Contact')
	await moveTo(page, '/editor?seed=tests')
	await expect(lastCase).toBeAttached()
})

// The toolbar took its room off the page as it went, after the editor had closed.
test('leaving the editor logs no errors', async ({ page }) => {
	const errors = appMessages(page, ['error'])
	const room = await page.locator('.tiptap').evaluate((page) => {
		const style = getComputedStyle(page)
		return parseFloat(style.paddingTop) - parseFloat(style.getPropertyValue('--toolbar-height'))
	})
	expect(room, 'the page has room at its top for the toolbar').toBeGreaterThan(0)
	await moveTo(page, '/contact')
	await expect(page.locator('main h1')).toHaveText('Contact')
	expect(errors).toEqual([])
})

// Focus on a block's own control (here the interactive block's button) moved the cursor to just
// before the block, between blocks, where text can't go. The cursor stays where it was.
test("using a block's own control leaves the cursor where it was", async ({ page }) => {
	const warnings = appMessages(page, ['warning'])
	await cursorInParagraph(page)
	await settle(page)
	const selection = () =>
		page.evaluate(() =>
			document
				.querySelector<TiptapEditorHTMLElement>('.tiptap')!
				.editor!.state.selection.toJSON(),
		)
	const before = await selection()
	await page.locator('#divide-slot button', { hasText: 'Click me' }).focus()
	await settle(page)
	expect(await selection()).toEqual(before)
	expect(warnings).toEqual([])
})

// A code block is the published page's pre; its language is chosen from the toolbar.
test("the toolbar's Language picker sets a code block's language", async ({ page }) => {
	const code = page.locator('#line-code-bleed code')
	await code.click()
	await settle(page)
	const menu = await openMenu(page, 'code')
	await expect(menu.locator('.picker-item.sf-on-current')).toHaveText('Auto')
	await menu.locator('.picker-item', { hasText: 'Python' }).click()
	await expect(code).toHaveClass(/(^|\s)language-python(\s|$)/)
	const saved = await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		let language: string | undefined
		editor.state.doc.descendants((node) => {
			if (node.attrs?.id === 'line-code-bleed') language = node.attrs.language
		})
		return language
	})
	expect(saved).toBe('python')
})
