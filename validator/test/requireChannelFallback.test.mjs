// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requireChannelFallback } from '../rules/requireChannelFallback.ts'
import { checkCss } from './checkCss.mjs'

test('a channel with no fallback in a larger value is a result', () => {
	const style =
		'padding: calc(var(--sf-padding) + 16px); gap: var(--sf-gap) 1rem; margin: max(var(--sf-gap), 1rem); --x: 2px var(--sf-padding)'
	const results = checkCss(requireChannelFallback, style)
	assert.deepEqual(
		results.map(({ parts }) => parts),
		[['var(--sf-padding)'], ['var(--sf-gap)'], ['var(--sf-gap)'], ['var(--sf-padding)']],
	)
	assert.equal(
		results[0].message,
		'With no --sf-padding set, this whole value is dropped, not just its part: give it a fallback, var(--sf-padding, …)',
	)
})

test('a channel as the whole value, one with a fallback, or another variable is no result', () => {
	const style = [
		'padding: var(--sf-padding)',
		'row-gap: VAR(--sf-gap)',
		'gap: var(--sf-gap, var(--sf-spacing-md))',
		'padding: calc(var(--sf-padding, 0px) + 16px)',
		'gap: var(--sf-gap,) 1rem',
		'margin: var(--sf-gaps) 1rem',
		'--x: var(--sf-gap)',
	].join('; ')
	assert.deepEqual(checkCss(requireChannelFallback, style), [])
})

test('a channel that is the whole fallback of a whole value is the whole value', () => {
	const style = 'gap: var(--x, var(--sf-gap)); padding: var(--x, var(--y, var(--sf-padding)))'
	assert.deepEqual(checkCss(requireChannelFallback, style), [])
	assert.deepEqual(
		checkCss(requireChannelFallback, 'gap: var(--x, var(--sf-gap) 1rem)').map(
			({ parts }) => parts,
		),
		[['var(--sf-gap)']],
	)
})
