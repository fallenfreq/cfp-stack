// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noWidthContainer } from '../rules/noWidthContainer.ts'
import { checkCss } from './checkCss.mjs'

test('a width container, or size containment, is a result', () => {
	const style = [
		'container-type: inline-size',
		'container-type: INLINE-SIZE',
		'container-type: scroll-state size',
		'container: card / inline-size',
		'CONTAIN: strict',
		'contain: inline-size layout',
		'contain: size',
	].join('; ')
	const results = checkCss(noWidthContainer, style)
	assert.deepEqual(
		results.map(({ parts }) => parts[0]),
		style.split('; '),
	)
	assert.equal(
		results[0].message,
		"This box takes no width from its content, so it's 0 wide where its width comes from its content (a cluster, a table cell)",
	)
})

test('a container of no size, a name alone, or other containment is no result', () => {
	const style = [
		'container-type: normal',
		'container-type: scroll-state',
		'container: card',
		'container: inline-size',
		'container-name: size',
		'contain: content',
		'contain: layout paint',
	].join('; ')
	assert.deepEqual(checkCss(noWidthContainer, style), [])
})
