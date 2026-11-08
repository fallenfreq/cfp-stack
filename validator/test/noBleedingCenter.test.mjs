// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noBleedingCenter } from '../rules/noBleedingCenter.ts'
import { checkHtml } from './checkHtml.mjs'

const message = "A centred column can't also bleed: set a block around it to bleed"

test('a centred column set to bleed is a result, at any depth', () => {
	const page = `<div class="sl-center sl-bleed"><p>One</p></div>
<div class="sl-inset">
	<div class="sl-bleed sl-center sl-stack"><p>Two</p></div>
</div>`
	assert.deepEqual(checkHtml(noBleedingCenter, page), [
		{ message, lines: [1] },
		{ message, lines: [3] },
	])
})

test('a centred column in a block that bleeds, or either class alone, is no result', () => {
	const page = `<div class="sl-bleed sf-depth-1">
	<div class="sl-center sl-stack"><p>One</p></div>
</div>
<p class="sl-center">Two</p>
<p class="sl-bleed">Three</p>`
	assert.deepEqual(checkHtml(noBleedingCenter, page), [])
})
