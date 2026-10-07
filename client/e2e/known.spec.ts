import { expect, test } from './fixtures'
import { box, breakpoints, columnCount, isShown, openTests, placed, setShellWidth } from './helpers'

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
	const content = await box(page.locator('#k4-content'))
	expect(
		(await box(page.locator('#k4-card'))).height,
		"K4: the Card beside it is taller than the Stack's content",
	).toBeGreaterThan(content.height + 20)
	await setShellWidth(page, md - 40)
	expect(await isShown(page.locator('#k5-hidden')), 'K5: the last block is hidden').toBe(false)
	expect(await isShown(page.locator('#k5-last-shown')), 'K5: the block above it shows').toBe(true)
})

test('K1: typed columns in a narrow side of a Split stack', async ({ page }) => {
	test.fail()
	expect(await columnCount(page.locator('#k1-columns'))).toBe(1)
})

test("K4: a Stack with a background stretches to its row's height", async ({ page }) => {
	test.fail()
	const stack = await box(page.locator('#k4-stack'))
	const outer = await box(placed(page, 'k4-stack'))
	expect(Math.abs(stack.height - outer.height)).toBeLessThanOrEqual(1)
})

test("K5: hiding a Card's last block leaves no extra space under the block above it", async ({
	page,
}) => {
	test.fail()
	await setShellWidth(page, breakpoints().md! - 40)
	const card = await box(page.locator('#k5-card'))
	const lastShown = await box(page.locator('#k5-last-shown'))
	const reference = await box(page.locator('#k5-reference'))
	const only = await box(page.locator('#k5-only'))
	expect(
		Math.abs(card.bottom - lastShown.bottom - (reference.bottom - only.bottom)),
	).toBeLessThanOrEqual(1)
})
