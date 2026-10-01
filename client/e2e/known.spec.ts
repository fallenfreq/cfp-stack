import { expect, test } from './fixtures'
import {
	box,
	breakpoints,
	columnCount,
	css,
	isShown,
	openTests,
	placed,
	setDocumentWidth,
} from './helpers'

// Known not to work yet (sf-system-todo.md, item 10, "Logged"; the typed-layout limit is in
// sf-system.md). Each check states what should happen and is marked as expected to fail. When
// one is fixed, Playwright reports "expected to fail, but passed": remove its test.fail() and
// move the case out of "Known not to work yet" on the test page.

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

// test.fail() also passes a case that broke for another reason, so this normal check makes sure
// every case renders and is set up as its heading says.
test('the known-limit cases are set up as described', async ({ page }) => {
	const { sm, md } = breakpoints() as { sm: number; md: number }
	expect(
		(await box(page.locator('#k1-columns'))).width,
		'K1: the side is narrower than sm',
	).toBeLessThanOrEqual(sm)
	expect(
		await css(page.locator('#k2-section'), 'grid-column-end'),
		'K2: the Section spans the row',
	).not.toBe('auto')
	for (const id of ['k3-section', 'k3-center'])
		await expect(page.locator(`#${id}`), `K3: ${id} wears sl-inset`).toHaveClass(
			/(^|\s)sl-inset(\s|$)/,
		)
	const content = await box(page.locator('#k4-content'))
	expect(
		(await box(page.locator('#k4-card'))).height,
		"K4: the Card beside it is taller than the Section's content",
	).toBeGreaterThan(content.height + 20)
	await setDocumentWidth(page, md - 40)
	expect(await isShown(page.locator('#k5-hidden')), 'K5: the last block is hidden').toBe(false)
	expect(await isShown(page.locator('#k5-last-shown')), 'K5: the block above it shows').toBe(true)
})

test('K1: typed columns in a narrow side of a Split stack', async ({ page }) => {
	test.fail()
	expect(await columnCount(page.locator('#k1-columns'))).toBe(1)
})

test("K2: a Section set as a row puts its blocks in the parent's columns", async ({ page }) => {
	test.fail()
	for (const n of [1, 2, 3]) {
		const cell = await box(page.locator(`#k2-cell-${n}`))
		const column = await box(page.locator(`#k2-column-${n}`))
		expect(
			cell.left >= column.left - 1 && cell.right <= column.right + 1,
			`cell ${n} in column ${n}`,
		).toBe(true)
	}
})

for (const id of ['k3-section', 'k3-center'])
	test(`K3: a ${id === 'k3-section' ? 'Section' : 'Centre'} used as an inset gives its blocks side margins`, async ({
		page,
	}) => {
		test.fail()
		const root = await box(page.locator(`#${id}`))
		const onTheLine = await box(page.locator(`#${id}-line`))
		expect(onTheLine.left).toBeGreaterThan(root.left + 1)
	})

test("K4: a Section with a background stretches to its row's height", async ({ page }) => {
	test.fail()
	const section = await box(page.locator('#k4-section'))
	const outer = await box(placed(page, 'k4-section'))
	expect(Math.abs(section.height - outer.height)).toBeLessThanOrEqual(1)
})

test("K5: hiding a Card's last block leaves no extra space under the block above it", async ({
	page,
}) => {
	test.fail()
	await setDocumentWidth(page, breakpoints().md! - 40)
	const card = await box(page.locator('#k5-card'))
	const lastShown = await box(page.locator('#k5-last-shown'))
	const reference = await box(page.locator('#k5-reference'))
	const only = await box(page.locator('#k5-only'))
	expect(
		Math.abs(card.bottom - lastShown.bottom - (reference.bottom - only.bottom)),
	).toBeLessThanOrEqual(1)
})
