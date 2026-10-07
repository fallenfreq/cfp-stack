import { expect, test } from './fixtures'
import {
	box,
	breakpoints,
	columnCount,
	isShown,
	measuredBox,
	openTests,
	pageWidth,
	placed,
	setShellWidth,
	shellWidths,
} from './helpers'

// Collapse and hide/show measure the space around a layout (sf-system.md, "Container-responsive
// collapse"). Each case names the box it should measure, and the check is the rule itself: it
// measures that box, and stacks (or hides) exactly when that box is at or below its breakpoint.
// That holds whatever the theme's spacing, so it runs at several widths and under both themes.

const COLUMNS = [
	{ id: 'a1-columns', name: 'A1: Columns of Cards in a Cover', measures: 'page' },
	{ id: 'a2-columns', name: 'A2: Columns in a centred Stack', measures: '#a2-stack' },
	{ id: 'a3-columns', name: 'A3: Columns in a row', measures: '#a3-row' },
	{
		id: 'a4-columns',
		name: 'A4: a typed grid in a Stack in a card in a row',
		measures: '#a4-row',
	},
	{ id: 't1-columns', name: 'T1: a typed grid in a Stack in a table cell', measures: 'page' },
	{ id: 't2-columns', name: 'T2: Columns in a table cell', measures: 'page' },
	{ id: 's1-columns', name: 'S1: Columns in an auto split column', measures: '#s1-split' },
	{
		id: 'c2-columns',
		name: "C2: Columns in a Split's narrow side",
		measures: 'outer box of #c2-columns',
	},
]

const HIDDEN_BELOW = [
	{ id: 'a5-tagline', name: 'A5: a tagline in a Cover', breakpoint: 'sm' },
	{ id: 'b1-hidden', name: 'B1: a paragraph in a narrow Centre', breakpoint: 'md' },
	{ id: 'h1-hidden', name: 'H1: a top-level paragraph', breakpoint: 'md' },
]

// Blocks in spots sized by their content; the bug this guards against left them 0 or 1px wide.
const NOT_ZERO = [
	{ id: 'a4-card', name: 'A4: the plain card in a row' },
	{ id: 't1-stack', name: 'T1: a Stack in a table cell' },
	{ id: 't2-columns', name: 'T2: Columns in a table cell' },
	{ id: 'c1-card', name: 'C1: a Card in a row' },
]

for (const widthName of ['wide', 'just below sm', 'just below xs'])
	test(`collapse measures the right box, ${widthName}`, async ({ page, themeClass }) => {
		await openTests(page, themeClass)
		await setShellWidth(page, shellWidths().find((w) => w.name === widthName)!.px)
		const bp = breakpoints()

		for (const c of COLUMNS) {
			const columns = page.locator(`#${c.id}`)
			const step = /sl-collapse-([a-z0-9]+)/.exec(
				(await columns.getAttribute('class')) ?? '',
			)![1]!
			const measured = await measuredBox(columns)
			expect.soft(measured.name, `${c.name} measures ${c.measures}`).toBe(c.measures)
			expect
				.soft(
					(await columnCount(columns)) === 1,
					`${c.name} stack exactly when ${measured.name} (${Math.round(measured.width)}px) is at or below ${step} (${bp[step]}px)`,
				)
				.toBe(measured.width <= bp[step]!)
		}

		const pageAt = await pageWidth(page)
		for (const c of HIDDEN_BELOW)
			expect
				.soft(
					await isShown(placed(page, c.id)),
					`${c.name} hides exactly when the page (${Math.round(pageAt)}px) is at or below ${c.breakpoint} (${bp[c.breakpoint]}px)`,
				)
				.toBe(pageAt > bp[c.breakpoint]!)

		for (const c of NOT_ZERO)
			expect
				.soft((await box(placed(page, c.id))).width, `${c.name} isn't 0 wide`)
				.toBeGreaterThan(10)
	})
