import type { Locator, Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

export interface Box {
	left: number
	right: number
	top: number
	bottom: number
	width: number
	height: number
}

// ─── The stylesheet ─────────────────────────────────────────────────────

let cssText: string | undefined
/**
 * The stylesheet the checks use: built from the seed by globalSetup.ts, or SF_SYSTEM_CSS=<file>
 * to check another (an old copy, or a change) without touching the database.
 */
function stylesheet(): string {
	const file = process.env.SF_SYSTEM_CSS ?? process.env.SF_TEST_STYLESHEET
	if (!file) throw new Error('No stylesheet: globalSetup.ts sets SF_TEST_STYLESHEET')
	return (cssText ??= readFileSync(file, 'utf8'))
}

/** The collapse breakpoints in px by name (xs, sm, md…), read from the stylesheet. */
export function breakpoints(): Record<string, number> {
	const found: Record<string, number> = {}
	for (const [, px, name] of stylesheet().matchAll(
		/@container \(width <= (\d+)px\) \{[^}]*?\.sl-collapse-([a-z0-9]+)/g,
	))
		found[name!] = Number(px)
	for (const name of ['xs', 'sm', 'md'])
		if (!found[name]) throw new Error(`No ${name} breakpoint in the stylesheet`)
	return found
}

/**
 * Page shell widths the layout checks run at: as wide as the window, then below sm and xs. The
 * document inside is narrower by the shell's margins, so below sm stays below sm.
 */
export function shellWidths(): { name: string; px: number | null }[] {
	const { sm, xs } = breakpoints() as { sm: number; xs: number }
	return [
		{ name: 'wide', px: null },
		{ name: 'just below sm', px: sm - 40 },
		{ name: 'just below xs', px: xs - 20 },
	]
}

// ─── Opening pages ──────────────────────────────────────────────────────

/**
 * Keep pages the same from run to run: the stylesheet above, placeholder images served locally
 * at their stated size, and video embeds left empty.
 */
export async function steadyRequests(page: Page): Promise<void> {
	const css = stylesheet()
	await page.route('**/styles/sf-system*', (route) =>
		route.fulfill({ contentType: 'text/css', body: css }),
	)
	await page.route('https://placehold.co/**', (route) => {
		const [, width = '100', height = '100'] = /\/(\d+)x(\d+)/.exec(route.request().url()) ?? []
		return route.fulfill({
			contentType: 'image/svg+xml',
			body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#ccc"/></svg>`,
		})
	})
	await page.route('https://www.youtube.com/**', (route) =>
		route.fulfill({ contentType: 'text/html', body: '' }),
	)
}

/** Put a theme on the page (its activation class on <html>); null leaves the root theme. */
export async function useTheme(page: Page, themeClass: string | null): Promise<void> {
	if (themeClass)
		await page.evaluate((name) => document.documentElement.classList.add(name), themeClass)
	await settle(page)
}

/** Open the editor with a seeded document ('tests' or the demo, 'true') and wait for it to settle. */
export async function openSeeded(
	page: Page,
	seed: 'tests' | 'true',
	lastSelector: string,
	themeClass: string | null,
): Promise<void> {
	await steadyRequests(page)
	await page.goto(`/editor?seed=${seed}`)
	await page.locator(lastSelector).waitFor({ state: 'attached' })
	await useTheme(page, themeClass)
	await page.evaluate(async () => {
		await document.fonts.ready
		await Promise.all(
			[...document.images].map((img) =>
				img.complete ? null : new Promise((done) => (img.onload = img.onerror = done)),
			),
		)
	})
	await settle(page)
}

export const openTests = (page: Page, themeClass: string | null) =>
	openSeeded(page, 'tests', '#align-cluster-x-end-last', themeClass)

/**
 * Narrow the page shell the document sits in to `px`, as a narrower screen would; null: as wide
 * as the window. The document keeps its margins inside it.
 */
export async function setShellWidth(page: Page, px: number | null): Promise<void> {
	await page.evaluate((px) => {
		const shell = document
			.querySelector('.tiptap.ProseMirror')
			?.closest<HTMLElement>('.page-shell')
		if (!shell) throw new Error('setShellWidth: the document is not in a page shell')
		shell.style.maxWidth = px === null ? '' : `${px}px`
	}, px)
	await settle(page)
}

/** Wait two frames, so layout and anything reacting to it have run. */
export async function settle(page: Page): Promise<void> {
	await page.evaluate(
		() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
	)
}

// ─── Measuring ──────────────────────────────────────────────────────────

export const box = (target: Locator): Promise<Box> =>
	target.evaluate((el) => {
		const { left, right, top, bottom, width, height } = el.getBoundingClientRect()
		return { left, right, top, bottom, width, height }
	})

/**
 * The box a block's parent places: a component block's outer box (TipTap's node-view wrapper),
 * or a plain block itself. Ids land on the element wearing the classes.
 */
export const placed = (page: Page, id: string): Locator =>
	page.locator(`[data-node-view-wrapper]:has(> #${id}), #${id}:not([data-node-view-wrapper] > *)`)

/** How many columns a grid has; 1 means its items are stacked. */
export const columnCount = (target: Locator): Promise<number> =>
	target.evaluate(
		(el) =>
			getComputedStyle(el)
				.gridTemplateColumns.split(' ')
				.filter((track) => parseFloat(track) > 0).length,
	)

export const isShown = (target: Locator): Promise<boolean> =>
	target.evaluate((el) => el.checkVisibility())

export const css = (target: Locator, property: string, pseudo?: string): Promise<string> =>
	target.evaluate(
		(el, [property, pseudo]) => getComputedStyle(el, pseudo).getPropertyValue(property!),
		[property, pseudo] as const,
	)

/**
 * The width container an element's collapse measures: the nearest one around it, named as the
 * test page names it ('page', 'outer box of #id', '#id'), with the width the query sees (its
 * content box).
 */
export const measuredBox = (target: Locator): Promise<{ name: string; width: number }> =>
	target.evaluate((el) => {
		let at = el.parentElement
		while (at && getComputedStyle(at).containerType === 'normal') at = at.parentElement
		if (!at) return { name: 'none', width: 0 }
		const style = getComputedStyle(at)
		const width =
			at.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
		const name = at.matches('.tiptap.ProseMirror')
			? 'page'
			: at.matches('[data-node-view-wrapper]')
				? `outer box of #${at.firstElementChild?.id}`
				: at.id
					? `#${at.id}`
					: at.tagName.toLowerCase()
		return { name, width }
	})

/** How a to-do item lays out its checkbox and its text. */
export const taskItemLayout = (target: Locator) =>
	target.evaluate((item) => {
		const checkbox = item.querySelector(':scope > label')!.getBoundingClientRect()
		const text = item.querySelector(':scope > div')!.getBoundingClientRect()
		return {
			display: getComputedStyle(item).display,
			besideCheckbox: text.left >= checkbox.right && text.top < checkbox.bottom,
			gap: Math.round(text.left - checkbox.right),
		}
	})

/** The width "hide below" and "show below" see in a document: the page's. */
export const pageWidth = (page: Page): Promise<number> =>
	page.locator('.tiptap.ProseMirror').evaluate((doc) => {
		const style = getComputedStyle(doc)
		const width = doc.getBoundingClientRect().width
		return width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
	})

// ─── Selecting ──────────────────────────────────────────────────────────

/** The ProseMirror position of the node with this id, for selecting it. */
export const nodePosition = (page: Page, id: string): Promise<number> =>
	page.evaluate((id) => {
		const editor = (document.querySelector('.tiptap') as any).editor
		let at = -1
		editor.state.doc.descendants((node: any, pos: number) => {
			if (node.attrs?.id === id) at = pos
		})
		return at
	}, id)

/** Select a whole block, as clicking its node-path crumb does, with the block in view. */
export async function selectBlock(page: Page, id: string): Promise<void> {
	const at = await nodePosition(page, id)
	await page.evaluate(
		([id, at]) => {
			document.getElementById(id as string)!.scrollIntoView({ block: 'center' })
			const editor = (document.querySelector('.tiptap') as any).editor
			editor.chain().focus().setNodeSelection(at).run()
		},
		[id, at] as const,
	)
	await settle(page)
}
