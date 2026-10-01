import { expect, test } from './fixtures'
import { box, openTests } from './helpers'

// On every layout, x is sideways and y is up and down (sf-system.md, "Layout primitives").

const center = (b: { left: number; width: number }) => b.left + b.width / 2
const middle = (b: { top: number; height: number }) => b.top + b.height / 2

test.beforeEach(async ({ page, themeClass }) => {
	await openTests(page, themeClass)
})

test('alignment: x is sideways and y is up and down on every layout', async ({ page }) => {
	const at = (id: string) => box(page.locator(`#${id}`))

	const stackEnd = await at('align-stack-x-end')
	const end = await at('align-stack-x-end-item')
	expect(Math.abs(end.right - stackEnd.right), 'a stack aligned x end').toBeLessThanOrEqual(1)
	expect(end.width).toBeLessThan(stackEnd.width / 2)

	const stackCentre = await at('align-stack-x-center')
	const centre = await at('align-stack-x-center-item')
	expect(
		Math.abs(center(centre) - center(stackCentre)),
		'a stack aligned x centre',
	).toBeLessThanOrEqual(1)

	const stackMiddle = await at('align-stack-y-center')
	const halfway = await at('align-stack-y-center-item')
	expect(
		Math.abs(middle(halfway) - middle(stackMiddle)),
		'a stack aligned y centre',
	).toBeLessThanOrEqual(1)

	const section = await at('align-section')
	const inSection = await at('align-section-item')
	expect(
		Math.abs(center(inSection) - center(section)),
		'a Section aligned centre',
	).toBeLessThanOrEqual(1)

	const row = await at('align-cluster-x-end')
	const last = await at('align-cluster-x-end-last')
	expect(Math.abs(last.right - row.right), 'a row aligned x end').toBeLessThanOrEqual(1)
})
