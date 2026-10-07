import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { copiedText, openSeeded, setClipboard, settle } from './helpers'

// A component block's own parts and its slot, mostly on the demo's interactive block (TiptapTest):
// its heading, text and button aren't editable, its slot holds page blocks. Any component that
// draws parts of its own gets these rules; layouts, which draw none, stay as they were. Rules
// decided with the owner (sf-system-todo.md, 18).

const INTERACTIVE = 'a47e28a5-fd9d-40e9-bd74-819301247e9d'

test.beforeEach(async ({ page, themeClass }) => {
	await openSeeded(page, 'true', '.tiptap .code-block select', themeClass)
	await heading(page).scrollIntoViewIfNeeded()
	await settle(page)
	await setClipboard(page, '(nothing copied)')
})

const heading = (page: Page) =>
	page.locator('.tiptap h1', { hasText: 'Uneditable Heading' }).first()
const intro = (page: Page) =>
	page.locator('.tiptap p', { hasText: 'These sections are interactive' }).first()
const SLOT_TEXT = 'This is the editable slot — select it, format it, or delete it.'
const slotText = (page: Page) => page.locator('.tiptap p', { hasText: 'This is the editable slot' })
const textAbove = (page: Page) => page.locator('.tiptap p', { hasText: 'Any Vue component can be' })
const textBelow = (page: Page) => page.locator('.tiptap p', { hasText: 'The component above has' })

/** The page's text, as saved. */
const pageText = (page: Page): Promise<string> =>
	page.evaluate(() => (document.querySelector('.tiptap') as any).editor.state.doc.textContent)

/** Where the editor's cursor is: the whole interactive block, or the text of the paragraph it's in. */
const cursor = (page: Page) =>
	page.evaluate((INTERACTIVE) => {
		const { selection } = (document.querySelector('.tiptap') as any).editor.state
		if (selection.node)
			return selection.node.type.name === INTERACTIVE ? 'the block' : 'another block'
		return selection.$from.parent.textContent as string
	}, INTERACTIVE)

// Each click is let land before typing, as a person's would: keys pressed within the same frame
// reach the editor before it has read where the click put the cursor (so on any of its text).

async function dragAcross(page: Page, from: Locator, to: Locator) {
	const start = (await from.boundingBox())!
	const end = (await to.boundingBox())!
	await page.mouse.move(start.x + 2, start.y + start.height / 2)
	await page.mouse.down()
	await page.mouse.move(end.x + end.width * 0.6, end.y + end.height / 2, { steps: 10 })
	await page.mouse.up()
	await settle(page)
}

test('typing after a click in the slot goes into the slot', async ({ page }) => {
	await slotText(page).click()
	await settle(page)
	await page.keyboard.type('XYZ')
	const text = await cursor(page)
	expect(text).toContain('XYZ')
	expect(text.replace('XYZ', '')).toBe(SLOT_TEXT)
})

test('typing goes into the slot when the editor puts the cursor there', async ({ page }) => {
	await page.evaluate(() => {
		const editor = (document.querySelector('.tiptap') as any).editor
		editor.state.doc.descendants((node: any, pos: number) => {
			if (node.textContent.startsWith('This is the editable slot') && node.isTextblock)
				editor
					.chain()
					.focus()
					.setTextSelection(pos + 1)
					.run()
		})
	})
	await settle(page)
	await page.keyboard.type('W')
	expect(await cursor(page)).toBe(`W${SLOT_TEXT}`)
})

// Focus lands on the block's locked box, where keys do nothing; with the editor focused instead,
// typing would replace the selected block.
test("a click on the block's own text selects the block, and typing changes nothing", async ({
	page,
}) => {
	const before = await pageText(page)
	await heading(page).click()
	await settle(page)
	expect(await cursor(page)).toBe('the block')
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
	await expect(heading(page)).toHaveText('Uneditable Heading')
})

test("a drag across the block's own text copies those words, not the block", async ({ page }) => {
	await dragAcross(page, heading(page), intro(page))
	expect(await cursor(page)).not.toBe('the block')
	expect(await copiedText(page)).toMatch(/^Uneditable Heading These sections/)
})

// The editor's selection is still a word above, out of sight: cut and paste must not reach it.
test("with the block's own words highlighted, cut and paste change nothing", async ({ page }) => {
	const above = (await textAbove(page).boundingBox())!
	await page.mouse.dblclick(above.x + 20, above.y + above.height / 2)
	await settle(page)
	const before = await pageText(page)
	await dragAcross(page, heading(page), intro(page))
	await page.keyboard.press('ControlOrMeta+x')
	await settle(page)
	expect(await pageText(page), 'after cut').toBe(before)
	await page.keyboard.press('ControlOrMeta+v')
	await settle(page)
	expect(await pageText(page), 'after paste').toBe(before)
})

test('a click on highlighted words of the block selects the block', async ({ page }) => {
	await dragAcross(page, heading(page), intro(page))
	await heading(page).click()
	await settle(page)
	expect(await cursor(page)).toBe('the block')
})

test('a part the component adds later is not editable either', async ({ page }) => {
	const added = await heading(page).evaluate(async (h) => {
		const p = document.createElement('p')
		p.textContent = 'Added later'
		h.after(p)
		await new Promise((done) => setTimeout(done, 50))
		return p.isContentEditable
	})
	expect(added).toBe(false)
})

// Text a component writes straight beside its slot can't be marked; the box's lock covers it.
test("text beside the slot acts as the block's own: copied when dragged, still after a click", async ({
	page,
}) => {
	await slotText(page).evaluate((p) => {
		const slot = p.closest('[data-node-view-content]')!
		slot.before(document.createTextNode('Loose words beside the slot'))
	})
	const loose = page
		.locator('.tiptap [data-node-view-wrapper]', { hasText: 'Loose words' })
		.first()
	const at = await loose.evaluate((box) => {
		const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT)
		let text: Node | null
		while ((text = walker.nextNode())) if (text.textContent!.startsWith('Loose')) break
		const range = document.createRange()
		range.setStart(text!, 0)
		range.setEnd(text!, 'Loose words'.length)
		const { x, y, width, height } = range.getBoundingClientRect()
		return { x, y: y + height / 2, width }
	})
	await page.mouse.move(at.x + 1, at.y)
	await page.mouse.down()
	await page.mouse.move(at.x + at.width, at.y, { steps: 6 })
	await page.mouse.up()
	await settle(page)
	expect(await copiedText(page)).toMatch(/^L?oose words$/)

	const before = await pageText(page)
	await page.mouse.click(at.x + 4, at.y)
	await settle(page)
	expect(await cursor(page)).toBe('the block')
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
	await expect(loose).toContainText('Loose words beside the slot')
})

test("the block's button works and leaves the page as it was", async ({ page }) => {
	const before = await pageText(page)
	await page.locator('.tiptap button', { hasText: 'Click me' }).first().click()
	await expect(page.locator('.tiptap p', { hasText: 'Button clicked 1 times' })).toBeVisible()
	expect(await pageText(page)).toBe(before)
})

test("after a click on the block's own text, a click in the slot types there", async ({ page }) => {
	await heading(page).click()
	await slotText(page).click()
	await settle(page)
	await page.keyboard.type('Z')
	const text = await cursor(page)
	expect(text).toContain('Z')
	expect(text.replace('Z', '')).toBe(SLOT_TEXT)
})

test('the known-limit case is set up: text above, the block, text below', async ({ page }) => {
	const order = await page.evaluate(() => {
		const find = (text: string) =>
			[...document.querySelectorAll('.tiptap p, .tiptap h1')].find((el) =>
				el.textContent!.startsWith(text),
			)!
		const [above, block, below] = [
			'Any Vue component can be',
			'Uneditable Heading',
			'The component above has',
		].map(find) as [Element, Element, Element]
		const before = (a: Element, b: Element) =>
			!!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
		return before(above, block) && before(block, below)
	})
	expect(order).toBe(true)
})

// Known not to work yet (sf-system-todo.md, 18): the drag ends as a cursor where it stops, as it
// did before; across a Card it takes the Card. When fixed, Playwright reports "expected to fail,
// but passed": remove test.fail().
test('a drag from the text above to the text below takes the block whole', async ({ page }) => {
	test.fail()
	await dragAcross(page, textAbove(page), textBelow(page))
	await page.keyboard.press('Backspace')
	expect(await pageText(page)).not.toContain('This is the editable slot')
	await expect(heading(page)).toHaveCount(0)
})

test('an interactive block in the slot of another works the same', async ({ page }) => {
	await page.evaluate((INTERACTIVE) => {
		const editor = (document.querySelector('.tiptap') as any).editor
		let outer = -1
		editor.state.doc.descendants((node: any, pos: number) => {
			if (outer < 0 && node.type.name === INTERACTIVE) outer = pos
		})
		editor.commands.insertContentAt(outer + 1, {
			type: INTERACTIVE,
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Inner slot text' }] }],
		})
	}, INTERACTIVE)
	await settle(page)
	await page.locator('.tiptap p', { hasText: 'Inner slot text' }).click()
	await settle(page)
	await page.keyboard.type('X')
	const text = await cursor(page)
	expect(text).toContain('X')
	expect(text.replace('X', '')).toBe('Inner slot text')

	const before = await pageText(page)
	const innerHeading = page.locator('.tiptap h1', { hasText: 'Uneditable Heading' }).nth(1)
	await innerHeading.click()
	await settle(page)
	const selected = await page.evaluate(() => {
		const { selection } = (document.querySelector('.tiptap') as any).editor.state
		return selection.node?.textContent as string | undefined
	})
	expect(selected).toMatch(/^Inner/)
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
})

// Published pages are read-only from the start; here the open editor is switched.
test('in a read-only editor the slot and the block stay as they are', async ({ page }) => {
	await page.evaluate(() => (document.querySelector('.tiptap') as any).editor.setEditable(false))
	const before = await pageText(page)
	await slotText(page).click()
	await settle(page)
	await page.keyboard.type('R')
	await heading(page).click()
	await settle(page)
	await page.keyboard.type('R')
	expect(await pageText(page)).toBe(before)
})

// Every component block (layouts too): the click that ends a drag doesn't select the block.
test("a drag in a Card that ends in the Card's padding keeps the highlight", async ({ page }) => {
	const text = page.locator('.tiptap p', { hasText: 'Any block content can go inside' })
	await text.scrollIntoViewIfNeeded()
	const card = (await text.evaluate((p) => {
		const { right, top } = p.closest('.layout-card')!.getBoundingClientRect()
		return { x: right - 4, y: top + 4 }
	}))!
	const start = (await text.boundingBox())!
	await page.mouse.move(start.x + 2, start.y + start.height / 2)
	await page.mouse.down()
	await page.mouse.move(card.x, card.y, { steps: 10 })
	await page.mouse.up()
	await settle(page)
	expect(await page.evaluate(() => getSelection()!.toString().length)).toBeGreaterThan(0)
	expect(await cursor(page)).not.toBe('another block')
})

const leftCard = (page: Page) =>
	page.locator('.tiptap .layout-card', { hasText: 'Any block content can go inside' })
const cardCount = (page: Page) => page.locator('.tiptap .layout-card').count()

test('a layout block, which draws nothing of its own, stays as it was', async ({ page }) => {
	await leftCard(page).scrollIntoViewIfNeeded()
	const before = await cardCount(page)
	const card = (await leftCard(page).boundingBox())!
	await page.mouse.click(card.x + 4, card.y + 4)
	await settle(page)
	expect(await cursor(page)).toBe('another block')
	await page.keyboard.type('Q')
	expect(await cardCount(page)).toBe(before - 1)
})

test('a block whose component draws a part of its own later gets the same rules', async ({
	page,
}) => {
	await leftCard(page).scrollIntoViewIfNeeded()
	await leftCard(page).evaluate((card) => {
		const title = document.createElement('h3')
		title.textContent = 'Card title'
		card.querySelector('[data-node-view-content]')!.before(title)
	})
	await settle(page)
	const before = await pageText(page)
	const title = page.locator('.tiptap h3', { hasText: 'Card title' })
	await title.click()
	await settle(page)
	expect(await cursor(page)).toBe('another block')
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
	await expect(title).toHaveText('Card title')
})

/** The interactive block's component (its own parts and its slot), for parts the checks add. */
const ownArea = (page: Page) => heading(page).locator('xpath=..')

test("after a click on the block's own text, copy takes the block and cut removes it", async ({
	page,
}) => {
	await heading(page).click()
	await settle(page)
	expect(await copiedText(page)).toBe(SLOT_TEXT)
	// Reading the copy back took focus to a text box outside the editor.
	await heading(page).click()
	await settle(page)
	await page.keyboard.press('ControlOrMeta+x')
	await expect(heading(page)).toHaveCount(0)
})

// Synthetic events: a touch that wobbles can't be made with Playwright's mouse.
test('a touch locks the box as it starts, and a tap that wobbles still selects the block', async ({
	page,
}) => {
	const at = await heading(page).evaluate((h) => {
		const { x, y } = h.getBoundingClientRect()
		const press = { clientX: x + 8, clientY: y + 8, bubbles: true, composed: true }
		h.dispatchEvent(new PointerEvent('pointerdown', { ...press, pointerType: 'touch' }))
		const locked = h.closest('[data-node-view-wrapper]')!.getAttribute('contenteditable')
		h.dispatchEvent(new MouseEvent('click', { ...press, clientX: press.clientX + 7 }))
		return locked
	})
	expect(at, 'locked at the touch').toBe('false')
	expect(await cursor(page)).toBe('the block')
})

test("a press on the block's button, then typing, changes nothing", async ({ page }) => {
	await textBelow(page).click()
	await settle(page)
	const before = await pageText(page)
	await page.locator('.tiptap button', { hasText: 'Click me' }).first().click()
	await settle(page)
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
})

test('a button of the block that removes itself selects its block; typing changes nothing', async ({
	page,
}) => {
	await ownArea(page).evaluate((area) => {
		const button = document.createElement('button')
		button.textContent = 'Dismiss'
		button.onclick = () => button.remove()
		area.prepend(button)
	})
	await settle(page)
	const before = await pageText(page)
	await page.locator('.tiptap button', { hasText: 'Dismiss' }).click()
	await settle(page)
	expect(await cursor(page)).toBe('the block')
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
})

test("when the block's own parts go away while it's locked, typing still changes nothing", async ({
	page,
}) => {
	await heading(page).click()
	await settle(page)
	await ownArea(page).evaluate((area) => {
		for (const child of [...area.children])
			if (!child.matches('[data-node-view-content]')) child.remove()
	})
	await settle(page)
	const before = await pageText(page)
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
	await expect(slotText(page)).toHaveText(SLOT_TEXT)
	await slotText(page).click()
	await settle(page)
	await page.keyboard.type('Z')
	expect((await cursor(page)).replace('Z', '')).toBe(SLOT_TEXT)
})

test("a text box of the block's own keeps its own cut and paste", async ({ page }) => {
	await ownArea(page).evaluate((area) => {
		const box = document.createElement('input')
		box.id = 'own-text-box'
		box.value = 'hello world'
		area.prepend(box)
	})
	await settle(page)
	// Selected by a drag, which doesn't select the block: the editor's selection stays elsewhere.
	const box = page.locator('#own-text-box')
	const { x, y, width, height } = (await box.boundingBox())!
	await page.mouse.move(x + 3, y + height / 2)
	await page.mouse.down()
	await page.mouse.move(x + width - 3, y + height / 2, { steps: 6 })
	await page.mouse.up()
	await page.keyboard.press('ControlOrMeta+x')
	await expect(box).toHaveValue('')
	await page.keyboard.press('ControlOrMeta+v')
	await expect(box).toHaveValue('hello world')
})

// On a Card, so those words are its only part of its own.
test('text beside the slot that the component fills in later is its own too', async ({ page }) => {
	await leftCard(page).scrollIntoViewIfNeeded()
	const text = await leftCard(page).evaluate(async (card) => {
		const words = document.createTextNode('')
		card.querySelector('[data-node-view-content]')!.before(words)
		await new Promise((done) => setTimeout(done, 50))
		words.data = 'Words filled in later'
		await new Promise((done) => setTimeout(done, 50))
		const range = document.createRange()
		range.setStart(words, 0)
		range.setEnd(words, 5)
		const { x, y, height } = range.getBoundingClientRect()
		return { x: x + 4, y: y + height / 2 }
	})
	const before = await pageText(page)
	await page.mouse.click(text.x, text.y)
	await settle(page)
	expect(await cursor(page)).toBe('another block')
	await page.keyboard.type('Q')
	expect(await pageText(page)).toBe(before)
})

test('a field the component makes editable itself stays editable', async ({ page }) => {
	const editable = await ownArea(page).evaluate(async (area) => {
		const field = document.createElement('div')
		field.setAttribute('contenteditable', 'true')
		field.textContent = 'A field of its own'
		area.prepend(field)
		await new Promise((done) => setTimeout(done, 50))
		return field.isContentEditable
	})
	expect(editable).toBe(true)
})
