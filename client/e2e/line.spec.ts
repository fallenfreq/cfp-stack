import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
	box,
	breakpoints,
	columnCount,
	openTests,
	pageWidth,
	placed,
	setShellWidth,
	shellWidths,
} from './helpers'

// The editor shows its document in the page shell, an inset, as a stored page does, and the
// document's own blocks are the inset's items (sf-system.md, "Side margins and full-bleed"). Each
// check puts references in the shell itself, beside the document, and every case on the test page
// ("The page's line") has to sit exactly where its reference does. Run in several shells: the page,
// a card used as the shell (its padding is the margin), that card inside a page, a page margin that
// grows with the screen, and right to left. Besides the usual widths, one puts the document at
// exactly sm: a block that bleeds is still wider there, so what it holds must not stack yet.

const SHELLS = [
	{ name: 'the page shell' },
	{ name: 'a card used as the shell', card: true },
	{ name: 'a card shell inside a page', card: true, inPage: true },
	{ name: 'a page margin that grows with the screen', fluidMargin: true },
	{ name: 'right to left', rtl: true },
]

// Where each case should sit: the reference that's the shell's own item, by id.
const SAME_AS = {
	'line-paragraph': 'ref-line',
	'line-image': 'ref-bleed',
	'line-block-bleed': 'ref-bleed',
	'line-card-bleed': 'ref-bleed',
	'line-columns-bleed': 'ref-bleed',
	'line-component-columns-bleed': 'ref-bleed',
	'line-bar-text': 'ref-bar-text',
	'line-band-text': 'ref-band-text',
	'line-card-band-text': 'ref-band-text',
	'line-component-band-text': 'ref-band-text',
}

const COLUMNS = [
	'line-columns',
	'line-columns-in-bleed',
	'line-columns-bleed',
	'line-component-columns',
	'line-component-columns-bleed',
]

async function setUpShell(page: Page, shell: (typeof SHELLS)[number]): Promise<void> {
	await page.evaluate((shell) => {
		const doc = document.querySelector('.tiptap.ProseMirror')!
		const pageShell = doc.closest<HTMLElement>('.page-shell')!
		if (shell.card) pageShell.classList.add('sf-depth-1')
		if (shell.inPage) {
			const outer = document.createElement('div')
			outer.className = 'sl-inset'
			pageShell.before(outer)
			outer.append(pageShell)
		}
		if (shell.fluidMargin)
			document.documentElement.style.setProperty(
				'--sf-spacing_page',
				'clamp(1rem, 6vw, 5rem)',
			)
		if (shell.rtl) pageShell.dir = 'rtl'
		pageShell.insertAdjacentHTML(
			'afterbegin',
			`<p id="ref-line">On the line</p>
			<div id="ref-bleed" class="sl-bleed">Edge to edge</div>
			<div class="sl-bleed sl-inset-line sf-depth-1"><p id="ref-bar-text">On the line</p></div>
			<div class="sl-bleed sl-inset sf-depth-1"><p id="ref-band-text">On the line</p></div>`,
		)
	}, shell)
}

for (const shell of SHELLS)
	test(`a document's blocks sit as the inset's own items: ${shell.name}`, async ({
		page,
		themeClass,
	}) => {
		await openTests(page, themeClass)
		await setUpShell(page, shell)
		const { sm } = breakpoints() as { sm: number }
		await setShellWidth(page, sm)
		const documentAtSm = { name: 'the document at sm', px: sm + (sm - (await pageWidth(page))) }

		for (const width of [...shellWidths(), documentAtSm]) {
			await setShellWidth(page, width.px)
			const at = `${shell.name}, ${width.name}`
			if (width === documentAtSm)
				expect(
					await pageWidth(page),
					`${at}: the document isn't over sm`,
				).toBeLessThanOrEqual(sm)

			const line = await box(page.locator('#ref-line'))
			const edges = await box(page.locator('#ref-bleed'))
			expect(line.left - edges.left, `${at}: the shell has a margin`).toBeGreaterThan(1)

			for (const [id, ref] of Object.entries(SAME_AS)) {
				const [block, want] = [
					await box(placed(page, id)),
					await box(page.locator(`#${ref}`)),
				]
				const sides = (b: typeof block) => `${Math.round(b.left)}–${Math.round(b.right)}`
				expect
					.soft(
						Math.max(
							Math.abs(block.left - want.left),
							Math.abs(block.right - want.right),
						),
						`${at}: #${id} (${sides(block)}) sits where #${ref} does (${sides(want)})`,
					)
					.toBeLessThanOrEqual(1)
			}

			for (const id of COLUMNS) {
				const own = (await box(placed(page, id))).width
				expect
					.soft(
						(await columnCount(page.locator(`#${id}`))) === 1,
						`${at}: #${id} stacks exactly when it (${Math.round(own)}px) is at or below sm (${sm}px)`,
					)
					.toBe(own <= sm)
			}

			expect(
				await page.evaluate(
					() =>
						document.documentElement.scrollWidth
						<= document.documentElement.clientWidth,
				),
				`${at}: nothing sticks out sideways`,
			).toBe(true)
		}
	})
