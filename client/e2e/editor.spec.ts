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
	openSeeded,
	openTests,
	selectBlock,
	selectBlockAt,
	setClipboard,
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
			if (node.attrs?.['id'] === id) saved = node.attrs['class']
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
			editor.state.doc.forEach((node) => ids.push(node.attrs['id']))
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

// A block and one inside it can both be chosen, but the one inside moves with its block: moved
// again by itself, it was copied, id and all (multiSelect.ts, blocksToMoveTo). Nothing moves beside
// or over a block inside one that moves.
test('blocks selected together move once each, a block inside another with it', async ({
	page,
}) => {
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.commands.insertContentAt(
			editor.state.doc.content.size,
			'<p id="mo-top">Top</p><layout-card id="mo-card" class="sf-size-md"><p id="mo-one">One</p><p id="mo-two">Two</p></layout-card><p id="mo-x">X</p><p id="mo-mid">Mid</p><p id="mo-target">Target</p><p id="mo-end">End</p>',
		)
	})
	// Each of these blocks, by its id, or its text if it has none.
	const blocks = () =>
		page.evaluate(() => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			const found: string[] = []
			editor.state.doc.descendants((node) => {
				const name = node.attrs['id'] ?? node.textContent
				if (node.isBlock && name && (found.length || name.startsWith('mo-')))
					found.push(name)
			})
			return found
		})
	const tool = (name: string) => page.locator('.floating-toolbar').getByRole('button', { name })
	const chosen = page.locator('.tiptap .sf-on-selected')
	const at = (id: string) => nodePosition(page, id)
	// The block's drag handle, dragged to the top or bottom edge of another.
	const drag = async (id: string, to: string, edge: 'top' | 'bottom') => {
		await selectBlockAt(page, await at(id))
		const { height } = await box(page.locator(`#${to}`))
		await page.locator('.floating-drag-handle-wrapper').dragTo(page.locator(`#${to}`), {
			targetPosition: { x: 20, y: edge === 'top' ? 2 : height - 2 },
		})
		await settle(page)
	}
	const chooseCardAndMid = async () => {
		await toggleSelection(page, await at('mo-card'))
		await tool('Add all children').click()
		await toggleSelection(page, await at('mo-mid'))
		await expect(chosen).toHaveCount(4)
	}

	await toggleSelection(page, await at('mo-card'))
	await toggleSelection(page, await at('mo-mid'))
	await selectBlockAt(page, await at('mo-one'))
	for (const name of ['Move before target', 'Move after target', 'Replace target'])
		await expect(tool(name), `${name}, a target inside the Card`).toBeDisabled()
	const before = await blocks()
	await drag('mo-mid', 'mo-one', 'top')
	expect(await blocks(), 'dropped inside the Card').toEqual(before)

	await selectBlockAt(page, await at('mo-card'))
	await tool('Add all children').click()
	await expect(chosen).toHaveCount(4)
	await selectBlockAt(page, await at('mo-target'))
	await tool('Move after target').click()
	expect(await blocks()).toEqual([
		'mo-top',
		'mo-x',
		'mo-target',
		'mo-card',
		'mo-one',
		'mo-two',
		'mo-mid',
		'mo-end',
	])

	await chooseCardAndMid()
	await selectBlockAt(page, await at('mo-top'))
	await tool('Move before target').click()
	expect(await blocks()).toEqual([
		'mo-card',
		'mo-one',
		'mo-two',
		'mo-mid',
		'mo-top',
		'mo-x',
		'mo-target',
		'mo-end',
	])

	await chooseCardAndMid()
	await selectBlockAt(page, await at('mo-x'))
	await tool('Replace target').click()
	expect(await blocks()).toEqual([
		'mo-top',
		'mo-card',
		'mo-one',
		'mo-two',
		'mo-mid',
		'mo-target',
		'mo-end',
	])

	await chooseCardAndMid()
	// The blocks in the picture that follows the pointer: the last one handed to the browser (the
	// handle hands it the block's own first).
	await page.evaluate(() => {
		const { setDragImage } = DataTransfer.prototype
		DataTransfer.prototype.setDragImage = function (image, x, y) {
			document.body.dataset['dragImage'] = [...image.querySelectorAll('.tiptap > *')]
				.map((block) => block.id)
				.join(' ')
			setDragImage.call(this, image, x, y)
		}
	})
	await drag('mo-card', 'mo-end', 'bottom')
	await expect(page.locator('body')).toHaveAttribute('data-drag-image', 'mo-card mo-mid')
	expect(await blocks()).toEqual([
		'mo-top',
		'mo-target',
		'mo-end',
		'mo-card',
		'mo-one',
		'mo-two',
		'mo-mid',
	])

	// A block inside one that moves, dragged by its own handle, goes on its own, chosen or not.
	await chooseCardAndMid()
	await drag('mo-one', 'mo-target', 'bottom')
	expect(await blocks()).toEqual([
		'mo-top',
		'mo-target',
		'mo-one',
		'mo-end',
		'mo-card',
		'mo-two',
		'mo-mid',
	])

	// A block moves beside the block it's in.
	await tool('Clear selection').click()
	await toggleSelection(page, await at('mo-two'))
	await selectBlockAt(page, await at('mo-card'))
	await expect(tool('Move before target')).toBeEnabled()
	await tool('Move before target').click()
	expect(await blocks()).toEqual([
		'mo-top',
		'mo-target',
		'mo-one',
		'mo-end',
		'mo-two',
		'mo-card',
		'mo-mid',
	])
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
		editor.state.doc.forEach((node) => ids.push(node.attrs['id']))
		return ids.slice(-4)
	})
	expect(order).toEqual(['move-above', 'move-below', 'move-card', 'move-end'])
})

// The editor has no focus during a drag. Given it back, WebKit scrolls to the browser's selection,
// which a drop leaves where the block was, or which can be off the screen (FloatingDragHandle.vue,
// onDragend): the page went to its top or to the cursor.
test('a block dragged by its handle lands where it is let go, and the page stays there', async ({
	page,
}) => {
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const filler = Array.from({ length: 40 }, (_, i) => `<p>Filler ${i}</p>`).join('')
		editor.commands.insertContentAt(
			editor.state.doc.content.size,
			`<p id="stay-a">A</p><p id="stay-b">B</p><p id="stay-c">C</p>${filler}<p id="stay-far">Far</p><p id="stay-end">End</p>`,
		)
	})
	const handle = page.locator('.floating-drag-handle-wrapper')
	const order = () =>
		page.evaluate(() =>
			[...document.querySelectorAll('.tiptap [id^="stay-"]')]
				.map((block) => block.id)
				.join(' '),
		)
	const scrolled = () => page.evaluate(() => Math.round(scrollY))
	// Presses the handle and lets go on a block's bottom edge, so it lands under it, the page first
	// scrolled to it with the button held, as a drag near the window's edge scrolls it; with no
	// block, on the bar at the page's top. Returns where the page was when let go.
	const drag = async (under?: string) => {
		const from = await box(handle)
		await page.mouse.move(from.left + from.width / 2, from.top + from.height / 2)
		await page.mouse.down()
		await page.mouse.move(from.left + 30, from.top + 60, { steps: 5 })
		if (under) {
			const target = page.locator(`#${under}`)
			await target.evaluate((block) => block.scrollIntoView({ block: 'center' }))
			const { left, bottom } = await box(target)
			await page.mouse.move(left + 20, bottom - 2, { steps: 5 })
		} else {
			const bar = await box(page.locator('.editor-top-bar'))
			await page.mouse.move(bar.left + bar.width / 2, bar.top + bar.height / 2, { steps: 5 })
		}
		const letGo = await scrolled()
		await page.mouse.up()
		await settle(page)
		return letGo
	}
	// The cursor in End, off the screen, and the handle on a block the pointer is over.
	const cursorAwayAndHover = async (id: string) => {
		await page.evaluate(
			(at) =>
				document
					.querySelector<TiptapEditorHTMLElement>('.tiptap')!
					.editor!.chain()
					.setTextSelection(at + 1)
					.focus(undefined, { scrollIntoView: false })
					.run(),
			await nodePosition(page, 'stay-end'),
		)
		const block = page.locator(`#${id}`)
		await block.evaluate((el) => el.scrollIntoView({ block: 'center' }))
		await block.hover({ position: { x: 5, y: 5 } })
		await expect
			.poll(async () => Math.round((await box(block)).top - (await box(handle)).bottom))
			.toBe(10)
	}

	await selectBlock(page, 'stay-a')
	let letGo = await drag('stay-b')
	expect(await order(), 'a short drag').toBe('stay-b stay-a stay-c stay-far stay-end')
	expect(await scrolled(), 'a short drag').toBe(letGo)

	// Up the page: a block taken from above the screen would change how far the page is scrolled in
	// Chrome, which keeps what's on the screen where it was.
	await selectBlock(page, 'stay-far')
	letGo = await drag('stay-a')
	expect(await order(), 'a long drag').toBe('stay-b stay-a stay-far stay-c stay-end')
	expect(await scrolled(), 'a long drag').toBe(letGo)

	await cursorAwayAndHover('stay-b')
	letGo = await drag('stay-c')
	expect(await order(), 'the cursor off the screen').toBe(
		'stay-a stay-far stay-c stay-b stay-end',
	)
	expect(await scrolled(), 'the cursor off the screen').toBe(letGo)

	// Let go outside the page's text: nothing moves, and the block dragged is selected, as a block
	// dropped is.
	await cursorAwayAndHover('stay-c')
	letGo = await drag()
	expect(await order(), 'let go outside').toBe('stay-a stay-far stay-c stay-b stay-end')
	expect(await scrolled(), 'let go outside').toBe(letGo)
	const selected = await page.evaluate(() => {
		const { selection } =
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		return 'node' in selection ? (selection as NodeSelection).node.attrs['id'] : null
	})
	expect(selected).toBe('stay-c')
})

/**
 * The page from the block with this id on: each block's type and id (or a line's text, without
 * one), and what it holds, `ul#a[li#b[p#c]] p"No id"`.
 */
const shapeFrom = (page: Page, id: string) =>
	page.evaluate((id) => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const short: Record<string, string> = {
			bulletList: 'ul',
			listItem: 'li',
			taskList: 'tasks',
			taskItem: 'task',
			paragraph: 'p',
			heading: 'h',
			blockquote: 'quote',
		}
		const shape = (node: ProseMirrorNode): string => {
			const own =
				(short[node.type.name] ?? node.type.name)
				+ (node.attrs['id'] ? `#${node.attrs['id']}` : '')
			if (node.isTextblock) return node.attrs['id'] ? own : `${own}"${node.textContent}"`
			const held: string[] = []
			node.forEach((child) => held.push(shape(child)))
			return held.length ? `${own}[${held.join(' ')}]` : own
		}
		const shapes: string[] = []
		editor.state.doc.forEach((node) => {
			if (shapes.length || node.attrs['id'] === id) shapes.push(shape(node))
		})
		return shapes.join(' ')
	}, id)
/** The id of the block selected whole, if one is. */
const selectedId = (page: Page) =>
	page.evaluate(() => {
		const { selection } =
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		return 'node' in selection
			? ((selection as NodeSelection).node.attrs['id'] as string)
			: null
	})

// The page decides what a block may hold. A block let go where it isn't allowed was forced in:
// the block there was split or given an empty line. It goes beside the nearest block around that
// holds it, at the end nearer the drop, or in a new list, as ProseMirror's own drop does; and it's
// selected, which kept WebKit from scrolling to where it was (multiSelect.ts, whereBlocksGo).
test('a block let go where it is not allowed goes beside the nearest block that holds it', async ({
	page,
}) => {
	await insertAtEnd(
		page,
		'<p id="fit-p">Para</p>'
			+ '<ul id="fit-ul"><li id="fit-1"><p id="fit-1p">One</p></li><li id="fit-2"><p id="fit-2p">Two</p></li><li id="fit-3"><p id="fit-3p">Three</p></li></ul>'
			+ '<ul data-type="taskList" id="fit-tl"><li data-type="taskItem" data-checked="false" id="fit-t1"><p id="fit-t1p">Task</p></li></ul>'
			+ '<h2 id="fit-h">Heading</h2><p id="fit-end">End</p>',
	)
	const tasks = 'tasks#fit-tl[task#fit-t1[p#fit-t1p]]'
	const chosen = page.locator('.tiptap .sf-on-selected')
	// The block's handle, let go on the top or bottom edge of another. Returns where the page's first
	// block was on the screen as the drag began.
	const dragOnto = async (id: string, onto: string, edge: 'top' | 'bottom') => {
		await selectBlock(page, id)
		const { top } = await box(page.locator('#fit-p'))
		const target = page.locator(`#${onto}`)
		const { height } = await box(target)
		await page.locator('.floating-drag-handle-wrapper').dragTo(target, {
			targetPosition: { x: 20, y: edge === 'top' ? 2 : height - 2 },
		})
		await settle(page)
		return top
	}

	await dragOnto('fit-1', 'fit-3p', 'top')
	expect(await shapeFrom(page, 'fit-p'), 'an item on the top of an item').toBe(
		`p#fit-p ul#fit-ul[li#fit-2[p#fit-2p] li#fit-1[p#fit-1p] li#fit-3[p#fit-3p]] ${tasks} h#fit-h p#fit-end`,
	)
	expect(await selectedId(page), 'an item on the top of an item').toBe('fit-1')

	const top = await dragOnto('fit-2', 'fit-3p', 'bottom')
	expect(await shapeFrom(page, 'fit-p'), 'an item on the bottom of an item').toBe(
		`p#fit-p ul#fit-ul[li#fit-1[p#fit-1p] li#fit-3[p#fit-3p] li#fit-2[p#fit-2p]] ${tasks} h#fit-h p#fit-end`,
	)
	expect(await selectedId(page), 'an item on the bottom of an item').toBe('fit-2')
	expect(Math.abs((await box(page.locator('#fit-p'))).top - top)).toBeLessThan(3)

	// An item can't start with a heading: it goes above the list, the end nearer the drop.
	await dragOnto('fit-h', 'fit-1p', 'top')
	expect(await shapeFrom(page, 'fit-p'), "a heading on an item's text").toBe(
		`p#fit-p h#fit-h ul#fit-ul[li#fit-1[p#fit-1p] li#fit-3[p#fit-3p] li#fit-2[p#fit-2p]] ${tasks} p#fit-end`,
	)

	// No list or task holds a bullet item as it is: it goes beside the task list, in a new list.
	await dragOnto('fit-2', 'fit-t1p', 'top')
	expect(await shapeFrom(page, 'fit-p'), "a bullet item on a task's text").toBe(
		`p#fit-p h#fit-h ul#fit-ul[li#fit-1[p#fit-1p] li#fit-3[p#fit-3p]] ul[li#fit-2[p#fit-2p]] ${tasks} p#fit-end`,
	)

	// A paragraph and an item chosen together fit nowhere as they are, nor in one new list: nothing
	// moves, and they stay chosen. (The drop is seen to happen: one that never came would pass too.)
	await toggleSelection(page, await nodePosition(page, 'fit-p'))
	await toggleSelection(page, await nodePosition(page, 'fit-1'))
	const before = await shapeFrom(page, 'fit-p')
	await page.evaluate(() =>
		document.addEventListener(
			'drop',
			() => {
				document.body.dataset['dropped'] = ''
			},
			{ capture: true, once: true },
		),
	)
	await dragOnto('fit-1', 'fit-end', 'top')
	await expect(page.locator('body')).toHaveAttribute('data-dropped', '')
	expect(await shapeFrom(page, 'fit-p'), 'a paragraph and an item').toBe(before)
	await expect(chosen).toHaveCount(2)
})

// Going out of the block it was let go in, a dragged block goes to that block's end nearer the
// drop, where ProseMirror's drop line shows; the Move tools keep the side asked for.
test('a block dragged out of the block it was let go in goes to its end nearer the drop', async ({
	page,
}) => {
	await insertAtEnd(
		page,
		'<p id="ne-top">Top</p><ul id="ne-ul"><li id="ne-pa"><p id="ne-pap">Parent</p>'
			+ '<ul id="ne-kids"><li id="ne-k1"><p id="ne-k1p">Child one</p></li><li id="ne-k2"><p id="ne-k2p">Child two</p></li><li id="ne-k3"><p id="ne-k3p">Child three</p></li></ul></li>'
			+ '<li id="ne-x"><p id="ne-xp">Other</p></li></ul><img id="ne-img" src="/favicon.ico"><p id="ne-end">End</p>',
	)
	const dragOnto = async (id: string, onto: string, edge: 'top' | 'bottom') => {
		await selectBlock(page, id)
		const target = page.locator(`#${onto}`)
		const { height } = await box(target)
		await page.locator('.floating-drag-handle-wrapper').dragTo(target, {
			targetPosition: { x: 20, y: edge === 'top' ? 2 : height - 2 },
		})
		await settle(page)
	}
	const kids = 'ul#ne-kids[li#ne-k1[p#ne-k1p] li#ne-k2[p#ne-k2p] li#ne-k3[p#ne-k3p]]'

	// An item can't hold another as it is: it goes beside the item, above it, its text being at its
	// top.
	await dragOnto('ne-x', 'ne-pap', 'bottom')
	expect(await shapeFrom(page, 'ne-top'), "an item on the bottom of a parent item's text").toBe(
		`p#ne-top ul#ne-ul[li#ne-x[p#ne-xp] li#ne-pa[p#ne-pap ${kids}]] image#ne-img p#ne-end`,
	)

	// An item starts with a line of text: a picture goes beside the list, above it.
	await dragOnto('ne-img', 'ne-xp', 'top')
	expect(await shapeFrom(page, 'ne-top'), "a picture on the top of an item's text").toBe(
		`p#ne-top image#ne-img ul#ne-ul[li#ne-x[p#ne-xp] li#ne-pa[p#ne-pap ${kids}]] p#ne-end`,
	)
})

// The Move tools put blocks as a drag does, on the side asked for, and are greyed out where the
// blocks would go nowhere, or where they already are. Replace only where they fit as they are: in
// a new item, a paragraph put in place of one would become a list item.
test('the Move tools put blocks where they fit, and are greyed out where they would go nowhere', async ({
	page,
}) => {
	await insertAtEnd(
		page,
		'<p id="mv-top">Top</p>'
			+ '<ul id="mv-ul"><li id="mv-1"><p id="mv-1p">One</p><ul id="mv-n"><li id="mv-n1"><p id="mv-n1p">Nested</p></li></ul></li><li id="mv-2"><p id="mv-2p">Two</p></li><li id="mv-3"><p id="mv-3p">Three</p></li></ul>'
			+ '<p id="mv-p">Para</p><p id="mv-end">End</p>',
	)
	const tool = (name: string) => page.locator('.floating-toolbar').getByRole('button', { name })
	const at = (id: string) => nodePosition(page, id)
	const choose = async (ids: string[], target: string) => {
		for (const id of ids) await toggleSelection(page, await at(id))
		await selectBlockAt(page, await at(target))
	}
	const first = 'li#mv-1[p#mv-1p ul#mv-n[li#mv-n1[p#mv-n1p]]]'

	await choose(['mv-3'], 'mv-1p')
	await tool('Move after target').click()
	expect(
		await shapeFrom(page, 'mv-top'),
		'Move after the text of an item that holds a list',
	).toBe(`p#mv-top ul#mv-ul[${first} li#mv-3[p#mv-3p] li#mv-2[p#mv-2p]] p#mv-p p#mv-end`)

	await choose(['mv-p'], 'mv-2')
	await tool('Move before target').click()
	expect(await shapeFrom(page, 'mv-top'), 'a paragraph, Move before an item').toBe(
		`p#mv-top p#mv-p ul#mv-ul[${first} li#mv-3[p#mv-3p] li#mv-2[p#mv-2p]] p#mv-end`,
	)

	await choose(['mv-p'], 'mv-2')
	await expect(tool('Replace target'), 'a paragraph in place of an item').toBeDisabled()
	await toggleSelection(page, await at('mv-3'))
	await selectBlockAt(page, await at('mv-end'))
	for (const name of ['Move before target', 'Move after target'])
		await expect(tool(name), `${name}, a paragraph and an item`).toBeDisabled()
	await tool('Clear selection').click()

	await choose(['mv-1p'], 'mv-n')
	await expect(tool('Move before target'), 'where the block already is').toBeDisabled()
	await tool('Clear selection').click()

	// The fit is that of the page with the blocks taken out: an item's first line, moved with a
	// heading to before its second, would leave the item starting with the heading.
	await insertAtEnd(
		page,
		'<h3 id="mv-h">Heading</h3><ul id="mv-two"><li id="mv-t"><p id="mv-t1">First line</p><p id="mv-t2">Second line</p></li></ul><p id="mv-last">Last</p>',
	)
	await choose(['mv-h', 'mv-t1'], 'mv-t2')
	await expect(tool('Replace target'), "a heading and an item's first line").toBeDisabled()
	await tool('Move before target').click()
	expect(await shapeFrom(page, 'mv-end'), "a heading and an item's first line").toBe(
		'p#mv-end h#mv-h p#mv-t1 ul#mv-two[li#mv-t[p#mv-t2]] p#mv-last',
	)
})

// The Delete key takes a list or quote left empty with the block (ProseMirror's deleteRange);
// "Delete selected" left an empty item. A block inside a chosen one goes with its block: deleted
// first, it took its emptied block, then the block after it in its place.
test('Delete selected takes blocks out as the Delete key does', async ({ page }) => {
	await insertAtEnd(
		page,
		'<p id="dl-top">Top</p><ul id="dl-ul"><li id="dl-solo"><p>Solo</p></li></ul>'
			+ '<blockquote id="dl-q"><p id="dl-qp">Quote</p></blockquote><p id="dl-next">Next</p><p id="dl-end">End</p>',
	)
	const press = (name: string) =>
		page.locator('.floating-toolbar').getByRole('button', { name }).click()

	await toggleSelection(page, await nodePosition(page, 'dl-solo'))
	await press('Delete selected')
	expect(await shapeFrom(page, 'dl-top'), "a list's only item").toBe(
		'p#dl-top quote#dl-q[p#dl-qp] p#dl-next p#dl-end',
	)

	await toggleSelection(page, await nodePosition(page, 'dl-q'))
	await toggleSelection(page, await nodePosition(page, 'dl-qp'))
	await press('Delete selected')
	expect(await shapeFrom(page, 'dl-top'), 'a quote and its only line').toBe(
		'p#dl-top p#dl-next p#dl-end',
	)
})

// Wrap selection puts the chosen blocks in the new block, where the first was, and a block between
// them not chosen stays, after it, with the cursor in it. It was deleted: everything from the first
// to the last went.
test('Wrap selection keeps the blocks between the chosen ones', async ({ page }) => {
	// Outside the undo history: put in just before, it would undo with the wrap.
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor
			.chain()
			.setMeta('addToHistory', false)
			.insertContentAt(
				editor.state.doc.content.size,
				'<p id="wr-top">Top</p><p id="wr-a">A</p><p id="wr-b">B</p><p id="wr-c">C</p><p id="wr-end">End</p>',
			)
			.run()
	})
	const card = '1e4d245a-16ac-4e60-96e9-1cf4ff6e2b93'
	const chosen = page.locator('.tiptap .sf-on-selected')
	// Chooses the blocks, puts the selection somewhere, and wraps them in a Card.
	const wrapInCard = async (ids: string[], select: () => Promise<unknown>) => {
		for (const id of ids) await toggleSelection(page, await nodePosition(page, id))
		await select()
		const menu = await openMenu(page, 'wrap_text')
		await menu.locator('.picker-item', { hasText: 'layout-card' }).click()
		await settle(page)
	}
	const undo = async () => {
		await page.locator('.floating-toolbar').getByRole('button', { name: 'Undo' }).click()
		await settle(page)
		expect(await shapeFrom(page, 'wr-top'), 'undone').toBe(
			'p#wr-top p#wr-a p#wr-b p#wr-c p#wr-end',
		)
	}

	await wrapInCard(['wr-a', 'wr-c'], () => cursorAt(page, 'wr-b', 1))
	expect(await shapeFrom(page, 'wr-top'), 'a block between not chosen').toBe(
		`p#wr-top ${card}[p#wr-a p#wr-c] p#wr-b p#wr-end`,
	)
	expect(await selectedPlace(page), 'the cursor in it').toBe('wr-b at 1')
	await expect(chosen).toHaveCount(0)
	await undo()
	await wrapInCard(['wr-a', 'wr-c'], () => selectBlock(page, 'wr-b'))
	expect(await selectedPlace(page), 'it selected').toBe('#wr-b selected')
	await undo()

	// A selection on the first chosen block goes into the new block.
	await wrapInCard(['wr-a', 'wr-b'], () => selectBlock(page, 'wr-a'))
	expect(await shapeFrom(page, 'wr-top'), 'blocks side by side').toBe(
		`p#wr-top ${card}[p#wr-a p#wr-b] p#wr-c p#wr-end`,
	)
	expect(await selectedPlace(page), 'the first selected').toBe('wr-a at 0')
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
		return 'node' in selection ? (selection as NodeSelection).node.attrs['id'] : null
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

// A row added and left empty sets nothing, so it goes when the panel closes: here as another block
// is selected.
test("the Attributes panel's empty added row goes when the panel closes", async ({ page }) => {
	const openPanel = async () => {
		const tune = page.locator('.floating-toolbar button:has(span:text-is("tune"))')
		await tune.click()
		const panel = page.locator(`#${await tune.getAttribute('popovertarget')}`)
		await expect(panel).toBeVisible()
		return panel
	}
	await selectBlock(page, 'c1-card')
	const panel = await openPanel()
	await panel.getByRole('button', { name: 'add style', exact: true }).click()
	await expect(panel.getByRole('button', { name: 'Remove style', exact: true })).toBeVisible()
	await selectBlock(page, 'divide-card')
	await expect(panel).toBeHidden()
	await selectBlock(page, 'c1-card')
	const again = await openPanel()
	await expect(again.getByRole('button', { name: 'add style', exact: true })).toBeVisible()
	await expect(again.getByRole('button', { name: 'Remove style', exact: true })).toHaveCount(0)
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

// A block goes by the name the node path shows: a custom block by its alias (the tag the code view
// shows), never its ID; a built-in one by its type's name.
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
		await expect(rows).toHaveCount(0)
		return names
	}
	await selectBlock(page, 'c1-card')
	const wrapIn = await picker('frame_source')
	expect(wrapIn).toContain('layout-stack')
	expect(wrapIn.filter((name) => /^[0-9a-f]{8}-/.test(name))).toEqual([])

	// Words selected in a line, in view: what can wrap them there.
	await page.evaluate(
		(at) => {
			document.getElementById('inset-first')!.scrollIntoView({ block: 'center' })
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor
				.chain()
				.focus()
				.setTextSelection({ from: at + 1, to: at + 7 })
				.run()
		},
		await nodePosition(page, 'inset-first'),
	)
	expect(await picker('frame_source')).toEqual(['span'])

	// The to-do list, as its node-path crumb selects it, in view.
	await page.evaluate(
		(at) => {
			document.getElementById('task-plain')!.scrollIntoView({ block: 'center' })
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setNodeSelection(editor.state.doc.resolve(at).before()).run()
		},
		await nodePosition(page, 'task-plain'),
	)
	expect(await picker('add')).toEqual(['taskItem'])
})

// Its button leaves the keys on the page, where the editor takes Escape for itself.
test('Escape closes a toolbar panel opened from its button', async ({ page }) => {
	await selectBlock(page, 'c1-card')
	const panel = await openMenu(page, 'frame_source')
	await expect(panel).toBeVisible()
	await expect(page.locator('.tiptap')).toBeFocused()
	await page.keyboard.press('Escape')
	await expect(panel).toBeHidden()
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
	await selectBlock(page, 'task-plain')
	await page
		.locator('.floating-toolbar')
		.getByRole('button', { name: /^Attributes/ })
		.click()
	const panel = page.locator('.toolbar-panel:popover-open')
	await panel.getByRole('button', { name: 'add class' }).click()
	const field = panel.getByLabel('class', { exact: true })
	await field.fill('sf-depth-1')
	await field.press('Enter')
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

// A picture has no content: one pasted over a chosen one is written in its place, which its
// position alone counts as deleting it (multiSelect.ts, changedInPlace). It stays chosen.
test('a picture pasted over a chosen one stays chosen', async ({ page }) => {
	await toggleSelection(page, await nodePosition(page, 'center-picture'))
	await selectBlock(page, 'shape-picture')
	await page.keyboard.press('ControlOrMeta+c')
	await selectBlock(page, 'center-picture')
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	await expect(page.locator('.tiptap #center-picture')).toHaveCount(0)
	// The copy goes without the id the page has, so it's found by its class.
	const chosenPicture = page.locator('.tiptap img.sf-on-selected')
	await expect(chosenPicture).toHaveCount(1)
	await expect(chosenPicture).toHaveClass(/(^|\s)sl-aspect-16-9(\s|$)/)
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

const insertAtEnd = (page: Page, html: string) =>
	page.evaluate((html) => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.commands.insertContentAt(editor.state.doc.content.size, html)
	}, html)
/**
 * The cursor this far into the text of the block with this id, or the text selected from there to
 * this far into another's. Returns the index on the page of the block it starts in (for an item,
 * its list).
 */
const cursorAt = (page: Page, id: string, offset: number, to?: [id: string, offset: number]) =>
	page.evaluate(
		([from, to]) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			const at = ([
				id,
				offset,
			]: readonly [
				string,
				number,
			]) => {
				let found = -1
				editor.state.doc.descendants((node, pos) => {
					if (node.attrs?.['id'] === id) found = pos + 1 + offset
				})
				return found
			}
			editor
				.chain()
				.focus()
				.setTextSelection(to ? { from: at(from), to: at(to) } : at(from))
				.run()
			return editor.state.doc.resolve(at(from)).index(0)
		},
		[[id, offset], to] as const,
	)
/**
 * The two blocks Enter made from the block at this index on the page, or a list's two items unless
 * the list was split: which of the id, the class `lead`, the style and the tick each has, then its
 * text.
 */
const madeAt = (page: Page, index: number, listSplit = false) =>
	page.evaluate(
		([index, listSplit]) => {
			const doc =
				document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state.doc
			const has = (node: ProseMirrorNode) => {
				const name =
					{ paragraph: 'p', heading: 'h2', bulletList: 'ul', taskList: 'ul' }[
						node.type.name
					] ?? 'li'
				const what = [
					node.attrs['id'] && 'id',
					/(^|\s)lead(\s|$)/.test(node.attrs['class'] ?? '') && 'class',
					node.attrs['style'] && 'style',
					node.attrs['checked'] && 'ticked',
				].filter(Boolean)
				return what.length ? `${name}: ${what.join(' ')}` : name
			}
			const describe = (node: ProseMirrorNode): string =>
				node.isTextblock
					? `${has(node)} "${node.textContent}"`
					: `${has(node)}, ${describe(node.firstChild!)}`
			const block = doc.child(index)
			const two =
				block.type.name.endsWith('List') && !listSplit
					? [block.child(0), block.child(1)]
					: [block, doc.child(index + 1)]
			return two.map(describe)
		},
		[index, listSplit] as const,
	)
const own = 'class="lead" style="color: red"'

// Enter splits a block in two: the block it was pressed in keeps everything, and the new one gets
// the class and style, not the id. In the middle and at the start, TipTap copies the whole block
// (patches/@tiptap__core@3.32.0.patch). An item and the paragraph in it each split so.
test('Enter leaves everything on the block it was pressed in, and gives the new one the class and style', async ({
	page,
}) => {
	const blocks = {
		Paragraph: {
			html: (id: string) => `<p id="${id}" ${own}>Our story</p>`,
			end: ['p: id class style "Our story"', 'p: class style ""'],
			middle: ['p: id class style "Our"', 'p: class style " story"'],
			start: ['p: class style ""', 'p: id class style "Our story"'],
		},
		Heading: {
			html: (id: string) => `<h2 id="${id}" ${own}>Our story</h2>`,
			end: ['h2: id class style "Our story"', 'p: class style ""'],
			middle: ['h2: id class style "Our"', 'h2: class style " story"'],
			start: ['p: class style ""', 'h2: id class style "Our story"'],
		},
		'List item': {
			html: (id: string) =>
				`<ul><li id="${id}-item" ${own}><p id="${id}" ${own}>Our story</p></li></ul>`,
			end: [
				'li: id class style, p: id class style "Our story"',
				'li: class style, p: class style ""',
			],
			middle: [
				'li: id class style, p: id class style "Our"',
				'li: class style, p: class style " story"',
			],
			start: [
				'li: class style, p: class style ""',
				'li: id class style, p: id class style "Our story"',
			],
		},
		'To-do item': {
			html: (id: string) =>
				`<ul data-type="taskList"><li data-type="taskItem" data-checked="true" id="${id}-item" ${own}><p id="${id}" ${own}>Our story</p></li></ul>`,
			end: [
				'li: id class style ticked, p: id class style "Our story"',
				'li: class style, p: class style ""',
			],
			middle: [
				'li: id class style ticked, p: id class style "Our"',
				'li: class style, p: class style " story"',
			],
			start: [
				'li: class style, p: class style ""',
				'li: id class style ticked, p: id class style "Our story"',
			],
		},
	}
	const offsets = { end: 'Our story'.length, middle: 3, start: 0 }
	const cases = Object.entries(blocks).flatMap(([kind, block]) =>
		(['end', 'middle', 'start'] as const).map((place) => ({
			kind,
			place,
			id: `enter-${kind.replace(/\W/g, '')}-${place}`,
			html: block.html,
			made: block[place],
		})),
	)
	await insertAtEnd(page, cases.map(({ id, html }) => html(id)).join(''))
	for (const { kind, place, id, made } of cases) {
		const index = await cursorAt(page, id, offsets[place])
		await page.keyboard.press('Enter')
		await settle(page)
		expect.soft(await madeAt(page, index), `${kind}, ${place}`).toEqual(made)
	}
})

// With text selected, Enter splits the block the cursor is left in once the text is gone: from the
// start of one block into the next, the first goes. With an item selected, its list splits before
// it. TipTap reads the block the selection started in, and copies a list whole
// (patches/@tiptap__core@3.32.0.patch).
test('Enter with text or an item selected gives the new block the class and style too', async ({
	page,
}) => {
	await insertAtEnd(
		page,
		`<h2 id="enter-selected-first">Alpha one</h2><p id="enter-selected" ${own}>Bravo two</p>`,
	)
	const index = await cursorAt(page, 'enter-selected-first', 0, ['enter-selected', 5])
	await page.keyboard.press('Enter')
	await settle(page)
	expect.soft(await madeAt(page, index), 'text selected').toEqual([
		'p: class style ""',
		'p: id class style " two"',
	])

	await insertAtEnd(
		page,
		`<ul id="enter-list" ${own}><li><p>One</p></li><li id="enter-item"><p>Two</p></li></ul>`,
	)
	const list = await page.evaluate(
		(at) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setNodeSelection(at).run()
			return editor.state.doc.resolve(at).index(0)
		},
		await nodePosition(page, 'enter-item'),
	)
	await page.keyboard.press('Enter')
	await settle(page)
	expect.soft(await madeAt(page, list, true), 'an item selected').toEqual([
		'ul: id class style, li, p "One"',
		'ul: class style, li: id, p "Two"',
	])
})

// A paragraph that Enter leaves as it is adds no change of its own, so typing after Enter at its
// start undoes with it, as with TipTap's own Enter (patches/@tiptap__core@3.32.0.patch).
test('Enter at the start of a paragraph and typing after it undo together', async ({ page }) => {
	// Outside the undo history: put in just before, it would undo with them.
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor
			.chain()
			.setMeta('addToHistory', false)
			.insertContentAt(editor.state.doc.content.size, '<p>Our story</p>')
			.run()
	})
	const content = () =>
		page.evaluate(() =>
			JSON.stringify(
				document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.getJSON(),
			),
		)
	const before = await content()
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const { doc } = editor.state
		editor
			.chain()
			.focus()
			.setTextSelection(doc.content.size - doc.lastChild!.nodeSize + 1)
			.run()
	})
	await page.keyboard.press('Enter')
	await page.keyboard.type('X')
	await page.keyboard.press('ControlOrMeta+z')
	await settle(page)
	expect(await content()).toBe(before)
})

// Enter on an empty line at the end of a nested list moves it out a level, with what it has.
// TipTap makes it anew, with nothing on it (patches/@tiptap__core@3.32.0.patch). When the line has
// text above it in its item, the item stays, and the one out a level is new: it gets the class and
// style. A heading there comes out as a paragraph, as an item starts with one.
test('an empty line at the end of a nested list keeps its own when Enter moves it out a level', async ({
	page,
}) => {
	const lists = {
		'Last item': {
			html: (id: string) =>
				`<ul><li><p>Outer</p><ul><li><p>Inner</p></li><li id="${id}-item" ${own}><p id="${id}" ${own}></p></li></ul></li></ul>`,
			made: ['li, p "Outer"', 'li: id class style, p: id class style ""'],
		},
		'Only item': {
			html: (id: string) =>
				`<ul><li><p>Outer</p><ul><li id="${id}-item" ${own}><p id="${id}" ${own}></p></li></ul></li></ul>`,
			made: ['li, p "Outer"', 'li: id class style, p: id class style ""'],
		},
		'Last to-do item': {
			html: (id: string) =>
				`<ul data-type="taskList"><li data-type="taskItem"><p>Outer</p><ul data-type="taskList"><li data-type="taskItem"><p>Inner</p></li><li data-type="taskItem" data-checked="true" id="${id}-item" ${own}><p id="${id}" ${own}></p></li></ul></li></ul>`,
			made: ['li, p "Outer"', 'li: id class style ticked, p: id class style ""'],
		},
		'Heading after the text of an item': {
			html: (id: string) =>
				`<ul><li><p>Outer</p><ul><li id="${id}-item" ${own}><p>Inner</p><h2 id="${id}" ${own}></h2></li></ul></li></ul>`,
			made: ['li, p "Outer"', 'li: class style, p: id class style ""'],
		},
	}
	for (const [kind, { html, made }] of Object.entries(lists)) {
		const id = `moved-${kind.replace(/\W/g, '')}`
		await insertAtEnd(page, html(id))
		const index = await cursorAt(page, id, 0)
		await page.keyboard.press('Enter')
		await settle(page)
		expect.soft(await madeAt(page, index), kind).toEqual(made)
	}
})

/** The blocks with this id, in page order: where each is, its type and its text. */
const withId = (page: Page, id: string) =>
	page.evaluate((id) => {
		const found: { at: number; type: string; text: string }[] = []
		document
			.querySelector<TiptapEditorHTMLElement>('.tiptap')!
			.editor!.state.doc.descendants((node, at) => {
				if (node.attrs['id'] === id)
					found.push({ at, type: node.type.name, text: node.textContent })
			})
		return found
	}, id)
const textsWithId = async (page: Page, id: string) =>
	(await withId(page, id)).map(({ text }) => text)
/** How many blocks on the page are of the type and text of the one with this id. */
const copiesOf = (page: Page, id: string) =>
	page.evaluate((id) => {
		const { doc } = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		let copied: ProseMirrorNode | undefined
		doc.descendants((node) => {
			if (node.attrs['id'] === id) copied ??= node
		})
		let count = 0
		doc.descendants((node) => {
			if (node.type === copied!.type && node.textContent === copied!.textContent) count++
		})
		return count
	}, id)
/** Selects the block with this id, copies it, and pastes it at the end of the page. */
const pasteCopy = async (page: Page, id: string, cut = false) => {
	await page.evaluate(
		(at) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setNodeSelection(at).run()
		},
		(await withId(page, id))[0]!.at,
	)
	await page.keyboard.press(cut ? 'ControlOrMeta+x' : 'ControlOrMeta+c')
	await page.evaluate(() =>
		document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.commands.focus('end'),
	)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
}
/** cursorAt, with the block scrolled to the middle of the screen, so its toolbar is in view. */
const cursorInView = async (page: Page, id: string, offset: number) => {
	await page
		.locator(`.tiptap #${id}`)
		.last()
		.evaluate((el) => el.scrollIntoView({ block: 'center' }))
	return cursorAt(page, id, offset)
}
/** Drags the block with this id by its handle to just under another, Alt held for a copy. */
const dragUnder = async (page: Page, id: string, under: string, copy = false) => {
	await selectBlock(page, id)
	const target = page.locator(`#${under}`)
	const { height } = await box(target)
	if (copy) await page.keyboard.down('Alt')
	await page.locator('.floating-drag-handle-wrapper').dragTo(target, {
		targetPosition: { x: 20, y: height - 2 },
	})
	if (copy) await page.keyboard.up('Alt')
	await settle(page)
}

// An id is for one block: a copy goes without an id the page has, and the block copied keeps it
// (allowAttributesExtension.ts).
test('a copy goes without an id the page has', async ({ page }) => {
	await insertAtEnd(
		page,
		'<p id="copy-p">Copy me</p>'
			+ '<layout-card id="copy-card" class="sf-size-md"><p id="copy-card-p">In the Card</p></layout-card>'
			+ '<table id="copy-table"><tbody><tr><td id="copy-cell"><p>Cell</p></td></tr></tbody></table>'
			+ '<ul data-type="taskList" id="copy-list"><li data-type="taskItem" id="copy-item"><p>To do</p></li></ul>'
			+ '<p id="drop-p">Drop me</p><p id="drop-a">Drop A</p><p id="drop-b">Drop B</p>'
			+ '<p id="drop-under">Under this</p>'
			+ '<p id="pasted-had">Here already</p><p id="paste-into">Here</p>'
			+ '<p id="twin">First</p><p id="twin">Second</p>',
	)
	const blocks = {
		'a paragraph': ['copy-p'],
		'a Card': ['copy-card', 'copy-card-p'],
		'a table': ['copy-table', 'copy-cell'],
		'a to-do list': ['copy-list', 'copy-item'],
	}
	for (const [kind, ids] of Object.entries(blocks)) {
		const before = await Promise.all(ids.map((id) => withId(page, id)))
		await pasteCopy(page, ids[0]!)
		expect.soft(await copiesOf(page, ids[0]!), `${kind}, pasted`).toBe(2)
		for (const [i, id] of ids.entries())
			expect.soft(await withId(page, id), `${kind}: ${id}`).toEqual(before[i])
	}

	const dropped = await withId(page, 'drop-p')
	await dragUnder(page, 'drop-p', 'drop-under', true)
	expect.soft(await copiesOf(page, 'drop-p'), 'a copy dropped').toBe(2)
	expect.soft(await withId(page, 'drop-p'), 'a copy dropped: drop-p').toEqual(dropped)

	const both = await Promise.all(['drop-a', 'drop-b'].map((id) => withId(page, id)))
	for (const found of both) await toggleSelection(page, found[0]!.at)
	await dragUnder(page, 'drop-a', 'drop-under', true)
	for (const [i, id] of ['drop-a', 'drop-b'].entries()) {
		expect.soft(await copiesOf(page, id), `two copied together: ${id}`).toBe(2)
		expect.soft(await withId(page, id), `two copied together: ${id}`).toEqual(both[i])
	}

	// Copied from another page, as a person selects it.
	await page.evaluate(() => {
		const elsewhere = document.createElement('div')
		elsewhere.id = 'elsewhere'
		elsewhere.innerHTML =
			'<p id="pasted-first">One</p><p id="pasted-new">Two</p><p id="pasted-had">Three</p>'
		document.body.append(elsewhere)
		getSelection()!.selectAllChildren(elsewhere)
	})
	await page.keyboard.press('ControlOrMeta+c')
	await page.locator('#elsewhere').evaluate((el) => el.remove())
	const had = await withId(page, 'pasted-had')
	await cursorAt(page, 'paste-into', 2)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	// The first block joins the line at the cursor, which keeps its own.
	expect.soft(await textsWithId(page, 'pasted-first'), 'from elsewhere: the first').toEqual([])
	expect.soft(await textsWithId(page, 'pasted-new'), 'from elsewhere: a new id').toEqual(['Two'])
	expect.soft(await withId(page, 'pasted-had'), 'from elsewhere: an id the page has').toEqual(had)

	// Two blocks the author gave one id: one cut and pasted is a copy of the one left.
	await pasteCopy(page, 'twin', true)
	expect.soft(await textsWithId(page, 'twin'), 'one of two with an id, cut and pasted').toEqual([
		'Second',
	])
	await expect.soft(page.locator('.tiptap p:not([id])', { hasText: /^First$/ })).toHaveCount(1)
})

// What's cut or moved isn't a copy: no block already there has its id.
test('a block cut and pasted, or moved, keeps its id', async ({ page }) => {
	await insertAtEnd(
		page,
		'<p id="cut-p">Cut me</p><p id="cut-text">Cut my text</p>'
			+ '<p id="move-p">Move me</p><p id="move-under">Under this</p><p>End</p>',
	)
	await pasteCopy(page, 'cut-p', true)
	expect.soft(await textsWithId(page, 'cut-p'), 'a block cut and pasted').toEqual(['Cut me'])

	// Its text alone: the line it leaves keeps the id, and the text pasted into an empty line
	// takes that line's.
	await page.evaluate(
		([at, size]) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor
				.chain()
				.focus()
				.setTextSelection({ from: at + 1, to: at + 1 + size })
				.run()
		},
		[(await withId(page, 'cut-text'))[0]!.at, 'Cut my text'.length] as const,
	)
	await page.keyboard.press('ControlOrMeta+x')
	await page.evaluate(() =>
		document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.commands.focus('end'),
	)
	await page.keyboard.press('Enter')
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect.soft(await textsWithId(page, 'cut-text'), "a block's text cut and pasted").toEqual([''])
	await expect
		.soft(page.locator('.tiptap p:not([id])', { hasText: /^Cut my text$/ }))
		.toHaveCount(1)

	await dragUnder(page, 'move-p', 'move-under')
	const [moved] = await withId(page, 'move-p')
	expect.soft(moved?.text, 'a block moved').toBe('Move me')
	expect
		.soft(moved?.at, 'a block moved, under')
		.toBeGreaterThan((await withId(page, 'move-under'))[0]!.at)
})

// The lines copied from, then a dash, the line pasted into, a dash (pastedShape reads between).
const copySources =
	'<h2 id="sh" class="sh-c" style="color: red">Heading text</h2>'
	+ '<pre id="sc" class="sc-c"><code>code one\ncode two</code></pre>'
	+ '<p id="sp0" class="p0-c">para zero</p>'
	+ '<ul id="sl" class="sl-c"><li id="sl1" class="li1-c"><p>item one</p></li><li id="sl2" class="li2-c"><p>item two</p></li><li id="sl3"><p>item three</p></li></ul>'
	+ '<blockquote id="sq" class="sq-c"><p id="sqp">quote text</p></blockquote>'
	+ '<p id="sp1" class="p1-c">para one</p><p id="sp2" class="p2-c" style="color: blue">para two</p>'
	+ '<ul data-type="taskList" id="st"><li data-type="taskItem" data-checked="true" id="st1"><p>todo text</p></li></ul>'
	+ '<p id="sp3">before</p><img id="si" src="/no-picture.png"><p id="sp4">after the picture</p>'
	+ '<table><tbody><tr><td id="sc1"><p>one</p></td><td><p>cell two</p></td></tr></tbody></table>'
	+ '<p id="sp5">after</p><p id="sp6">x words **bold** y</p>'
/** The page as the copy sources and this line to paste into, outside the undo history. */
const pasteInto = (page: Page, html: string, sources = copySources) =>
	page.evaluate((html) => {
		document
			.querySelector<TiptapEditorHTMLElement>('.tiptap')!
			.editor!.chain()
			.setMeta('addToHistory', false)
			.setContent(html)
			.run()
	}, `${sources}<p id="dash-1">—</p>${html}<p id="dash-2">—</p>`)
/** The position this far into the first line of the block with this id. */
const linePosition = (page: Page, id: string, offset: number) =>
	page.evaluate(
		([id, offset]) => {
			const { doc } =
				document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
			let found = -1
			doc.descendants((node, pos) => {
				if (found >= 0) return false
				if (node.attrs['id'] !== id) return true
				if (node.isTextblock) found = pos + 1 + offset
				else
					node.descendants((line, at) => {
						if (found < 0 && line.isTextblock) found = pos + 1 + at + 1 + offset
					})
				return true
			})
			return found
		},
		[id, offset] as const,
	)
const selectText = (page: Page, from: number, to = from) =>
	page.evaluate(
		([from, to]) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setTextSelection({ from, to }).run()
		},
		[from, to] as const,
	)
/**
 * The blocks between the dashes: each one's type, id, class, style and a to-do item's tick (+), a
 * line's text (⏎ for a line break), and what it holds: `ul#a.c[li[p "Text"]] p{color: red} "Line"`.
 */
const pastedShape = (page: Page) =>
	page.evaluate(() => {
		const { doc } = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		const short: Record<string, string> = {
			paragraph: 'p',
			listItem: 'li',
			bulletList: 'ul',
			taskList: 'todo',
			taskItem: 'ti',
			blockquote: 'quote',
			codeBlock: 'code',
		}
		const shape = (node: ProseMirrorNode): string => {
			const { id, class: name, style, level, checked } = node.attrs
			const own =
				(node.type.name === 'heading'
					? `h${level}`
					: (short[node.type.name] ?? node.type.name))
				+ (id ? `#${id}` : '')
				+ (name ? `.${name}` : '')
				+ (style ? `{${String(style).replace(/;$/, '')}}` : '')
				+ (checked ? '+' : '')
			if (node.isTextblock) return `${own} "${node.textContent.replace(/\n/g, '⏎')}"`
			const held: string[] = []
			node.forEach((child) => held.push(shape(child)))
			return `${own}[${held.join(' ')}]`
		}
		const shapes: string[] = []
		let between = false
		doc.forEach((node) => {
			if (node.attrs['id'] === 'dash-2') between = false
			if (between) shapes.push(shape(node))
			if (node.attrs['id'] === 'dash-1') between = true
		})
		return shapes.join(' ')
	})

// What a copy holds and where it goes (copyAndPaste.ts). Text from inside one line is its text, and
// joins the line it lands in, which keeps its kind and settings: ProseMirror copied the line around
// it, which made a line it was pasted at the start of, or an empty one, a heading, a list or a quote.
// Copied lines go in as they were: inside a line, it splits as Enter splits it, the second half
// with the line's class and style, not the copied line's; in a list each line becomes an item.
test('pasted text joins the line, and pasted lines go in as Enter would split it', async ({
	page,
}) => {
	const line = 'p#tp.tp-c{margin-top: 4px}'
	const lineMade = 'p.tp-c{margin-top: 4px}'
	const blue = 'p.p2-c{color: blue}'
	const card = '1e4d245a-16ac-4e60-96e9-1cf4ff6e2b93'
	const items12 = 'li.li1-c[p "item one"] li.li2-c[p "item two"]'
	const places = {
		'line start': ['<p id="tp" class="tp-c" style="margin-top: 4px">Target line</p>', 'tp', 0],
		'line middle': ['<p id="tp" class="tp-c" style="margin-top: 4px">Target line</p>', 'tp', 7],
		'line end': ['<p id="tp" class="tp-c" style="margin-top: 4px">Target line</p>', 'tp', 11],
		'empty line': ['<p id="te" class="te-c"></p>', 'te', 0],
		'empty heading': ['<h3 id="th" class="th-c"></h3>', 'th', 0],
		'heading middle': ['<h3 id="th" class="th-c">Target head</h3>', 'th', 7],
		'list item start': [
			'<ul id="tl"><li id="tl1" class="tl1-c"><p>Target item</p></li></ul>',
			'tl1',
			0,
		],
		'list item middle': [
			'<ul id="tl"><li id="tl1" class="tl1-c"><p>Target item</p></li></ul>',
			'tl1',
			7,
		],
		'list item end': [
			'<ul id="tl"><li id="tl1" class="tl1-c"><p>Target item</p></li></ul>',
			'tl1',
			11,
		],
		'empty list item': [
			'<ul id="tl"><li id="tl1" class="tl1-c"><p>Target item</p></li><li id="tl2" class="tl2-c"><p></p></li></ul>',
			'tl2',
			0,
		],
		'to-do item middle': [
			'<ul data-type="taskList" id="tt"><li data-type="taskItem" data-checked="true" id="tt1" class="tt1-c"><p>Target todo</p></li></ul>',
			'tt1',
			7,
		],
		'quote line middle': [
			'<blockquote id="tq"><p id="tqp" class="tqp-c">Target quote</p></blockquote>',
			'tqp',
			7,
		],
		'quote line end': [
			'<blockquote id="tq"><p id="tqp" class="tqp-c">Target quote</p></blockquote>',
			'tqp',
			12,
		],
		'code middle': ['<pre id="tc" class="tc-c"><code>Target code</code></pre>', 'tc', 7],
		'list item end, holding a nested list': [
			'<ul id="tl"><li id="tl1" class="tl1-c"><p>Target item</p><ul id="tn"><li id="tn1"><p>nested</p></li></ul></li></ul>',
			'tl1',
			11,
		],
		'empty line in a Card': [
			'<layout-card id="tk" class="sf-size-md"><p id="te" class="te-c"></p></layout-card>',
			'te',
			0,
		],
	} as const
	const copies = {
		'part of a heading': [
			['sh', 0],
			['sh', 4],
		],
		"all of a heading's text": [
			['sh', 0],
			['sh', 12],
		],
		'one line of code': [
			['sc', 0],
			['sc', 4],
		],
		'two lines of code': [
			['sc', 5],
			['sc', 13],
		],
		'part of a list item': [
			['sl1', 0],
			['sl1', 4],
		],
		"part of a quote's line": [
			['sqp', 0],
			['sqp', 5],
		],
		'part of a to-do item': [
			['st1', 0],
			['st1', 4],
		],
		'across two lines': [
			['sp1', 5],
			['sp2', 4],
		],
		'across two list items': [
			['sl1', 5],
			['sl2', 4],
		],
		'three list items': [
			['sl1', 0],
			['sl3', 10],
		],
		'a line and a list': [
			['sp0', 0],
			['sl3', 10],
		],
		"a quote's line and the next": [
			['sqp', 0],
			['sp1', 4],
		],
		'a picture between lines': [
			['sp3', 3],
			['sp4', 3],
		],
		'from inside a cell': [
			['sc1', 0],
			['sp5', 5],
		],
		'from the end of a line': [
			['sp1', 8],
			['sp2', 4],
		],
		'words and a space': [
			['sp6', 2],
			['sp6', 8],
		],
		'two stars around a word': [
			['sp6', 8],
			['sp6', 16],
		],
	} as const
	const cases: [keyof typeof copies, keyof typeof places, string][] = [
		// Text: the line keeps its kind and settings.
		['part of a heading', 'line start', `${line} "HeadTarget line"`],
		['part of a heading', 'empty line', 'p#te.te-c "Head"'],
		["all of a heading's text", 'empty heading', 'h3#th.th-c "Heading text"'],
		['part of a list item', 'line start', `${line} "itemTarget line"`],
		[
			'part of a list item',
			'empty list item',
			'ul#tl[li#tl1.tl1-c[p "Target item"] li#tl2.tl2-c[p "item"]]',
		],
		["part of a quote's line", 'empty line', 'p#te.te-c "quote"'],
		['part of a to-do item', 'line start', `${line} "todoTarget line"`],
		['one line of code', 'empty line', 'p#te.te-c "code"'],
		// A code block's lines are lines: as copied in an empty line, under an empty item's line.
		['two lines of code', 'empty line', 'code.sc-c "one⏎code"'],
		[
			'two lines of code',
			'empty list item',
			'ul#tl[li#tl1.tl1-c[p "Target item"] li#tl2.tl2-c[p "" code.sc-c "one⏎code"]]',
		],
		// Lines: the second half keeps the line's class and style; at the start, the line keeps all.
		['across two lines', 'line middle', `${line} "Target one" ${lineMade} "paraline"`],
		['across two lines', 'line start', `p.p1-c "one" ${line} "paraTarget line"`],
		['across two lines', 'line end', `${line} "Target lineone" ${blue} "para"`],
		['across two lines', 'empty line', `p.p1-c "one" ${blue} "para"`],
		['across two lines', 'heading middle', 'h3#th.th-c "Target one" h3.th-c "parahead"'],
		[
			'across two lines',
			'to-do item middle',
			'todo#tt[ti#tt1.tt1-c+[p "Target one"] ti.tt1-c[p "paratodo"]]',
		],
		['across two lines', 'code middle', 'code#tc.tc-c "Target one⏎⏎paracode"'],
		['across two list items', 'line middle', `${line} "Target one" ${lineMade} "itemline"`],
		// Lists: copied by their text, still a list; in a list, each line an item of its kind.
		['three list items', 'empty line', `ul.sl-c[${items12} li[p "item three"]]`],
		['three list items', 'line start', `ul.sl-c[${items12}] ${line} "item threeTarget line"`],
		[
			'three list items',
			'line middle',
			`${line} "Target item one" ul.sl-c[li.li2-c[p "item two"]] ${lineMade} "item threeline"`,
		],
		[
			'three list items',
			'list item middle',
			'ul#tl[li#tl1.tl1-c[p "Target item one"] li.li2-c[p "item two"] li.tl1-c[p "item threeitem"]]',
		],
		[
			'three list items',
			'to-do item middle',
			'todo#tt[ti#tt1.tt1-c+[p "Target item one"] ti.li2-c[p "item two"] ti.tt1-c[p "item threetodo"]]',
		],
		[
			'across two lines',
			'empty list item',
			`ul#tl[li#tl1.tl1-c[p "Target item"] li#tl2.tl2-c[p.p1-c "one"] li.tl2-c[${blue} "para"]]`,
		],
		[
			'a line and a list',
			'list item start',
			`ul#tl[li.tl1-c[p.p0-c "para zero"] ${items12} li#tl1.tl1-c[p "item threeTarget item"]]`,
		],
		[
			'a line and a list',
			'list item end',
			`ul#tl[li#tl1.tl1-c[p "Target itempara zero"] ${items12} li[p "item three"]]`,
		],
		[
			'a line and a list',
			'empty list item',
			`ul#tl[li#tl1.tl1-c[p "Target item"] li#tl2.tl2-c[p.p0-c "para zero"] ${items12} li[p "item three"]]`,
		],
		// The item pasted into keeps itself: a copied list's first line goes in it.
		[
			'three list items',
			'empty list item',
			'ul#tl[li#tl1.tl1-c[p "Target item"] li#tl2.tl2-c[p "item one"] li.li2-c[p "item two"] li[p "item three"]]',
		],
		// A quote's line joining a quote's line leaves the quote whole.
		[
			"a quote's line and the next",
			'quote line middle',
			'quote#tq[p#tqp.tqp-c "Target quote text" p.tqp-c "paraquote"]',
		],
		[
			"a quote's line and the next",
			'quote line end',
			'quote#tq[p#tqp.tqp-c "Target quotequote text" p.p1-c "para"]',
		],
		// A picture in a list goes in the item before: an item starts with a line.
		[
			'a picture between lines',
			'list item middle',
			'ul#tl[li#tl1.tl1-c[p "Target ore" image[]] li.tl1-c[p "aftitem"]]',
		],
		[
			'a picture between lines',
			'list item end',
			'ul#tl[li#tl1.tl1-c[p "Target itemore" image[]] li.tl1-c[p "aft"]]',
		],
		// A table's lines stay in it, and a Card the empty line is alone in stays.
		[
			'from inside a cell',
			'empty list item',
			'ul#tl[li#tl1.tl1-c[p "Target item"] li#tl2.tl2-c[p "" table[tableRow[tableCell[p "one"] tableCell[p "cell two"]]]] li.tl2-c[p "after"]]',
		],
		[
			'across two lines',
			'empty line in a Card',
			`${card}#tk.sf-size-md[p.p1-c "one" ${blue} "para"]`,
		],
		// What the item held after the line goes at the end of the item the copy ends in, as Enter
		// carries it.
		[
			'across two list items',
			'list item end, holding a nested list',
			'ul#tl[li#tl1.tl1-c[p "Target itemone"] li.li2-c[p "item" ul#tn[li#tn1[p "nested"]]]]',
		],
		[
			'a picture between lines',
			'list item end, holding a nested list',
			'ul#tl[li#tl1.tl1-c[p "Target itemore" image[]] li.tl1-c[p "aft" ul#tn[li#tn1[p "nested"]]]]',
		],
		// As written: spaces, and what a paste rule would turn into bold.
		['words and a space', 'line middle', `${line} "Target words line"`],
		['two stars around a word', 'line middle', `${line} "Target **bold**line"`],
		['from the end of a line', 'line middle', `${line} "Target " ${lineMade} "paraline"`],
	]
	const copy = async (name: keyof typeof copies) => {
		const [[fromId, fromOffset], [toId, toOffset]] = copies[name]
		const from = await linePosition(page, fromId, fromOffset)
		await selectText(page, from, await linePosition(page, toId, toOffset))
		await page.keyboard.press('ControlOrMeta+c')
	}
	for (const [copied, place, shape] of cases) {
		const [html, id, offset] = places[place]
		await pasteInto(page, html)
		await copy(copied)
		await selectText(page, await linePosition(page, id, offset))
		await page.keyboard.press('ControlOrMeta+v')
		await settle(page)
		expect.soft(await pastedShape(page), `${copied}, pasted at the ${place}`).toBe(shape)
	}

	// Copied from a line's end, the cursor after what's pasted.
	await pasteInto(page, places['line middle'][0])
	await copy('from the end of a line')
	await selectText(page, await linePosition(page, 'tp', 7))
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect
		.soft(await selectedPlace(page), "copied from a line's end: the cursor")
		.toBe('"paraline" at 4')

	// Plain text is text: into an empty heading, or over all of a heading's text, the heading stays.
	await pasteInto(page, places['empty heading'][0])
	await setClipboard(page, 'word')
	await selectText(page, await linePosition(page, 'th', 0))
	await settle(page)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect
		.soft(await pastedShape(page), 'plain text, into an empty heading')
		.toBe('h3#th.th-c "word"')
	await pasteInto(page, places['heading middle'][0])
	await setClipboard(page, 'New title')
	await selectText(page, await linePosition(page, 'th', 0), await linePosition(page, 'th', 11))
	await settle(page)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect
		.soft(await pastedShape(page), "plain text, over all of a heading's text")
		.toBe('h3#th.th-c "New title"')

	// Over a block selected whole, text gives a plain line, as typing does.
	await pasteInto(page, places['line start'][0])
	await copy('part of a heading')
	await selectBlock(page, 'tp')
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect.soft(await pastedShape(page), 'text over a block selected whole').toBe('p "Head"')

	// Over text selected across lines: the selection goes first, as with Enter.
	await pasteInto(page, `${places['line start'][0]}<p id="tp2">Next line</p>`)
	await copy('across two lines')
	await selectText(page, await linePosition(page, 'tp', 2), await linePosition(page, 'tp2', 4))
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect
		.soft(await pastedShape(page), 'lines over text across lines')
		.toBe(`${line} "Taone" ${lineMade} "para line"`)

	// The cursor after what's pasted, and Undo puts the line back as it was.
	await pasteInto(page, places['line middle'][0])
	await copy('across two lines')
	await selectText(page, await linePosition(page, 'tp', 7))
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect.soft(await selectedPlace(page), 'the cursor after the paste').toBe('"paraline" at 4')
	await page.keyboard.press('ControlOrMeta+z')
	await settle(page)
	expect.soft(await pastedShape(page), 'undone').toBe(`${line} "Target line"`)

	// Lines from another page, as a person selects them.
	await pasteInto(page, places['line middle'][0])
	await page.evaluate(() => {
		const elsewhere = document.createElement('div')
		elsewhere.id = 'elsewhere'
		elsewhere.innerHTML = '<h2>One</h2><p>Two</p><p>Three</p>'
		document.body.append(elsewhere)
		getSelection()!.selectAllChildren(elsewhere)
	})
	await page.keyboard.press('ControlOrMeta+c')
	await page.locator('#elsewhere').evaluate((el) => el.remove())
	await selectText(page, await linePosition(page, 'tp', 7))
	// The editor takes the focus back a frame later (TipTap's focus).
	await settle(page)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	const fromElsewhere = await pastedShape(page)
	expect
		.soft(fromElsewhere, 'from another page, the first line')
		.toMatch(new RegExp(`^${line.replace(/[{}.]/g, '\\$&')} "Target One" `))
	expect
		.soft(fromElsewhere, 'from another page, the second half')
		.toMatch(new RegExp(` ${lineMade.replace(/[{}.]/g, '\\$&')} "Threeline"$`))

	// Code copied in VS Code, pasted into a line: a code block, the code block's own paste going first.
	await pasteInto(page, places['line middle'][0])
	await selectText(page, await linePosition(page, 'tp', 7))
	await settle(page)
	await page.evaluate(() => {
		const clipboardData = new DataTransfer()
		clipboardData.setData('text/plain', 'one()\ntwo()')
		clipboardData.setData('text/html', '<div><div>one()</div><div>two()</div></div>')
		clipboardData.setData('vscode-editor-data', JSON.stringify({ mode: 'javascript' }))
		const paste = new ClipboardEvent('paste', {
			clipboardData,
			bubbles: true,
			cancelable: true,
		})
		document.querySelector('.tiptap')!.dispatchEvent(paste)
	})
	await settle(page)
	expect.soft(await pastedShape(page), 'code from VS Code').toContain('code "one()⏎two()"')

	// A web address pasted over words links them: the link's own paste goes first.
	await pasteInto(page, places['line start'][0])
	await setClipboard(page, 'https://example.com')
	await selectText(page, await linePosition(page, 'tp', 0), await linePosition(page, 'tp', 6))
	await settle(page)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	await expect
		.soft(page.locator('.tiptap #tp a[href="https://example.com"]'))
		.toHaveText('Target')
})

// Blocks copied whole go in as copied lines do (copyAndPaste.ts): ProseMirror put one in the item
// the cursor was in, as one of its blocks, or above the list at its start. In a list a plain line
// becomes an item, made as Enter makes one; items copied by their text take the list's kind; and
// anything else keeps its kind, under the line it's pasted on. What's pasted replaces an empty
// line, never what holds it.
test('blocks copied whole go in as copied lines do, and in a list, under the line', async ({
	page,
}) => {
	const sources =
		'<ul id="wl" class="wl-c"><li class="w1-c"><p>copy one</p></li><li><p>copy two</p></li></ul>'
		+ '<p id="wp" class="wp-c">copied line</p><img id="wi" src="/no-picture.png">'
		+ '<h2 id="wh" class="wh-c">Heading text</h2><p id="wa" class="wa-c">para</p>'
		+ '<ul data-type="taskList">'
		+ '<li data-type="taskItem" data-checked="true" id="wt1"><p>todo one</p></li>'
		+ '<li data-type="taskItem" data-checked="true" id="wt2" class="t2-c"><p>todo two</p></li>'
		+ '<li data-type="taskItem" id="wt3" class="t3-c"><p>todo three</p></li></ul>'
		+ '<ul><li id="wn1"><p>has nest</p><ul class="nn-c"><li id="wn11"><p>nested one</p></li><li id="wn12"><p>nested two</p></li></ul></li>'
		+ '<li id="wn2" class="n2-c"><p>after nest</p></li></ul>'
		+ '<layout-card class="sf-size-md"><ul class="sc-c"><li id="kc1" class="c1-c"><p>card one</p></li>'
		+ '<li class="c2-c"><p>card two</p></li><li id="kc3" class="c3-c"><p>card three</p></li></ul></layout-card>'
		+ '<layout-card class="sf-size-md"><p id="kl1">kline one</p><p class="k2-c">kline two</p>'
		+ '<p id="kl3">kline three</p></layout-card>'
		+ '<blockquote><p id="ql1">qline one</p><p class="q2-c">qline two</p><p id="ql3">qline three</p></blockquote>'
	const list = '<ul id="tl"><li id="tl1" class="tl1-c"><p>Target item</p></li></ul>'
	const line = 'p#tp.tp-c{margin-top: 4px}'
	const card = '1e4d245a-16ac-4e60-96e9-1cf4ff6e2b93'
	const copied = 'ul.wl-c[li.w1-c[p "copy one"] li[p "copy two"]]'
	const places = {
		'item start': [list, 'tl1', 0],
		'item middle': [list, 'tl1', 7],
		'item end': [list, 'tl1', 11],
		'empty item': [
			'<ul id="tl"><li id="tl1" class="tl1-c"><p>Target item</p></li><li id="tl2" class="tl2-c"><p></p></li></ul>',
			'tl2',
			0,
		],
		"a list's only item, empty": [
			'<ul id="to"><li id="to1" class="to1-c"><p></p></li></ul>',
			'to1',
			0,
		],
		'to-do item end': [
			'<ul data-type="taskList" id="tt"><li data-type="taskItem" data-checked="true" id="tt1" class="tt1-c"><p>Target todo</p></li></ul>',
			'tt1',
			11,
		],
		'line middle': ['<p id="tp" class="tp-c" style="margin-top: 4px">Target line</p>', 'tp', 7],
		'empty line': ['<p id="te" class="te-c"></p>', 'te', 0],
		'item end, a picture after the list': [
			`${list}<img id="ti" src="/no-picture.png">`,
			'tl1',
			11,
		],
		'empty line in a Card': [
			'<layout-card id="tk" class="sf-size-md"><p id="te" class="te-c"></p></layout-card>',
			'te',
			0,
		],
	} as const
	// A block selected whole, or text from one place to another.
	const copies = {
		'a list': 'wl',
		'a paragraph': 'wp',
		'a picture': 'wi',
		'a heading and a line': [
			['wh', 0],
			['wa', 4],
		],
		'to-do items': [
			['wt1', 5],
			['wt3', 4],
		],
		'an item holding a list': [
			['wn1', 4],
			['wn2', 5],
		],
		'a to-do item': 'wt1',
		'from inside a nested item': [
			['wn11', 6],
			['wn2', 5],
		],
		'items in a Card': [
			['kc1', 5],
			['kc3', 4],
		],
		'lines in a Card': [
			['kl1', 6],
			['kl3', 5],
		],
		'lines in a quote': [
			['ql1', 6],
			['ql3', 5],
		],
		'an item and its sub-items': [
			['wn1', 0],
			['wn11', 10],
		],
		'an item and its sub-items, into the second': [
			['wn1', 0],
			['wn12', 6],
		],
		"from an item's line end into its sub-items": [
			['wn1', 8],
			['wn12', 6],
		],
	} as const
	const cases: [keyof typeof copies, keyof typeof places, string][] = [
		// A list copied whole nests, under the line, at an item's start in the item Enter makes; the
		// list pasted into stays.
		['a list', 'item start', `ul#tl[li.tl1-c[p "" ${copied}] li#tl1.tl1-c[p "Target item"]]`],
		['a list', 'item middle', `ul#tl[li#tl1.tl1-c[p "Target " ${copied}] li.tl1-c[p "item"]]`],
		['a list', "a list's only item, empty", `ul#to[li#to1.to1-c[p "" ${copied}]]`],
		// A plain line copied whole is an item, made as Enter makes one: a to-do's unticked.
		[
			'a paragraph',
			'item end',
			'ul#tl[li#tl1.tl1-c[p "Target item"] li.tl1-c[p.wp-c "copied line"]]',
		],
		[
			'a paragraph',
			'to-do item end',
			'todo#tt[ti#tt1.tt1-c+[p "Target todo"] ti.tt1-c[p.wp-c "copied line"]]',
		],
		['a picture', 'item start', 'ul#tl[li.tl1-c[p "" image[]] li#tl1.tl1-c[p "Target item"]]'],
		// A heading is a block, copied by its text too: under the empty item's line, not its text.
		[
			'a heading and a line',
			'empty item',
			'ul#tl[li#tl1.tl1-c[p "Target item"] li#tl2.tl2-c[p "" h2.wh-c "Heading text"] li.tl2-c[p.wa-c "para"]]',
		],
		// Items copied by their text take the list's kind: a to-do's tick goes.
		[
			'to-do items',
			'item end',
			'ul#tl[li#tl1.tl1-c[p "Target itemone"] li.t2-c[p "todo two"] li.t3-c[p "todo"]]',
		],
		// A list in an item copied by its text stays in the item, which the item's line joins.
		[
			'an item holding a list',
			'item end',
			'ul#tl[li#tl1.tl1-c[p "Target itemnest" ul.nn-c[li[p "nested one"] li[p "nested two"]]] li.n2-c[p "after"]]',
		],
		// An item copied whole joins the list as its items do, of its kind.
		['a to-do item', 'item end', 'ul#tl[li#tl1.tl1-c[p "Target item"] li[p "todo one"]]'],
		// A copy starting inside what an item holds, at an item's start: in the item Enter makes.
		[
			'from inside a nested item',
			'item start',
			'ul#tl[li.tl1-c[p "" ul.nn-c[li[p " one"] li[p "nested two"]]] li#tl1.tl1-c[p "afterTarget item"]]',
		],
		// The blocks the copied text sat in don't come with it: a Card, a quote. A list stays.
		[
			'items in a Card',
			'item end',
			'ul#tl[li#tl1.tl1-c[p "Target itemone"] li.c2-c[p "card two"] li.c3-c[p "card"]]',
		],
		[
			'lines in a Card',
			'line middle',
			`${line} "Target one" p.k2-c "kline two" p.tp-c{margin-top: 4px} "klineline"`,
		],
		['lines in a quote', 'empty line', 'p "one" p.q2-c "qline two" p "qline"'],
		// An item copied with its sub-items stays an item: they nest. Outside a list, its line joined
		// to the text before, an empty one holds them; copied from its line's end, they're the copy.
		[
			'an item and its sub-items',
			'item end',
			'ul#tl[li#tl1.tl1-c[p "Target itemhas nest" ul.nn-c[li[p "nested one"]]]]',
		],
		[
			'an item and its sub-items, into the second',
			'line middle',
			`${line} "Target has nest" ul[li[p "" ul.nn-c[li[p "nested one"]]]] p.tp-c{margin-top: 4px} "nestedline"`,
		],
		[
			"from an item's line end into its sub-items",
			'item end',
			'ul#tl[li#tl1.tl1-c[p "Target item"] li[p "nested one"] li[p "nested"]]',
		],
		// Outside a list, as ProseMirror puts a block, but a Card its empty line is alone in stays.
		['a list', 'line middle', `${line} "Target " ${copied} p.tp-c{margin-top: 4px} "line"`],
		['a paragraph', 'empty line in a Card', `${card}#tk.sf-size-md[p.wp-c "copied line"]`],
	]
	const copy = async (name: keyof typeof copies) => {
		const what = copies[name]
		if (typeof what === 'string') await selectBlock(page, what)
		else {
			const [[fromId, fromOffset], [toId, toOffset]] = what
			const from = await linePosition(page, fromId, fromOffset)
			await selectText(page, from, await linePosition(page, toId, toOffset))
		}
		await page.keyboard.press('ControlOrMeta+c')
	}
	const paste = async (copied: keyof typeof copies, place: keyof typeof places) => {
		const [html, id, offset] = places[place]
		await pasteInto(page, html, sources)
		await copy(copied)
		await selectText(page, await linePosition(page, id, offset))
		await page.keyboard.press('ControlOrMeta+v')
		await settle(page)
	}
	for (const [copied, place, shape] of cases) {
		await paste(copied, place)
		expect.soft(await pastedShape(page), `${copied}, pasted at the ${place}`).toBe(shape)
	}

	// The cursor after what's pasted; after a picture, in the line after it. One Undo puts it back.
	await paste('a paragraph', 'line middle')
	expect
		.soft(await selectedPlace(page), 'the cursor after a paragraph')
		.toBe('"copied line" at 11')
	await paste('a picture', 'item start')
	expect
		.soft(await selectedPlace(page), 'the cursor after a picture under a line')
		.toBe('"Target item" at 0')
	await paste('a picture', 'item end')
	expect.soft(await selectedPlace(page), 'the cursor after a picture').toBe('dash-2 at 0')
	// Not on a picture after it, which typing would replace.
	await paste('a picture', 'item end, a picture after the list')
	expect
		.soft(await selectedPlace(page), 'the cursor after a picture, a picture next')
		.toBe('dash-2 at 0')
	// At the page's end, in a new last line.
	await page.evaluate((html) => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor.chain().setMeta('addToHistory', false).setContent(html).run()
	}, `${sources}<p id="dash-1">—</p><p id="te"></p>`)
	await copy('a picture')
	await selectText(page, await linePosition(page, 'te', 0))
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect
		.soft(await selectedPlace(page), "the cursor after a picture at the page's end")
		.toBe('"" at 0')
	await page.keyboard.type('X')
	await settle(page)
	expect
		.soft(await pastedShape(page), "typing after a picture at the page's end")
		.toBe('image[] p "X"')
	// Pictures and a line between, from another app: after the last picture.
	await pasteInto(page, list, sources)
	await selectText(page, await linePosition(page, 'tl1', 11))
	await settle(page)
	await page.evaluate(() => {
		const clipboardData = new DataTransfer()
		clipboardData.setData(
			'text/html',
			'<img src="/no-picture.png"><p>app text</p><img src="/no-picture.png">',
		)
		const paste = new ClipboardEvent('paste', {
			clipboardData,
			bubbles: true,
			cancelable: true,
		})
		document.querySelector('.tiptap')!.dispatchEvent(paste)
	})
	await settle(page)
	expect
		.soft(await pastedShape(page), 'pictures from another app')
		.toBe('ul#tl[li#tl1.tl1-c[p "Target item" image[]] li.tl1-c[p "app text" image[]]]')
	expect.soft(await selectedPlace(page), 'the cursor after the last picture').toBe('dash-2 at 0')
	await paste('a picture', 'item end')
	await page.keyboard.press('ControlOrMeta+z')
	await settle(page)
	expect.soft(await pastedShape(page), 'undone').toBe('ul#tl[li#tl1.tl1-c[p "Target item"]]')
})

/**
 * Drags the text selected from one place to another with the browser's drag events: Playwright's
 * mouse starts no drag of selected text.
 */
const dragText = (page: Page, from: number, to: number) =>
	page.evaluate(
		([from, to]) => {
			const { view } = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			const point = (pos: number) => {
				const { left, top, bottom } = view.coordsAtPos(pos)
				return { clientX: left + 1, clientY: (top + bottom) / 2 }
			}
			const dataTransfer = new DataTransfer()
			const event = (pos: number) => ({
				...point(pos),
				bubbles: true,
				cancelable: true,
				dataTransfer,
			})
			// The line itself: the drag handle can sit over the point.
			const at = (pos: number) => {
				const { node } = view.domAtPos(pos)
				return node instanceof Element ? node : node.parentElement!
			}
			const source = at(from)
			source.dispatchEvent(new DragEvent('dragstart', event(from)))
			const target = at(to)
			target.dispatchEvent(new DragEvent('dragover', event(to)))
			target.dispatchEvent(new DragEvent('drop', event(to)))
			source.dispatchEvent(new DragEvent('dragend', event(to)))
		},
		[from, to] as const,
	)
/** Drops this HTML at the position, as dragged in from another page: no drag starts in the editor. */
const dropFromElsewhere = (page: Page, html: string, to: number) =>
	page.evaluate(
		([html, to]) => {
			const { view } = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			const { left, top, bottom } = view.coordsAtPos(to)
			const dataTransfer = new DataTransfer()
			dataTransfer.setData('text/html', html)
			dataTransfer.setData('text/plain', html.replace(/<[^>]*>/g, ''))
			const at = { clientX: left + 1, clientY: (top + bottom) / 2 }
			const event = { ...at, bubbles: true, cancelable: true, dataTransfer }
			const { node } = view.domAtPos(to)
			const target = node instanceof Element ? node : node.parentElement!
			target.dispatchEvent(new DragEvent('dragover', event))
			target.dispatchEvent(new DragEvent('drop', event))
		},
		[html, to] as const,
	)

// A drop puts the dragged copy in as a paste does, after it leaves where it was, and selects it
// (copyAndPaste.ts).
test('dragged text joins the line it is dropped in, and lines dropped in code are text', async ({
	page,
}) => {
	// Short, so where it's dragged from and to are both on screen.
	const heading = '<h2 id="sh" class="sh-c" style="color: red">Heading text</h2>'
	const lines = '<p id="sp1" class="p1-c">para one</p><p id="sp2" class="p2-c">para two</p>'
	await pasteInto(
		page,
		'<p id="tp" class="tp-c" style="margin-top: 4px">Target line</p>',
		heading,
	)
	await selectText(page, await linePosition(page, 'sh', 0), await linePosition(page, 'sh', 4))
	await dragText(page, await linePosition(page, 'sh', 2), await linePosition(page, 'tp', 0))
	await settle(page)
	expect
		.soft(await pastedShape(page), 'text dropped at the start of a line')
		.toBe('p#tp.tp-c{margin-top: 4px} "HeadTarget line"')
	expect.soft(await selectedPlace(page), 'what was dropped, selected').toBe('tp at 0 to tp at 4')

	// A heading from another page, as text beside the line's.
	await pasteInto(page, '<p id="tp" class="tp-c" style="margin-top: 4px">Target line</p>', lines)
	await dropFromElsewhere(page, '<h2>Elsewhere</h2>', await linePosition(page, 'tp', 0))
	await settle(page)
	expect
		.soft(await pastedShape(page), 'a heading from another page, at the start of a line')
		.toBe('p#tp.tp-c{margin-top: 4px} "ElsewhereTarget line"')
	expect
		.soft(await selectedPlace(page), 'the heading dropped, selected')
		.toBe('tp at 0 to tp at 9')

	// Lines in the middle of a line, as a paste puts them.
	await pasteInto(page, '<p id="tp" class="tp-c" style="margin-top: 4px">Target line</p>', lines)
	await selectText(page, await linePosition(page, 'sp1', 5), await linePosition(page, 'sp2', 4))
	await dragText(page, await linePosition(page, 'sp1', 6), await linePosition(page, 'tp', 7))
	await settle(page)
	expect
		.soft(await pastedShape(page), 'lines dropped in the middle of a line')
		.toBe('p#tp.tp-c{margin-top: 4px} "Target one" p.tp-c{margin-top: 4px} "paraline"')
	expect
		.soft(await selectedPlace(page), 'the lines dropped, selected')
		.toBe('tp at 7 to "paraline" at 4')

	await pasteInto(page, '<pre id="tc" class="tc-c"><code>Target code</code></pre>', lines)
	await selectText(page, await linePosition(page, 'sp1', 5), await linePosition(page, 'sp2', 4))
	await dragText(page, await linePosition(page, 'sp1', 6), await linePosition(page, 'tc', 7))
	await settle(page)
	expect
		.soft(await pastedShape(page), 'lines dropped in code')
		.toBe('code#tc.tc-c "Target one⏎⏎paracode"')
})

/** The cursor on the first empty line in the block with this id. */
const cursorOnEmptyLine = (page: Page, id: string) =>
	page.evaluate((id) => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		let at = -1
		editor.state.doc.descendants((node, pos) => {
			if (
				at < 0
				&& node.isTextblock
				&& !node.content.size
				&& editor.state.doc.resolve(pos).node().attrs['id'] === id
			)
				at = pos + 1
		})
		editor.chain().focus().setTextSelection(at).run()
	}, id)

// Taking an item out of the middle splits its list, quote or Card in two, and the block put in
// below goes without the id (allowAttributesExtension.ts). Taken out at the start, the list left
// keeps it.
test('an item taken out of a list, quote or Card leaves the id on the top half', async ({
	page,
}) => {
	const list = (id: string) =>
		`<ul id="${id}"><li><p>Above</p></li><li id="${id}-item"><p>Out</p></li><li><p>Below</p></li></ul>`
	const first = (id: string) =>
		`<ul id="${id}"><li id="${id}-item"><p>Out</p></li><li><p>Below</p></li></ul>`
	await insertAtEnd(
		page,
		'<blockquote id="out-quote"><p>Above</p><p></p><p>Below</p></blockquote>'
			+ '<layout-card id="out-card" class="sf-size-md"><p>Above</p><p></p><p>Below</p></layout-card>'
			+ list('out-tab')
			+ list('out-button')
			+ first('out-first-tab')
			+ first('out-first-backspace'),
	)
	for (const [kind, id] of [
		['a quote, Enter on an empty line', 'out-quote'],
		['a Card, Enter on an empty line', 'out-card'],
	]) {
		await cursorOnEmptyLine(page, id!)
		await page.keyboard.press('Enter')
		await settle(page)
		expect.soft(await textsWithId(page, id!), kind).toEqual(['Above'])
	}

	await cursorAt(page, 'out-tab-item', 1)
	await page.keyboard.press('Shift+Tab')
	await settle(page)
	expect.soft(await textsWithId(page, 'out-tab'), 'a list, Shift-Tab').toEqual(['Above'])

	// The line's own bulletList button: the list's turns the whole list into lines.
	await cursorInView(page, 'out-button-item', 1)
	await pickInPath(page, 3)
	await page.locator('.floating-toolbar').getByRole('button', { name: 'bulletList' }).click()
	await settle(page)
	expect
		.soft(await textsWithId(page, 'out-button'), "a list, the line's bulletList button")
		.toEqual(['Above'])

	for (const [kind, id, key] of [
		['the first item, Shift-Tab', 'out-first-tab', 'Shift+Tab'],
		['the first item, Backspace', 'out-first-backspace', 'Backspace'],
	]) {
		await cursorAt(page, `${id}-item`, 1)
		await page.keyboard.press(key!)
		await settle(page)
		expect.soft(await textsWithId(page, id!), kind).toEqual(['Below'])
	}
})

// Joining blocks, adding rows and columns, wrapping and changing a block write blocks anew, and
// leave each id on as many blocks as before: the rule leaves them.
test('changes that write a block anew leave its id where it was', async ({ page }) => {
	await insertAtEnd(
		page,
		'<p id="join-a">First</p><p id="join-b">Second</p>'
			+ '<p id="join-c">First</p><p id="join-d">Second</p>'
			+ '<p id="join-e"></p><p id="join-f">Second</p>'
			+ '<table id="grow-table"><tbody><tr><td id="grow-cell"><p>Cell</p></td></tr></tbody></table>'
			+ '<p id="change-p">Change me</p>',
	)
	const joins = [
		{
			kind: 'Backspace',
			key: 'Backspace',
			ids: ['join-a', 'join-b'],
			at: 0,
			made: [['FirstSecond'], []],
		},
		{
			kind: 'Delete',
			key: 'Delete',
			ids: ['join-c', 'join-d'],
			at: 'First'.length,
			made: [['FirstSecond'], []],
		},
		{
			kind: 'Backspace after an empty block',
			key: 'Backspace',
			ids: ['join-e', 'join-f'],
			at: 0,
			made: [[], ['Second']],
		},
	] as const
	for (const { kind, key, ids, at, made } of joins) {
		await cursorAt(page, key === 'Delete' ? ids[0] : ids[1], at)
		await page.keyboard.press(key)
		await settle(page)
		expect
			.soft(await textsWithId(page, ids[0]), `joined with ${kind}: the first`)
			.toEqual(made[0])
		expect
			.soft(await textsWithId(page, ids[1]), `joined with ${kind}: the second`)
			.toEqual(made[1])
	}

	const toolbar = page.locator('.floating-toolbar')
	await cursorInView(page, 'grow-cell', 1)
	await toolbar.getByRole('button', { name: '+ Row ↓' }).click()
	await toolbar.getByRole('button', { name: '+ Col →' }).click()
	await settle(page)
	const table = await page.evaluate(() => {
		const { doc } = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		const found = { cells: 0, ids: [] as string[] }
		doc.descendants((node) => {
			if (node.attrs['id'] !== 'grow-table') return
			node.descendants((inner) => {
				if (inner.type.name === 'tableCell') found.cells++
				if (inner.attrs['id']) found.ids.push(inner.attrs['id'])
			})
			return false
		})
		return found
	})
	expect.soft(table, 'a row and a column added').toEqual({ cells: 4, ids: ['grow-cell'] })
	expect
		.soft(await textsWithId(page, 'grow-table'), 'a row and a column added: the table')
		.toEqual(['Cell'])

	const changed = async () =>
		(await withId(page, 'change-p')).map(({ type, text }) => `${type} "${text}"`)
	await cursorInView(page, 'change-p', 1)
	await toolbar.getByRole('button', { name: 'blockquote' }).click()
	await settle(page)
	expect.soft(await changed(), 'wrapped in a quote').toEqual(['paragraph "Change me"'])
	// Wrapped, the toolbar is on the quote.
	await toolbar.getByRole('button', { name: 'Unwrap' }).click()
	await settle(page)
	expect.soft(await changed(), 'unwrapped').toEqual(['paragraph "Change me"'])
	await cursorInView(page, 'change-p', 1)
	await (await openMenu(page, 'change_circle')).getByText('heading 2', { exact: true }).click()
	await settle(page)
	expect.soft(await changed(), 'changed with Change Type').toEqual(['heading "Change me"'])
})

/** An id, and a class and style to tell the block by (typesWithSettings). */
const ownSettings = (id: string) => `id="${id}" class="c-${id}" style="color: red"`
/**
 * Each block with these ids: its type, the block it's in (that block's id, or its type without
 * one), a to-do item's tick, and whether it lost the class or style `ownSettings` gave it. An id on
 * two blocks names both.
 */
const typesWithSettings = (page: Page, ids: readonly string[]) =>
	page.evaluate((ids) => {
		const { doc } = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		const found: Record<string, string> = {}
		const look = (parent: ProseMirrorNode) =>
			parent.forEach((node) => {
				const { id } = node.attrs
				if (ids.includes(id)) {
					const kept =
						node.attrs['class'] === `c-${id}` && node.attrs['style'] === 'color: red'
					const seen =
						`${node.type.name} in ${parent.attrs['id'] ?? parent.type.name}`
						+ (node.attrs['checked'] ? ', ticked' : '')
						+ (kept ? '' : ', its class or style gone')
					found[id] = found[id] === undefined ? seen : `${found[id]}, and ${seen}`
				}
				look(node)
			})
		look(doc)
		return found
	}, ids)
/** What's selected: a block as a whole, by its id, or where in which lines the text is. */
const selectedPlace = (page: Page) =>
	page.evaluate(() => {
		const { selection } =
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		if ('node' in selection) return `#${(selection as NodeSelection).node.attrs['id']} selected`
		const { $anchor, $head, empty } = selection
		const at = ($pos: typeof $head) =>
			`${$pos.parent.attrs['id'] ?? `"${$pos.parent.textContent}"`} at ${$pos.parentOffset}`
		return empty ? at($head) : `${at($anchor)} to ${at($head)}`
	})
/** Points the toolbar at the block this deep around the selection, by its node-path crumb. */
const pickInPath = async (page: Page, depth: number) => {
	await page.locator('.node-path button').nth(depth).click()
	// Before clicking, Playwright scrolls the crumb into view, which can move the page (as in
	// selectBlockAt): the cursor's line goes back in view.
	await page.evaluate(() => {
		const { view } = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const { node } = view.domAtPos(view.state.selection.head)
		;(node instanceof Element ? node : node.parentElement)?.scrollIntoView({ block: 'center' })
	})
	await settle(page)
}

// A change that writes a block anew as another type, but is meant to leave the same block, keeps
// its id, class and style; only what the change is for is new. TipTap's commands gave the new
// block the type's defaults, or the settings of the block around the selection
// (patches/@tiptap__core@3.32.0.patch). The list's buttons and Change Type change the list the
// node path points at; the keys, the list the cursor is in.
test('a block whose type changes keeps its own id, class and style', async ({ page }) => {
	const list = (id: string, tag = 'ul') =>
		`<${tag} ${ownSettings(id)}><li ${ownSettings(`${id}-1`)}><p ${ownSettings(`${id}-1p`)}>One</p></li>`
		+ `<li ${ownSettings(`${id}-2`)}><p ${ownSettings(`${id}-2p`)}>Two</p></li></${tag}>`
	const listIds = (id: string) => [id, `${id}-1`, `${id}-1p`, `${id}-2`, `${id}-2p`]
	const listAs = (id: string, listType: string, itemType: string) => ({
		[id]: `${listType} in doc`,
		[`${id}-1`]: `${itemType} in ${id}`,
		[`${id}-1p`]: `paragraph in ${id}-1`,
		[`${id}-2`]: `${itemType} in ${id}`,
		[`${id}-2p`]: `paragraph in ${id}-2`,
	})
	const tasks = (id: string) =>
		`<ul data-type="taskList" ${ownSettings(id)}><li data-type="taskItem" data-checked="true" ${ownSettings(`${id}-1`)}>`
		+ `<p ${ownSettings(`${id}-1p`)}>One</p></li><li data-type="taskItem" data-checked="false" ${ownSettings(`${id}-2`)}>`
		+ `<p ${ownSettings(`${id}-2p`)}>Two</p></li></ul>`
	// A bullet list whose first item holds a bullet list.
	const nested = (id: string) =>
		`<ul ${ownSettings(id)}><li ${ownSettings(`${id}-1`)}><p ${ownSettings(`${id}-1p`)}>One</p>`
		+ `<ul ${ownSettings(`${id}-in`)}><li ${ownSettings(`${id}-3`)}><p ${ownSettings(`${id}-3p`)}>Inner</p></li></ul></li></ul>`
	const nestedIds = (id: string) => [id, `${id}-1`, `${id}-1p`, `${id}-in`, `${id}-3`, `${id}-3p`]
	const nestedAs = (id: string, outer: [string, string], inner: [string, string]) => ({
		[id]: `${outer[0]} in doc`,
		[`${id}-1`]: `${outer[1]} in ${id}`,
		[`${id}-1p`]: `paragraph in ${id}-1`,
		[`${id}-in`]: `${inner[0]} in ${id}-1`,
		[`${id}-3`]: `${inner[1]} in ${id}-in`,
		[`${id}-3p`]: `paragraph in ${id}-3`,
	})
	const bullets: [string, string] = ['bulletList', 'listItem']
	const card = (id: string) =>
		`<layout-card ${ownSettings(id)}><p ${ownSettings(`${id}-p`)}>In a card</p></layout-card>`
	const toolbar = page.locator('.floating-toolbar')
	const button = (name: string) => toolbar.getByRole('button', { name, exact: true })
	const changeTypeTo = async (name: string) =>
		(await openMenu(page, 'change_circle')).getByText(name, { exact: true }).click()
	// The node path's crumbs, by depth: a block straight on the page (a list, or a line) is the
	// first after the page's own; the line in a list's item, or a list in the item, the third.
	const [onThePage, inAnItem] = [1, 3]
	const cases: {
		kind: string
		html: string
		ids: string[]
		change: () => Promise<unknown>
		made: Record<string, string>
		/** What's selected after (selectedPlace). */
		selected?: string
		/** What one Undo then gives back. */
		undone?: Record<string, string>
	}[] = [
		{
			kind: "the list's orderedList button, the cursor in an item",
			html: list('kt-v'),
			ids: listIds('kt-v'),
			change: async () => {
				await cursorInView(page, 'kt-v-1p', 1)
				await pickInPath(page, onThePage)
				await button('orderedList').click()
			},
			made: listAs('kt-v', 'orderedList', 'listItem'),
			selected: 'kt-v-1p at 1',
			undone: listAs('kt-v', 'bulletList', 'listItem'),
		},
		{
			kind: 'Mod-Shift-9, the cursor in a bullet item',
			html: list('kt-k'),
			ids: listIds('kt-k'),
			change: async () => {
				await cursorAt(page, 'kt-k-1p', 1)
				await page.keyboard.press('ControlOrMeta+Shift+9')
			},
			made: listAs('kt-k', 'taskList', 'taskItem'),
		},
		{
			kind: 'heading 2 on text across two lines',
			html: `<p ${ownSettings('kt-e-a')}>Alpha</p><p ${ownSettings('kt-e-b')}>Beta</p>`,
			ids: ['kt-e-a', 'kt-e-b'],
			change: async () => {
				await cursorAt(page, 'kt-e-a', 1, ['kt-e-b', 2])
				await button('heading 2').click()
			},
			made: { 'kt-e-a': 'heading in doc', 'kt-e-b': 'heading in doc' },
		},
		{
			kind: 'bulletList on a heading',
			html: `<h2 ${ownSettings('kt-f')}>Head</h2>`,
			ids: ['kt-f'],
			change: async () => {
				await cursorInView(page, 'kt-f', 1)
				await button('bulletList').click()
			},
			made: { 'kt-f': 'paragraph in listItem' },
		},
		{
			kind: '"## " typed at the start of a line',
			html: `<p ${ownSettings('kt-j')}>Text</p>`,
			ids: ['kt-j'],
			change: async () => {
				await cursorAt(page, 'kt-j', 0)
				await page.keyboard.type('## ')
			},
			made: { 'kt-j': 'heading in doc' },
		},
		{
			kind: 'Backspace in an empty code block',
			html: `<pre ${ownSettings('kt-c')}><code></code></pre>`,
			ids: ['kt-c'],
			change: async () => {
				await cursorAt(page, 'kt-c', 0)
				await page.keyboard.press('Backspace')
			},
			made: { 'kt-c': 'paragraph in doc' },
		},
		// Already right before the patch, and kept by its parts together: the line goes out of the
		// list, and the item it was in goes, as it does when the line is taken out.
		{
			kind: "Mod-Alt-2, the cursor in an item's line",
			html: list('kt-i'),
			ids: listIds('kt-i'),
			change: async () => {
				await cursorAt(page, 'kt-i-2p', 1)
				await page.keyboard.press('ControlOrMeta+Alt+2')
			},
			made: {
				'kt-i': 'bulletList in doc',
				'kt-i-1': 'listItem in kt-i',
				'kt-i-1p': 'paragraph in kt-i-1',
				'kt-i-2p': 'heading in doc',
			},
		},
		// The target is the list: its own type makes every item a line.
		{
			kind: "the list's bulletList button on a bullet list, the cursor in it",
			html: list('kt-o'),
			ids: listIds('kt-o'),
			change: async () => {
				await cursorInView(page, 'kt-o-2p', 1)
				await pickInPath(page, onThePage)
				await button('bulletList').click()
			},
			made: { 'kt-o-1p': 'paragraph in doc', 'kt-o-2p': 'paragraph in doc' },
			selected: 'kt-o-2p at 1',
		},
		// A new list joins the list above it, not the one below, whose settings would go.
		{
			kind: "the line's bulletList button on a line just above a bullet list",
			html: `<p ${ownSettings('kt-a')}>Above</p>${list('kt-b')}`,
			ids: ['kt-a', ...listIds('kt-b')],
			change: async () => {
				await cursorInView(page, 'kt-a', 1)
				await pickInPath(page, onThePage)
				await button('bulletList').click()
			},
			made: { 'kt-a': 'paragraph in listItem', ...listAs('kt-b', 'bulletList', 'listItem') },
		},
		{
			kind: "the list's taskList button, the cursor in a nested item, the node path on the outer list",
			html: nested('kt-no'),
			ids: nestedIds('kt-no'),
			change: async () => {
				await cursorInView(page, 'kt-no-3p', 1)
				await pickInPath(page, onThePage)
				await button('taskList').click()
			},
			made: nestedAs('kt-no', ['taskList', 'taskItem'], bullets),
			selected: 'kt-no-3p at 1',
		},
		{
			kind: "the list's orderedList button, the cursor in a nested item, the node path on it",
			html: nested('kt-np'),
			ids: nestedIds('kt-np'),
			change: async () => {
				await cursorInView(page, 'kt-np-3p', 1)
				await pickInPath(page, inAnItem)
				await button('orderedList').click()
			},
			made: nestedAs('kt-np', bullets, ['orderedList', 'listItem']),
			selected: 'kt-np-3p at 1',
		},
		{
			kind: 'Change Type to taskList, the cursor in a nested item, the node path on the outer list',
			html: nested('kt-nc'),
			ids: nestedIds('kt-nc'),
			change: async () => {
				await cursorInView(page, 'kt-nc-3p', 1)
				await pickInPath(page, onThePage)
				await changeTypeTo('taskList')
			},
			made: nestedAs('kt-nc', ['taskList', 'taskItem'], bullets),
			selected: 'kt-nc-3p at 1',
		},
		{
			kind: 'Mod-Shift-9, the cursor in a nested bullet item',
			html: nested('kt-nk'),
			ids: nestedIds('kt-nk'),
			change: async () => {
				await cursorAt(page, 'kt-nk-3p', 1)
				await page.keyboard.press('ControlOrMeta+Shift+9')
			},
			made: nestedAs('kt-nk', bullets, ['taskList', 'taskItem']),
		},
		{
			kind: "the list's taskList button, the list selected as a whole",
			html: list('kt-s'),
			ids: listIds('kt-s'),
			change: async () => {
				await selectBlock(page, 'kt-s')
				await button('taskList').click()
			},
			made: listAs('kt-s', 'taskList', 'taskItem'),
			selected: '#kt-s selected',
			undone: listAs('kt-s', 'bulletList', 'listItem'),
		},
		{
			kind: "the list's bulletList button on a bullet list selected as a whole",
			html: list('kt-w'),
			ids: listIds('kt-w'),
			change: async () => {
				await selectBlock(page, 'kt-w')
				await button('bulletList').click()
			},
			made: { 'kt-w-1p': 'paragraph in doc', 'kt-w-2p': 'paragraph in doc' },
			selected: 'kt-w-1p at 0 to kt-w-2p at 3',
		},
		{
			kind: 'Mod-Shift-7, the list selected as a whole',
			html: list('kt-7'),
			ids: listIds('kt-7'),
			change: async () => {
				await selectBlock(page, 'kt-7')
				await page.keyboard.press('ControlOrMeta+Shift+7')
			},
			made: listAs('kt-7', 'orderedList', 'listItem'),
			selected: '#kt-7 selected',
		},
		{
			kind: 'Change Type to bulletList, a to-do list selected as a whole',
			html: tasks('kt-t'),
			ids: listIds('kt-t'),
			change: async () => {
				await selectBlock(page, 'kt-t')
				await changeTypeTo('bulletList')
			},
			made: listAs('kt-t', 'bulletList', 'listItem'),
		},
		{
			kind: "the list's orderedList button, a nested list selected as a whole",
			html: nested('kt-n'),
			ids: nestedIds('kt-n'),
			change: async () => {
				await selectBlock(page, 'kt-n-in')
				await button('orderedList').click()
			},
			made: nestedAs('kt-n', bullets, ['orderedList', 'listItem']),
		},
		// Two lists stay two: joined, one's settings would go.
		{
			kind: "the list's orderedList button on a bullet list just under a numbered list",
			html: list('kt-jo', 'ol') + list('kt-ju'),
			ids: [...listIds('kt-jo'), ...listIds('kt-ju')],
			change: async () => {
				await cursorInView(page, 'kt-ju-1p', 1)
				await pickInPath(page, onThePage)
				await button('orderedList').click()
			},
			made: {
				...listAs('kt-jo', 'orderedList', 'listItem'),
				...listAs('kt-ju', 'orderedList', 'listItem'),
			},
		},
		{
			kind: "the list's taskList button on a bullet list just under a to-do list",
			html: tasks('kt-jt') + list('kt-jb'),
			ids: [...listIds('kt-jt'), ...listIds('kt-jb')],
			change: async () => {
				await selectBlock(page, 'kt-jb')
				await button('taskList').click()
			},
			made: {
				...listAs('kt-jt', 'taskList', 'taskItem'),
				'kt-jt-1': 'taskItem in kt-jt, ticked',
				...listAs('kt-jb', 'taskList', 'taskItem'),
			},
		},
		// On the page, a block selected as a whole took the page's settings, which are none: in a
		// Card, it took the Card's.
		{
			kind: 'the heading 2 button, a line in a Card selected as a whole',
			html: card('kt-h'),
			ids: ['kt-h-p'],
			change: async () => {
				await selectBlock(page, 'kt-h-p')
				await button('heading 2').click()
			},
			made: { 'kt-h-p': 'heading in kt-h' },
		},
		{
			kind: 'Change Type to heading 1, a line in a Card selected as a whole',
			html: card('kt-m'),
			ids: ['kt-m-p'],
			change: async () => {
				await selectBlock(page, 'kt-m-p')
				await changeTypeTo('heading 1')
			},
			made: { 'kt-m-p': 'heading in kt-m' },
		},
		{
			kind: "the list's orderedList button, the cursor in a nested item, the node path on the outer list",
			html: nested('kt-nb'),
			ids: nestedIds('kt-nb'),
			change: async () => {
				await cursorInView(page, 'kt-nb-3p', 1)
				await pickInPath(page, onThePage)
				await button('orderedList').click()
			},
			made: nestedAs('kt-nb', ['orderedList', 'listItem'], bullets),
			selected: 'kt-nb-3p at 1',
		},
		{
			kind: "the list's taskList button, text selected across its items",
			html: list('kt-ts'),
			ids: listIds('kt-ts'),
			change: async () => {
				await cursorAt(page, 'kt-ts-1p', 1, ['kt-ts-2p', 2])
				await pickInPath(page, onThePage)
				await button('taskList').click()
			},
			made: listAs('kt-ts', 'taskList', 'taskItem'),
			selected: 'kt-ts-1p at 1 to kt-ts-2p at 2',
		},
		{
			kind: "the list's orderedList button on a bullet list just above a numbered list",
			html: list('kt-ja') + list('kt-jn', 'ol'),
			ids: [...listIds('kt-ja'), ...listIds('kt-jn')],
			change: async () => {
				await cursorInView(page, 'kt-ja-1p', 1)
				await pickInPath(page, onThePage)
				await button('orderedList').click()
			},
			made: {
				...listAs('kt-ja', 'orderedList', 'listItem'),
				...listAs('kt-jn', 'orderedList', 'listItem'),
			},
		},
		// The lists inside stay as they are, ticks and all.
		{
			kind: "the list's bulletList button on a to-do list holding a to-do list",
			html:
				`<ul data-type="taskList" ${ownSettings('kt-tt')}><li data-type="taskItem" data-checked="false" ${ownSettings('kt-tt-1')}>`
				+ `<p ${ownSettings('kt-tt-1p')}>One</p><ul data-type="taskList" ${ownSettings('kt-tt-in')}>`
				+ `<li data-type="taskItem" data-checked="true" ${ownSettings('kt-tt-3')}><p ${ownSettings('kt-tt-3p')}>Inner</p></li></ul></li></ul>`,
			ids: nestedIds('kt-tt'),
			change: async () => {
				await selectBlock(page, 'kt-tt')
				await button('bulletList').click()
			},
			made: {
				...nestedAs('kt-tt', bullets, ['taskList', 'taskItem']),
				'kt-tt-3': 'taskItem in kt-tt-in, ticked',
			},
		},
		{
			kind: "the slash menu's orderedList, the cursor in a bullet item",
			html: list('kt-sl'),
			ids: listIds('kt-sl'),
			change: async () => {
				await cursorInView(page, 'kt-sl-1p', 'One'.length)
				await page.keyboard.type(' /Ordered')
				await page.locator('.dropdown-menu .menu-item', { hasText: 'orderedList' }).click()
			},
			made: listAs('kt-sl', 'orderedList', 'listItem'),
		},
		// The line's own button takes one item out, as for a bullet line. Last, as the button is
		// new: the rows before it then run without it too.
		{
			kind: "the line's taskList button in a to-do item",
			html: tasks('kt-l'),
			ids: listIds('kt-l'),
			change: async () => {
				await cursorInView(page, 'kt-l-2p', 1)
				await pickInPath(page, inAnItem)
				await button('taskList').click()
			},
			made: {
				'kt-l': 'taskList in doc',
				'kt-l-1': 'taskItem in kt-l, ticked',
				'kt-l-1p': 'paragraph in kt-l-1',
				'kt-l-2p': 'paragraph in doc',
			},
		},
	]
	// A line between, so that no two lists join; put in outside the undo history, so that an Undo
	// below takes back only the change before it.
	await page.evaluate(
		(html) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor
				.chain()
				.command(({ tr }) => {
					tr.setMeta('addToHistory', false)
					return true
				})
				.insertContentAt(editor.state.doc.content.size, html)
				.run()
		},
		cases.map(({ html }) => `${html}<p>Between</p>`).join(''),
	)
	for (const { kind, ids, change, made, selected, undone } of cases) {
		await change()
		await settle(page)
		expect.soft(await typesWithSettings(page, ids), kind).toEqual(made)
		if (selected) expect.soft(await selectedPlace(page), `${kind}: selected`).toBe(selected)
		if (!undone) continue
		await page.keyboard.press('ControlOrMeta+z')
		await settle(page)
		expect.soft(await typesWithSettings(page, ids), `${kind}, undone`).toEqual(undone)
	}

	// An Alt-drag copy holds the very lines of the list copied: after a list button the cursor is
	// still in the copy (dropBlocks, multiSelect.ts).
	await insertAtEnd(
		page,
		'<ul id="kt-copied"><li><p>One</p></li><li><p>Two</p></li></ul><p id="kt-copy-under">Under</p>',
	)
	const copyAt = await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		let [list, under] = [-1, -1]
		editor.state.doc.forEach((node, pos) => {
			if (node.attrs['id'] === 'kt-copied') list = pos
			if (node.attrs['id'] === 'kt-copy-under') under = pos + node.nodeSize
		})
		const copied = editor.state.doc.nodeAt(list)!
		editor.view.dispatch(editor.state.tr.insert(under, copied))
		// In the copy's second line, one letter in.
		const at = under + 1 + copied.firstChild!.nodeSize + 3
		editor.chain().focus().setTextSelection(at).run()
		return editor.state.doc.resolve(at).index(0)
	})
	await pickInPath(page, onThePage)
	await button('taskList').click()
	await settle(page)
	expect
		.soft(
			await page.evaluate(() => {
				const { doc, selection } =
					document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
				const { $head } = selection
				return `${doc.child($head.index(0)).type.name} ${$head.index(0)}, "${$head.parent.textContent}" at ${$head.parentOffset}`
			}),
			'a copied list: the cursor after taskList',
		)
		.toBe(`taskList ${copyAt}, "Two" at 1`)
})

// Ids the author gives are theirs, even two the same: the validator, once built, warns of those
// (client/src/assets/sf-system.md, "Validator and linter"). The Attributes panel saves an id as a
// setting of the block that's there, so the block isn't put in anew.
test('ids the author gives are kept, even two the same', async ({ page }) => {
	await insertAtEnd(
		page,
		'<p id="given">Has the id</p><p id="give-p">A paragraph</p><img id="give-img" src="/favicon.ico">'
			+ '<iframe data-youtube-video id="give-video" src="https://www.youtube.com/embed/3lTUAWOgoHs"></iframe>'
			+ '<hr id="give-line">',
	)
	for (const id of ['give-p', 'give-img', 'give-video', 'give-line']) {
		await selectBlock(page, id)
		const tune = page.locator('.floating-toolbar button:has(span:text-is("tune"))')
		await tune.click()
		const panel = page.locator(`#${await tune.getAttribute('popovertarget')}`)
		await panel.getByLabel('id', { exact: true }).fill('given')
		await page.keyboard.press('Enter')
		await page.keyboard.press('Escape')
		await settle(page)
	}
	expect
		.soft(
			(await withId(page, 'given')).map(({ type }) => type),
			'given in the panel',
		)
		.toEqual([
			'paragraph',
			'paragraph',
			'image',
			'youtube',
			'horizontalRule',
		])

	await switchView(page, true)
	await replaceCode(
		page,
		'<p id="written">One</p><p id="written">Two</p><p id="move-under">Under</p>',
	)
	await switchView(page, false)
	expect
		.soft(await textsWithId(page, 'written'), 'written in the code view')
		.toEqual(['One', 'Two'])

	// The second of the two each time.
	await dragUnder(page, 'written', 'move-under')
	const [, moved] = await withId(page, 'written')
	expect.soft(await textsWithId(page, 'written'), 'one moved').toEqual(['One', 'Two'])
	expect
		.soft(moved?.at, 'one moved, under')
		.toBeGreaterThan((await withId(page, 'move-under'))[0]!.at)
	await cursorInView(page, 'written', 1)
	await page.keyboard.type('x')
	await (await openMenu(page, 'change_circle')).getByText('heading 2', { exact: true }).click()
	await page.locator('.floating-toolbar').getByRole('button', { name: 'blockquote' }).click()
	await settle(page)
	expect
		.soft(
			(await withId(page, 'written')).map(({ type, text }) => `${type} "${text}"`),
			'one typed in, changed and wrapped',
		)
		.toEqual(['paragraph "One"', 'heading "Txwo"'])
})

// Undo and redo put back what was there: a pasted copy and the id taken off it go and come back
// together, and a block deleted comes back with its id, though another block has it.
test('undo and redo put the ids back as they were', async ({ page }) => {
	// Outside the undo history: put in just before, it would undo with the paste.
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		editor
			.chain()
			.setMeta('addToHistory', false)
			.insertContentAt(
				editor.state.doc.content.size,
				'<p id="undo-twin">One</p><p id="undo-twin">Two</p><p id="undo-p">Copy me</p>',
			)
			.run()
	})
	const copied = await withId(page, 'undo-p')
	await pasteCopy(page, 'undo-p')
	for (const [step, copies] of [
		['pasted', 2],
		['undone', 1],
		['redone', 2],
	] as const) {
		if (step === 'undone') await undo(page)
		if (step === 'redone') {
			await page.keyboard.press('ControlOrMeta+Shift+z')
			await settle(page)
		}
		expect.soft(await copiesOf(page, 'undo-p'), step).toBe(copies)
		expect.soft(await withId(page, 'undo-p'), `${step}: undo-p`).toEqual(copied)
	}

	// One of two blocks the author gave one id.
	await page.evaluate(
		(at) => {
			const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
			editor.chain().focus().setNodeSelection(at).run()
		},
		(await withId(page, 'undo-twin'))[0]!.at,
	)
	await page.keyboard.press('Backspace')
	await settle(page)
	expect.soft(await textsWithId(page, 'undo-twin'), 'one of two deleted').toEqual(['Two'])
	await undo(page)
	expect.soft(await textsWithId(page, 'undo-twin'), 'undone').toEqual(['One', 'Two'])
	await page.keyboard.press('ControlOrMeta+Shift+z')
	await settle(page)
	expect.soft(await textsWithId(page, 'undo-twin'), 'redone').toEqual(['Two'])
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
	const code = await shownCode(page)
	await page.keyboard.type('abc')
	const typed = await shownCode(page)
	expect(typed).toContain('abc')
	expect(typed.replace('abc', ''), 'typed in the code, where its cursor is').toBe(code)
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

// Tables from elsewhere give their columns widths in the table's column list: the page keeps them,
// as the cells' own, as TipTap does.
test('a table written with column widths keeps them', async ({ page }) => {
	await switchView(page, true)
	await replaceCode(
		page,
		'<table><colgroup><col width="900"><col width="900"></colgroup><tbody><tr><td>One</td><td>Two</td></tr></tbody></table>',
	)
	await switchView(page, false)
	await expect(page.locator('.tiptap table td')).toHaveText(['One', 'Two'])
	expect((await pageContent(page)).match(/"colwidth":\[900\]/g), 'the widths kept').toHaveLength(
		2,
	)
})

/**
 * Each block of the type and text of the one with this id, in page order: its class and style as
 * saved and as drawn, a style as the browser reads it (copying writes one with a closing
 * semicolon).
 */
const looks = (page: Page, id: string) =>
	page.evaluate((id) => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const { doc } = editor.state
		let looked: ProseMirrorNode | undefined
		doc.descendants((node) => {
			if (node.attrs['id'] === id) looked ??= node
		})
		const found: string[] = []
		const read = document.createElement('i')
		doc.descendants((node, at) => {
			if (node.type !== looked!.type || node.textContent !== looked!.textContent) return
			const drawn = editor.view.nodeDOM(at) as HTMLElement
			read.setAttribute('style', node.attrs['style'] ?? '')
			found.push(
				`saved "${node.attrs['class']}" "${read.style.cssText}", `
					+ `drawn "${drawn.className}" "${drawn.style.cssText}"`,
			)
		})
		return found
	}, id)

// A built-in block's look is drawn, as a component's template draws its own (ownLook.ts): it was
// written into the block's HTML, so a copy saved it as the block's own, and the code view showed it
// on the copy only. A heading's was saved on every heading.
test("a block's own look is drawn, never saved, copied or written in the code view", async ({
	page,
}) => {
	await insertAtEnd(
		page,
		'<blockquote id="look-quote"><p>Quote</p></blockquote>'
			+ '<pre id="look-code"><code>let look = 1</code></pre>'
			+ '<ul id="look-bullets"><li><p>Bullet</p></li></ul>'
			+ '<ol id="look-numbers"><li><p>Number</p></li></ol>'
			+ '<ul data-type="taskList" id="look-todo"><li data-type="taskItem" id="look-todo-item" data-checked="false"><p>To do</p></li></ul>'
			+ '<table id="look-table"><tr><td id="look-cell"><p>A</p></td><td><p>B</p></td></tr></table>'
			+ '<table id="look-table-own" style="width: 300px"><tr><td><p>Own</p></td></tr></table>'
			+ '<table id="look-table-wide"><tr><td colwidth="100"><p>W</p></td><td colwidth="150"><p>X</p></td></tr></table>'
			+ '<h2 id="look-h2">Level</h2>'
			+ '<h2 id="look-h2-own" class="sf-heading-1">Own prominence</h2>',
	)
	await settle(page)
	const blocks = {
		'look-quote': ['look-quote', 'class "sf sf-depth-1"'],
		'look-code': ['look-code', 'class "sf hljs"'],
		'look-bullets': ['look-bullets', 'class "sf"'],
		'look-numbers': ['look-numbers', 'class "sf"'],
		'look-todo': ['look-todo-item', 'class "sl-split sf-gap-md"'],
		'look-table': ['look-table', 'style "min-width: 50px;"'],
		'look-table-own': ['look-table-own', 'its own style only'],
		'look-table-wide': ['look-table-wide', 'style "width: 250px;"'],
		'look-h2': ['look-h2', 'class "sf-heading-2"'],
		'look-h2-own': ['look-h2-own', 'its own class only'],
	} as const
	for (const id of Object.keys(blocks)) await pasteCopy(page, id)
	const drawnAs = {
		'class "sf sf-depth-1"': 'saved "" "", drawn "sf sf-depth-1" ""',
		'class "sf hljs"': 'saved "" "", drawn "sf hljs" ""',
		'class "sf"': 'saved "" "", drawn "sf" ""',
		'class "sl-split sf-gap-md"': 'saved "" "", drawn "sl-split sf-gap-md" ""',
		'style "min-width: 50px;"': 'saved "" "", drawn "" "min-width: 50px;"',
		'its own style only': 'saved "" "width: 300px;", drawn "" "width: 300px;"',
		'style "width: 250px;"': 'saved "" "", drawn "" "width: 250px;"',
		'class "sf-heading-2"': 'saved "" "", drawn "sf-heading-2" ""',
		'its own class only': 'saved "sf-heading-1" "", drawn "sf-heading-1" ""',
	}
	for (const [copied, [id, look]] of Object.entries(blocks))
		expect.soft(await looks(page, id), `${copied}, and its copy: ${look}`).toEqual([
			drawnAs[look],
			drawnAs[look],
		])

	// The look follows the block as it changes.
	await cursorAt(page, 'look-h2', 0)
	await page.keyboard.press('ControlOrMeta+Alt+3')
	await cursorInView(page, 'look-cell', 1)
	await page.locator('.floating-toolbar').getByRole('button', { name: '+ Col →' }).click()
	await settle(page)
	expect
		.soft((await looks(page, 'look-h2'))[0], 'made H3')
		.toBe('saved "" "", drawn "sf-heading-3" ""')
	expect
		.soft((await looks(page, 'look-table'))[0], 'a column added')
		.toBe('saved "" "", drawn "" "min-width: 75px;"')

	await switchView(page, true)
	const code = await shownCode(page)
	const written = code.slice(code.indexOf('<blockquote id="look-quote"'))
	const settings = written.match(/ (class|style)="[^"]*"/g)?.map((set) => set.replace(';"', '"'))
	expect.soft(settings, 'the code view').toEqual([
		' style="width: 300px"',
		' class="sf-heading-1"',
		' style="width: 300px"',
		' class="sf-heading-1"',
	])
	await expect
		.soft(shownEditor(page).locator('pre'), "the code view's own code block")
		.toHaveClass('sf hljs')
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

// The code view's code replaced, as one edit.
const writeCode = (page: Page, code: string) =>
	page.evaluate((code) => {
		const editor = [...document.querySelectorAll<TiptapEditorHTMLElement>('.tiptap')].find(
			(el) => el.checkVisibility(),
		)!.editor!
		editor.commands.setContent({
			type: 'doc',
			content: [{ type: 'codeBlock', content: [{ type: 'text', text: code }] }],
		})
	}, code)

// The messages shown, dismissed: out of the way of the Code view button.
const dismissMessages = async (page: Page) => {
	for (const dismiss of await page
		.locator('.toast')
		.getByRole('button', { name: 'Dismiss' })
		.all())
		await dismiss.click()
	await expect(page.locator('.toast')).toHaveCount(0)
}

// It used to drop what it couldn't keep without a word: a paragraph's title, a comment.
test("code the page can't keep keeps the code view open, saying what", async ({ page }) => {
	const opened = await pageContent(page)
	await switchView(page, true)
	const refused: [code: string, message: string][] = [
		[
			'<p title="Note" lang="fr" dir="rtl" data-note="1" onclick="go()">P</p>',
			`The page can't keep title="Note" on <p> (and 4 more).`,
		],
		['<p id="intro" title="Note">P</p>', `The page can't keep title="Note" on <p id="intro">.`],
		[
			'<p><a href="https://example.test" id="here">Link</a></p>',
			`The page can't keep id="here" on <a>.`,
		],
		['<p>Kept</p><!-- a note -->', "The page can't keep comments: <!-- a note -->."],
		// Inline code is written with a class of its own.
		['<p><code class="mine">c</code></p>', "The page can't keep the class mine on <code>."],
		// A see-through step with no name isn't one.
		[
			'<p><span class="sf-color-danger sf-color-alpha-">C</span></p>',
			"The page can't keep the class sf-color-alpha- on <span>.",
		],
		[
			'<p><span style="color: red; font-size: 2em">Big</span></p>',
			"The page can't keep font-size in the style of <span>.",
		],
		[
			'<pre><code>a<strong>b</strong></code></pre>',
			"The page can't keep <strong>b</strong> inside <code>.",
		],
		[
			'<p><strong><strong>x</strong></strong></p>',
			"The page can't keep <strong><strong>x</strong></strong> inside <p>.",
		],
		['<pre>a<br>b</pre>', "The page can't keep <br> inside <pre>."],
		[
			'<p><a href="https://example.test"></a>Text</p>',
			`The page can't keep <a href="https://example.test"></a> inside <p>.`,
		],
		[
			'<pre><code class="language-js" title="Code">x</code></pre>',
			`The page can't keep title="Code" on <code>.`,
		],
		[
			'<table><thead class="head"><tr><th>H</th></tr></thead></table>',
			"The page can't keep the class head on <thead>.",
		],
		// What the page draws of a setting, written: a tick box (TipTap's own markup; the tick is the
		// item's data-checked), a column list but for the widths its cells read.
		[
			'<ul data-type="taskList"><li data-type="taskItem" data-checked><label><input type="checkbox" checked><span></span></label><div><p>Done</p></div></li></ul>',
			`The page can't keep <label><input type="checkbox" checked="… inside <li> (and 3 more).`,
		],
		[
			'<table><colgroup><col style="min-width: 25px"></colgroup><tr><td>Cell</td></tr></table>',
			"The page can't keep min-width in the style of <col>.",
		],
		// A column's width as a style isn't read: the second column's is lost.
		[
			'<table><colgroup><col width="100"><col style="width: 300px"></colgroup><tr><td>A</td><td>B</td></tr></table>',
			"The page can't keep width in the style of <col>.",
		],
		// Only the column list is kept for the widths its cells read, not what's around the table.
		[
			'<b><table><colgroup><col width="100"></colgroup><tr><td><pre><code>x</code></pre></td></tr></table></b>',
			`The page can't keep <b><table><colgroup><col width="100"></….`,
		],
		// A column's width the cell doesn't read, its own being its own: the first table's is kept.
		[
			'<table><colgroup><col width="300"></colgroup><tr><td>A</td></tr></table><table><colgroup><col width="300"></colgroup><tr><td colwidth="100">B</td></tr></table>',
			`The page can't keep <colgroup><col width="300"></colgroup> inside <table> (and 1 more).`,
		],
		// A style the page makes into bold, but doesn't keep (owner, 2026-10-27: refused for now), and
		// one it only looks at.
		[
			'<p><em style="font-weight: bold">Bold</em></p>',
			"The page can't keep font-weight in the style of <em>.",
		],
		[
			'<p><b style="font-weight: 300">Bold</b></p>',
			"The page can't keep font-weight in the style of <b>.",
		],
		// What a rule that takes an element apart reads of it isn't kept.
		[
			'<table><tbody id="rows"><tr><td>A</td></tr></tbody></table>',
			`The page can't keep id="rows" on <tbody>.`,
		],
		// A value the page can't read leaves the rest of the code checked.
		[
			'<ol start=""><li><p>A</p></li></ol><p title="Note">P</p>',
			`The page can't keep title="Note" on <p>.`,
		],
		// A comment in a style hides nothing after it.
		[
			'<p><span style="color: red; /* big */ font-size: 2em">B</span></p>',
			"The page can't keep font-size in the style of <span>.",
		],
		// A style's properties as written, not their parts.
		[
			'<p><span style="color: red; margin: 0 auto">Centred</span></p>',
			"The page can't keep margin in the style of <span>.",
		],
		// Each asked about on its own: the width, which the cells read, is kept.
		[
			'<table><colgroup><col width="900" title="Wide"></colgroup><tr><td>Cell</td></tr></table>',
			`The page can't keep title="Wide" on <col>.`,
		],
		[`<p title='say "hi"'>P</p>`, `The page can't keep title="say &quot;hi&quot;" on <p>.`],
		[
			'<layout-card variant="wide"><p>C</p></layout-card>',
			`The page can't keep variant="wide" on <layout-card>.`,
		],
		// A video's start is read from its address only.
		[
			'<iframe data-youtube-video src="https://www.youtube.com/embed/3lTUAWOgoHs" start="60"></iframe>',
			`The page can't keep start="60" on <iframe>.`,
		],
		[
			'<layout-columns columns="7"><p>C</p></layout-columns>',
			`The page can't read this code: Expected one of 2, 3, 4, got "7".`,
		],
	]
	for (const [code, message] of refused) {
		await writeCode(page, code)
		await codeViewButton(page).click()
		await expect.soft(page.getByText(message, { exact: true }), code).toBeVisible()
		await dismissMessages(page)
	}
	await expect(codeViewButton(page)).toHaveAttribute('aria-pressed', 'true')
	expect(await pageContent(page)).toBe(opened)
})

// What the page adds or rewrites itself, a setting at its default and what the page writes of a
// block itself never refuse the code.
test('code the page rewrites itself goes into the page', async ({ page }) => {
	const kept = [
		'<p style="color:red" class="  a   b ">Spaces</p>',
		'<p><a href="https://example.test">a</a><a href="https://example.test">b</a> <b>B</b> <i>I</i> <del>D</del></p>',
		'<table><tbody><tr><td colspan="1">Cell</td></tr></tbody></table>',
		'<ol start="1"><li><p>One</p></li></ol>',
		'<layout-columns columns="2"><p>C</p></layout-columns>',
		'<pre><code class="language-js">x</code></pre>',
		// A language the code blocks aren't coloured in, kept and shown plain.
		'<pre><code class="language-haskell">main = pure ()</code></pre>',
		'<ul data-type="taskList"><li data-type="taskItem" data-checked><p>Done</p></li></ul>',
		// Read and written the page's own way: a cell's alignment as text-align; an empty id.
		'<table><tr><td align="center" style="text-align: center">Cell</td></tr></table>',
		'<p id="">No id</p>',
		// A column's width the cells read, though the first row has fewer cells than columns; a column
		// without one holds its place.
		'<table><colgroup><col width="100"><col width="200"></colgroup><tr><td>A</td></tr><tr><td>1</td><td>2</td></tr></table>',
		'<table><colgroup><col><col width="200"></colgroup><tr><td>A</td><td>B</td></tr></table>',
		'<div data-youtube-video><iframe src="https://www.youtube.com/embed/3lTUAWOgoHs"></iframe></div>',
		// A colour's classes, written back as they came, one the theme makes no colour for too.
		'<p><span class="sf-color-primary sf-color-alpha-3">Colour</span></p>',
	]
	for (const code of kept) {
		await switchView(page, true)
		await writeCode(page, code)
		await codeViewButton(page).click()
		await expect.soft(codeViewButton(page), code).toHaveAttribute('aria-pressed', 'false')
		// Refused: out of the code view, for the next.
		if ((await codeViewButton(page).getAttribute('aria-pressed')) === 'true') {
			await dismissMessages(page)
			await writeCode(page, '<p>Next</p>')
			await codeViewButton(page).click()
		}
		await expect(codeViewButton(page)).toHaveAttribute('aria-pressed', 'false')
	}
})

// The page's own code, as the code view writes it, reads back with nothing refused: a cell's
// alignment, which it writes as its style, and a bold space at a line's end, which the page takes
// out.
test("the page's own code for an aligned cell and a bold space goes back into the page", async ({
	page,
}) => {
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const text = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
		editor.commands.setContent({
			type: 'doc',
			content: [
				{
					type: 'table',
					content: [
						{
							type: 'tableRow',
							content: [
								{
									type: 'tableCell',
									attrs: { align: 'center' },
									content: [text('Cell')],
								},
							],
						},
					],
				},
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'Hello' },
						{ type: 'text', text: ' ', marks: [{ type: 'bold' }] },
					],
				},
			],
		})
	})
	await switchView(page, true)
	await writeCode(page, `${await shownCode(page)}\n<p>Added in the code view</p>`)
	await switchView(page, false)
	await expect(page.getByText('Added in the code view', { exact: true })).toHaveCount(1)
})

for (const [name, seed, last] of [
	['the test page', 'tests', '#align-cluster-x-end-last'],
	['the demo page', 'true', '.tiptap.ProseMirror li:has-text("HTML source (code view) toggle")'],
] as const) {
	test(`${name}'s own code goes back into the page`, async ({ page, themeClass }) => {
		await openSeeded(page, seed, last, themeClass)
		await switchView(page, true)
		const code = await shownCode(page)
		await writeCode(page, `${code}\n<p>Added in the code view</p>`)
		await switchView(page, false)
		await expect(page.getByText('Added in the code view', { exact: true })).toHaveCount(1)
	})
}

// The code view writes the page as the page writes it (as a copy is), leaving out what every block
// of its kind has, and the page reads it back as it was. It had a writer of its own, which had no
// colour or font, so it wouldn't open, and wrote a video's start where the page doesn't read it.
test('the code view writes each block as the page does, and reads it back the same', async ({
	page,
}) => {
	// What's on the page, as the page reads it, and the code view's code for it.
	const rows: [onThePage: string, code: string][] = [
		[
			'<p><span style="color: red;">Red</span> and <span class="sf-font-2 sf-text-lg">big</span></p>',
			'<p><span style="color: red;">Red</span> and <span class="sf-font-2 sf-text-lg">big</span></p>',
		],
		// A theme colour as its names, one the theme has no class for too, a see-through step, and
		// one with a colour not from the theme beside it.
		[
			'<p><span class="sf-color-primary">A</span> <span class="sf-color-primary-5 sf-color-alpha-3">B</span> <span class="sf-color-danger" style="color: red;">C</span></p>',
			'<p><span class="sf-color-primary">A</span> <span class="sf-color-primary-5 sf-color-alpha-3">B</span> <span class="sf-color-danger" style="color: red;">C</span></p>',
		],
		[
			'<iframe data-youtube-video src="https://www.youtube.com/embed/3lTUAWOgoHs?start=30"></iframe>',
			'<iframe src="https://www.youtube.com/embed/3lTUAWOgoHs?start=30&amp;rel=1" data-youtube-video=""></iframe>',
		],
		// What every one of its kind has, left out: a link's target, a Stack's align, an unticked
		// item's data-checked, inline code's sf.
		[
			'<p><a href="/a" target="_blank">Link</a> and <code class="sf">code</code></p>',
			'<p><a href="/a">Link</a> and <code>code</code></p>',
		],
		[
			'<layout-stack align="stretch"><p>Stack</p></layout-stack>',
			'<layout-stack><p>Stack</p></layout-stack>',
		],
		// Each setting once: a to-do item's tick, a column's width, not what the page draws of them
		// (the tick box, the column list).
		[
			'<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>Done</p></div></li><li data-type="taskItem" data-checked="false"><p>To do</p></li></ul>',
			'<ul data-type="taskList"><li data-checked="true" data-type="taskItem"><p>Done</p></li><li data-type="taskItem"><p>To do</p></li></ul>',
		],
		[
			'<table><colgroup><col style="width: 120px"><col></colgroup><tr><td colwidth="120" style="text-align: center;"><p>Centred</p></td><td><p>B</p></td></tr></table>',
			'<table><tbody><tr><td colwidth="120" style="text-align: center;"><p>Centred</p></td><td><p>B</p></td></tr></tbody></table>',
		],
	]
	// Code as its elements, attributes and words, however it's spaced; without the empty line the
	// page keeps after a last block that isn't one.
	const tidied = (code: string) =>
		page.evaluate((code) => {
			const body = new DOMParser().parseFromString(code, 'text/html').body
			const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
			const texts: Text[] = []
			for (let at = walker.nextNode(); at; at = walker.nextNode()) texts.push(at as Text)
			for (const text of texts) {
				text.data = text.data.trim()
				if (!text.data) text.remove()
			}
			return body.innerHTML.replace(/<p><\/p>$/, '')
		}, code)
	for (const [onThePage, code] of rows) {
		await page.evaluate((html) => {
			document
				.querySelector<TiptapEditorHTMLElement>('.tiptap')!
				.editor!.commands.setContent(html)
		}, onThePage)
		const before = await pageContent(page)
		await switchView(page, true)
		const shown = await shownCode(page)
		expect.soft(await tidied(shown), onThePage).toBe(await tidied(code))
		await writeCode(page, `${shown}\n<p>Added in the code view</p>`)
		await switchView(page, false)
		const after = await page.evaluate(() => {
			const json = document
				.querySelector<TiptapEditorHTMLElement>('.tiptap')!
				.editor!.getJSON()
			json.content?.pop()
			return JSON.stringify(json)
		})
		expect.soft(after, `${onThePage}, read back`).toBe(before)
	}
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
	await expect(menu.locator('.picker-item.sf-on-current')).toHaveText('Plain text')
	// Each by the name people know it by.
	await expect(menu.locator('.picker-item')).toHaveText([
		'Plain text',
		'HTML',
		'CSS',
		'JavaScript',
		'TypeScript',
		'JSON',
		'Python',
		'Bash',
		'SQL',
		'YAML',
		'Markdown',
		'C',
		'C++',
		'C#',
		'Java',
		'Go',
		'Rust',
		'PHP',
		'Ruby',
		'Swift',
		'Kotlin',
	])
	await menu.locator('.picker-item', { hasText: 'Python' }).click()
	await expect(code).toHaveClass(/(^|\s)language-python(\s|$)/)
	const saved = await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		let language: string | undefined
		editor.state.doc.descendants((node) => {
			if (node.attrs?.['id'] === 'line-code-bleed') language = node.attrs['language']
		})
		return language
	})
	expect(saved).toBe('python')
})

// Coloured only in the language it's set to, never a guess, which can be the wrong one.
test('a code block is coloured in its language, and plain with none or one not in the list', async ({
	page,
}) => {
	await page.evaluate(() => {
		const editor = document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!
		const block = (id: string, language: string) =>
			`<pre id="${id}"><code${language && ` class="language-${language}"`}>const a = 1 // note</code></pre>`
		editor.commands.setContent(
			block('none', '')
				+ block('set', 'javascript')
				+ block('short', 'js')
				+ block('other', 'haskell'),
		)
	})
	await settle(page)
	const coloured = (id: string) => page.locator(`#${id} [class^="hljs-"]`).count()
	expect(await coloured('none'), 'no language').toBe(0)
	expect(await coloured('set'), 'JavaScript').toBeGreaterThan(0)
	expect(await coloured('short'), 'its short name').toBeGreaterThan(0)
	expect(await coloured('other'), 'a language not in the list').toBe(0)
})
