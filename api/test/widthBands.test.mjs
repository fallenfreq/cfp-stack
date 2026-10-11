// From api/: pnpm test, which builds dist/ first.
import { drizzle } from 'drizzle-orm/d1'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createMemoryD1 } from '../../client/e2e/d1Memory.mjs'
import { listCollapseThresholds, setCollapseThreshold } from '../dist/domain/collapseThresholds.js'
import { shownAlways, widthBands } from '../dist/domain/css/slLayout.js'

test('the widths make bands, narrowest first, each listing every class hidden in it', () => {
	const widths = [
		{ name: 'md', value: '768px' },
		{ name: 'xs', value: '380px' },
		{ name: 'sm', value: '640px' },
	]
	assert.deepEqual(widthBands(widths), [
		{
			condition: '(width <= 380px)',
			hidden: ['.sl-hide-below-xs', '.sl-hide-below-sm', '.sl-hide-below-md'],
		},
		{
			condition: '(380px < width <= 640px)',
			hidden: ['.sl-hide-below-sm', '.sl-hide-below-md', '.sl-show-below-xs'],
		},
		{
			condition: '(640px < width <= 768px)',
			hidden: ['.sl-hide-below-md', '.sl-show-below-xs', '.sl-show-below-sm'],
		},
		{
			condition: '(768px < width)',
			hidden: ['.sl-show-below-xs', '.sl-show-below-sm', '.sl-show-below-md'],
		},
	])
	assert.deepEqual(widthBands([]), [], 'with no widths nothing hides')
})

// A part of the class attribute ([class*=…]) before "~" makes Chrome restyle every later block
// whenever any block's classes change.
test('a block shown at every width is told by its classes, named', () => {
	const bands = widthBands([
		{ name: 'sm', value: '640px' },
		{ name: 'md', value: '768px' },
	])
	assert.equal(
		shownAlways(bands),
		':not(.sl-hide-below-sm, .sl-hide-below-md, .sl-show-below-sm, .sl-show-below-md, .ProseMirror-widget)',
	)
	assert.equal(shownAlways([]), ':not(.ProseMirror-widget)')
})

test('a width is a number and the same unit as the others, any unit', async () => {
	const db = drizzle(createMemoryD1(fileURLToPath(new URL('../migrations/', import.meta.url))))
	await setCollapseThreshold(db, 'sm', '40rem')
	await setCollapseThreshold(db, 'md', '48rem')
	await assert.rejects(setCollapseThreshold(db, 'lg', '1024px'), /share one unit/)
	await assert.rejects(setCollapseThreshold(db, 'lg', 'wide'), /a number and a unit/)
	await setCollapseThreshold(db, 'sm', '36rem')
	await setCollapseThreshold(db, 'xs', '.5REM')
	const saved = await listCollapseThresholds(db)
	assert.deepEqual(saved.map((t) => `${t.name} ${t.value}`).sort(), [
		'md 48rem',
		'sm 36rem',
		'xs .5REM',
	])
})
