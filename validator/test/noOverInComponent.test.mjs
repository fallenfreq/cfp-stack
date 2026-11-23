// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noOverInComponent } from '../rules/noOverInComponent.ts'
import { checkHtml } from './checkHtml.mjs'

const message =
	'A placed box straight in a component block sits on the wrong box: put the block and it side by side in a plain block'

test('a placed box straight in a component block is a result, with a layout or without', () => {
	const page = `<layout-card>
	<div class="sl-over sf-is-overlay"></div>
</layout-card>
<layout-stack class="sl-stack">
	<div class="sl-over sf-is-overlay"></div>
</layout-stack>`
	assert.deepEqual(checkHtml(noOverInComponent, page), [
		{ message, lines: [2] },
		{ message, lines: [5] },
	])
})

test('a placed box beside a component block in a plain box, or deeper in one, is no result', () => {
	const page = `<div>
	<layout-card><p>One</p></layout-card>
	<div class="sl-over sf-is-overlay"></div>
</div>
<layout-card>
	<div><p>Two</p><div class="sl-over sf-is-overlay"></div></div>
</layout-card>`
	assert.deepEqual(checkHtml(noOverInComponent, page), [])
})
