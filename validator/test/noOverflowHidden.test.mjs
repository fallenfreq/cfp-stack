// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noOverflowHidden } from '../rules/noOverflowHidden.ts'
import { checkCss } from './checkCss.mjs'

test('overflow hidden on either side is a result', () => {
	const style = [
		'overflow: hidden',
		'overflow-x: hidden',
		'overflow: auto hidden',
		'OVERFLOW-Y: HIDDEN',
		'overflow-inline: hidden',
		'overflow-block: hidden',
	].join('; ')
	const results = checkCss(noOverflowHidden, style)
	assert.deepEqual(
		results.map(({ parts }) => parts[0]),
		style.split('; '),
	)
	assert.equal(
		results[0].message,
		'overflow: hidden makes this box a scroll area, so a pinned block inside stops sticking: use overflow: clip',
	)
})

test('clip, a scroll area, or hidden elsewhere is no result', () => {
	const style =
		'overflow: clip; overflow-y: auto; overflow-x: scroll; visibility: hidden; overflow-clip-margin: 2px'
	assert.deepEqual(checkCss(noOverflowHidden, style), [])
})
