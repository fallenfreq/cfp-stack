// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { preferOverlayOnOver } from '../rules/preferOverlayOnOver.ts'
import { checkHtml } from './checkHtml.mjs'

const message = 'A placed box usually wears sf-is-overlay too, so the theme can draw it as floating'

test('a placed box without sf-is-overlay is a result', () => {
	const page = `<div class="sl-over sl-align-y-end"><p>One</p></div>`
	assert.deepEqual(checkHtml(preferOverlayOnOver, page), [{ message, lines: [1] }])
})

test('a placed box wearing sf-is-overlay, or an overlay not placed, is no result', () => {
	const page = `<div class="sl-over sf-is-overlay"></div>
<div class="sf-is-overlay sf-depth-2"></div>`
	assert.deepEqual(checkHtml(preferOverlayOnOver, page), [])
})
