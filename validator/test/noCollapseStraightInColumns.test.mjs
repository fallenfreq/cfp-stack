// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noCollapseStraightInColumns } from '../rules/noCollapseStraightInColumns.ts'
import { checkHtml } from './checkHtml.mjs'

const stacks =
	"Stacks by the width of the whole layout around it, not its column's: put it in a Stack in the column"

test('a collapsing layout straight in a column of a split, Columns or a grid is a result', () => {
	const page = `<div class="sl-split">
	<div class="sl-columns sl-collapse-sm"><p>One</p></div>
	<p>The wide side</p>
</div>
<div class="sl-columns">
	<div class="sf-depth-1">
		<div class="sl-cluster sl-collapse-md"><p>Two</p></div>
	</div>
</div>
<div class="sl-grid">
	<div class="sl-row">
		<div class="sl-cover">
			<div class="sl-split sl-collapse-xs"><p>Three</p></div>
		</div>
	</div>
</div>`
	assert.deepEqual(checkHtml(noCollapseStraightInColumns, page), [
		{ message: stacks, lines: [2] },
		{ message: stacks, lines: [7] },
		{ message: stacks, lines: [13] },
	])
})

test('only the nearest layout that measures counts', () => {
	const page = `<div class="sl-split" style="--sl-template: 1fr 2fr">
	<div class="sl-stack"><div class="sl-columns sl-collapse-sm"><p>One</p></div></div>
	<div class="sl-center"><div class="sl-columns sl-collapse-sm"><p>Two</p></div></div>
</div>
<div class="sl-stack">
	<div class="sl-split">
		<div class="sl-columns sl-collapse-sm"><p>Three</p></div>
	</div>
</div>
<div class="sl-columns">
	<div class="sl-cluster"><div class="sl-columns sl-collapse-sm"><p>Four</p></div></div>
</div>`
	assert.deepEqual(checkHtml(noCollapseStraightInColumns, page), [
		{ message: stacks, lines: [7] },
	])
})

test("a collapse class on what doesn't collapse is no result", () => {
	const page = `<div class="sl-split" style="--sl-template: 1fr 2fr">
	<p class="sl-collapse-sm">One</p>
	<div class="sl-stack sl-collapse-sm"><p>Two</p></div>
</div>`
	assert.deepEqual(checkHtml(noCollapseStraightInColumns, page), [])
})

test('a collapsing layout at the top, on its own split, in a Stack or in an inset is no result', () => {
	const page = `<div class="sl-columns sl-collapse-sm"><p>One</p></div>
<div class="sl-split sl-collapse-sm"><p>Two</p><p>Three</p></div>
<div class="sl-stack"><div class="sl-columns sl-collapse-sm"><p>Four</p></div></div>
<div class="sl-inset"><div class="sl-columns sl-collapse-sm"><p>Five</p></div></div>`
	assert.deepEqual(checkHtml(noCollapseStraightInColumns, page), [])
})
