import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import {
	breakpoints,
	dividerLooks,
	measuredBox,
	openTests,
	pageWidth,
	setShellWidth,
	settle,
} from './helpers'

// A block hidden at this width (sl-hide-below-*, sl-show-below-*) leaves nothing behind: the
// blocks around it are spaced, and divide lines drawn, as if it weren't there. A hidden block
// keeps its place in the page, so "the last block" and "after another block" would still count
// it; these check that the stylesheet counts only the blocks shown at each width.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

/** Make the page `px` wide as hide and show see it, by narrowing the shell around it. */
async function setPageWidth(page: Page, px: number): Promise<void> {
	await setShellWidth(page, px)
	await setShellWidth(page, px + (px - (await pageWidth(page))))
	expect(Math.abs((await pageWidth(page)) - px), `the page is ${px}px wide`).toBeLessThanOrEqual(
		1,
	)
}

/** A width inside each band the hide and show widths make. */
function bands(): { name: string; px: number }[] {
	const { xs, sm, md } = breakpoints() as { xs: number; sm: number; md: number }
	return [
		{ name: 'below xs', px: xs - 30 },
		{ name: 'between xs and sm', px: Math.round((xs + sm) / 2) },
		{ name: 'between sm and md', px: Math.round((sm + md) / 2) },
		{ name: 'above md', px: md + 20 },
	]
}

/** The space at a box's edges and between its shown blocks, and how many show. */
const spacing = (page: Page, id: string) =>
	page.locator(`#${id}`).evaluate((root) => {
		const content = root.querySelector(':scope > [data-node-view-content]') ?? root
		const shown = [...content.children]
			.filter((el) => el.checkVisibility())
			.map((el) => el.getBoundingClientRect())
		const edges = root.getBoundingClientRect()
		const first = shown[0]
		const last = shown.at(-1)
		if (!first || !last) throw new Error(`#${root.id} shows no block`)
		return {
			above: first.top - edges.top,
			below: edges.bottom - last.bottom,
			gaps: shown.slice(1).map((block, i) => block.top - shown[i]!.bottom),
		}
	})

// Each case, a box of its kind holding two blocks to compare it with, and how many of its blocks
// show in each band (below xs, xs–sm, sm–md, above md), so a case that stopped hiding fails here.
const SPACE_CASES = [
	{ id: 'hidden-last-card', pair: 'pair-card', shown: [1, 1, 1, 2] },
	{ id: 'hidden-last-box', pair: 'pair-box', shown: [1, 1, 1, 2] },
	{ id: 'hidden-last-quote', pair: 'pair-quote', shown: [1, 1, 1, 2] },
	{ id: 'hidden-first-card', pair: 'pair-card', shown: [1, 1, 1, 2] },
	{ id: 'narrow-last-card', pair: 'pair-card', shown: [2, 2, 2, 1] },
	{ id: 'between-last-card', pair: 'pair-card', shown: [2, 2, 2, 1] },
] as const
const DIVIDE_CASES = [
	{ id: 'hidden-divide', shown: [2, 2, 2, 4] },
	{ id: 'narrow-divide', shown: [3, 3, 3, 2] },
	{ id: 'nearer-divide', shown: [3, 3, 3, 2] },
] as const

bands().forEach(({ name, px }, band) => {
	test(`a hidden block leaves no space behind, ${name}`, async ({ page }) => {
		await setPageWidth(page, px)
		for (const { id, pair, shown } of SPACE_CASES) {
			const reference = await spacing(page, pair)
			const got = await spacing(page, id)
			expect(got.gaps.length + 1, `${id}: blocks shown`).toBe(shown[band])
			expect(Math.abs(got.above - reference.above), `${id}: space above`).toBeLessThanOrEqual(
				1,
			)
			expect(Math.abs(got.below - reference.below), `${id}: space below`).toBeLessThanOrEqual(
				1,
			)
			for (const gap of got.gaps)
				expect(
					Math.abs(gap - reference.gaps[0]!),
					`${id}: space between`,
				).toBeLessThanOrEqual(1)
		}
	})

	test(`divide lines are drawn only between shown blocks, ${name}`, async ({ page }) => {
		await setPageWidth(page, px)
		const [undivided, divided] = (await dividerLooks(page, 'divide-stack-twin')).items
		expect(divided, 'the theme draws a divide line').not.toBe(undivided)
		const nearer = await measuredBox(page.locator('#nearer-divide > p').nth(1))
		expect(nearer.name, 'the narrower box measures its own width').toBe('#nearer-box')
		for (const { id, shown } of DIVIDE_CASES) {
			const { items } = await dividerLooks(page, id, { shownOnly: true })
			expect(items.length, `${id}: blocks shown`).toBe(shown[band])
			expect(items, id).toEqual(items.map((_, i) => (i === 0 ? undivided : divided)))
		}
	})

	// No app screen holds such a box today, so the check adds one outside the page. A layout
	// holding a hide/show block measures its own width there.
	test(`on an app screen, divide lines are drawn only between shown blocks, ${name}`, async ({
		page,
	}) => {
		const [undivided, divided] = (await dividerLooks(page, 'divide-stack-twin')).items
		await page.evaluate((px) => {
			const box = document.createElement('div')
			box.id = 'app-divide'
			box.className = 'sl-stack sf-gap-sm sf-divide-y'
			box.style.width = `${px}px`
			box.innerHTML = '<p class="sl-hide-below-md">Hidden below md</p><p>One</p><p>Two</p>'
			document.body.append(box)
		}, px)
		await settle(page)
		expect(await measuredBox(page.locator('#app-divide > p').nth(1))).toEqual({
			name: '#app-divide',
			width: px,
		})
		const { items } = await dividerLooks(page, 'app-divide', { shownOnly: true })
		expect(items.length, 'blocks shown').toBe([2, 2, 2, 3][band])
		expect(items).toEqual(items.map((_, i) => (i === 0 ? undivided : divided)))
	})
})
