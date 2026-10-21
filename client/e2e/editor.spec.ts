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
				const name = node.attrs.id ?? node.textContent
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
			document.body.dataset.dragImage = [...image.querySelectorAll('.tiptap > *')]
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
		editor.state.doc.forEach((node) => ids.push(node.attrs.id))
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
		return 'node' in selection ? (selection as NodeSelection).node.attrs.id : null
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
				+ (node.attrs.id ? `#${node.attrs.id}` : '')
			if (node.isTextblock) return node.attrs.id ? own : `${own}"${node.textContent}"`
			const held: string[] = []
			node.forEach((child) => held.push(shape(child)))
			return held.length ? `${own}[${held.join(' ')}]` : own
		}
		const shapes: string[] = []
		editor.state.doc.forEach((node) => {
			if (shapes.length || node.attrs.id === id) shapes.push(shape(node))
		})
		return shapes.join(' ')
	}, id)
/** The id of the block selected whole, if one is. */
const selectedId = (page: Page) =>
	page.evaluate(() => {
		const { selection } =
			document.querySelector<TiptapEditorHTMLElement>('.tiptap')!.editor!.state
		return 'node' in selection ? ((selection as NodeSelection).node.attrs.id as string) : null
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
				document.body.dataset.dropped = ''
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
					if (node.attrs?.id === id) found = pos + 1 + offset
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
					node.attrs.id && 'id',
					/(^|\s)lead(\s|$)/.test(node.attrs.class ?? '') && 'class',
					node.attrs.style && 'style',
					node.attrs.checked && 'ticked',
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
// (patches/@tiptap__core@3.31.4.patch). An item and the paragraph in it each split so.
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
// (patches/@tiptap__core@3.31.4.patch).
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
// start undoes with it, as with TipTap's own Enter (patches/@tiptap__core@3.31.4.patch).
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
// TipTap makes it anew, with nothing on it (patches/@tiptap__core@3.31.4.patch). When the line has
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
				if (node.attrs.id === id)
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
			if (node.attrs.id === id) copied ??= node
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
				&& editor.state.doc.resolve(pos).node().attrs.id === id
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

	await cursorInView(page, 'out-button-item', 1)
	await page.locator('.floating-toolbar').getByRole('button', { name: 'Bullet List' }).click()
	await settle(page)
	expect.soft(await textsWithId(page, 'out-button'), 'a list, the Bullet List button').toEqual([
		'Above',
	])

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
			if (node.attrs.id !== 'grow-table') return
			node.descendants((inner) => {
				if (inner.type.name === 'tableCell') found.cells++
				if (inner.attrs.id) found.ids.push(inner.attrs.id)
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
	await toolbar.getByRole('button', { name: 'Blockquote' }).click()
	await settle(page)
	expect.soft(await changed(), 'wrapped in a quote').toEqual(['paragraph "Change me"'])
	// Wrapped, the toolbar is on the quote.
	await toolbar.getByRole('button', { name: 'Unwrap' }).click()
	await settle(page)
	expect.soft(await changed(), 'unwrapped').toEqual(['paragraph "Change me"'])
	await cursorInView(page, 'change-p', 1)
	await (await openMenu(page, 'change_circle')).getByText('Heading 2', { exact: true }).click()
	await settle(page)
	expect.soft(await changed(), 'changed with Change Type').toEqual(['heading "Change me"'])
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
	await (await openMenu(page, 'change_circle')).getByText('Heading 2', { exact: true }).click()
	await page.locator('.floating-toolbar').getByRole('button', { name: 'Blockquote' }).click()
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
