// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { oneArrangementPerBox } from '../rules/oneArrangementPerBox.ts'
import { checkHtml } from './checkHtml.mjs'

test('a box with two arrangements is a result naming them as it wears them', () => {
	const page = `<div class="sl-columns sf-gap-lg sl-row"><p>One</p></div>
<div>
	<div class="sl-scroll-frame sl-cluster"><p>Two</p></div>
</div>
<div class="sl-stack sl-columns sl-inset"><p>Three</p></div>`
	assert.deepEqual(checkHtml(oneArrangementPerBox, page), [
		{ message: 'One block has 2 arrangements: sl-columns and sl-row', lines: [1] },
		{ message: 'One block has 2 arrangements: sl-scroll-frame and sl-cluster', lines: [3] },
		{ message: 'One block has 3 arrangements: sl-stack, sl-columns and sl-inset', lines: [5] },
	])
})

test('each arrangement in the spec counts, the scroll frame included', () => {
	for (const arrangement of [
		'sl-stack',
		'sl-cluster',
		'sl-columns',
		'sl-split',
		'sl-grid',
		'sl-inset',
		'sl-cover',
		'sl-row',
		'sl-scroll-frame',
	]) {
		const other = arrangement === 'sl-stack' ? 'sl-cluster' : 'sl-stack'
		const page = `<div class="${arrangement} ${other}"></div>`
		assert.equal(checkHtml(oneArrangementPerBox, page).length, 1, arrangement)
	}
})

test('a centred column, a shape, one box in another, or a class worn twice is no result', () => {
	const page = `<div class="sl-center sl-stack"><p>Centre</p></div>
<div class="sl-aspect-16-9 sl-columns"><p>Shape</p></div>
<div class="sl-stack"><div class="sl-columns"><p>Nested</p></div></div>
<div class="sl-scroll-frame"><div class="sl-scroll-x sl-cluster"><p>Framed</p></div></div>
<div class="sl-stack sl-stack"><p>Twice</p></div>`
	assert.deepEqual(checkHtml(oneArrangementPerBox, page), [])
})
