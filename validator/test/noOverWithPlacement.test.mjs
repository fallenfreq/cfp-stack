// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noOverWithPlacement } from '../rules/noOverWithPlacement.ts'
import { checkHtml } from './checkHtml.mjs'

const message = (name) =>
	`A placed box (sl-over) can't also wear ${name}: both place the box and one loses. Put ${name} on a box around or inside it`

test('a placed box that a pin, a bleed, a centred column or a row also places is a result', () => {
	const page = `<div class="sl-over sl-pin-top"></div>
<div class="sl-over sl-bleed"></div>
<layout-center class="sl-center sl-stack sl-over"><p>One</p></layout-center>
<div class="sl-over sl-row sl-pin-bottom"></div>`
	assert.deepEqual(checkHtml(noOverWithPlacement, page), [
		{ message: message('sl-pin-top'), lines: [1] },
		{ message: message('sl-bleed'), lines: [2] },
		{ message: message('sl-center'), lines: [3] },
		{ message: message('sl-row'), lines: [4] },
		{ message: message('sl-pin-bottom'), lines: [4] },
	])
})

test('a placed box with a layout or a shape, or a pin around it, is no result', () => {
	const page = `<div class="sl-pin-top">
	<div class="sl-over sl-stack sl-aspect-16-9"></div>
</div>
<div class="sl-center"></div>`
	assert.deepEqual(checkHtml(noOverWithPlacement, page), [])
})
