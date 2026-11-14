// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { preferThemeRadius } from '../rules/preferThemeRadius.ts'
import { checkCss } from './checkCss.mjs'

test('a fixed corner size is a result, on any corner property, however it is written', () => {
	const style = [
		'border-radius: 12px',
		'BORDER-RADIUS: 1REM',
		'border-radius: 10px 20px / 5px',
		'border-radius: 0 0 8px 8px',
		'border-top-left-radius: 50%',
		'border-start-start-radius: 4px',
		'border-end-end-radius: calc(1rem + 2px)',
		'-webkit-border-radius: 6px',
	].join('; ')
	const results = checkCss(preferThemeRadius, style)
	assert.deepEqual(
		results.map(({ parts }) => parts[0]),
		style.split('; '),
	)
	assert.equal(
		results[0].message,
		"A fixed corner size doesn't change with the theme: use a theme size",
	)
})

test('square, a theme size, a word, or another property is no result', () => {
	const style = [
		'border-radius: 0',
		'border-radius: 0px',
		'border-top-left-radius: 0%',
		'border-radius: var(--sf-radius-2)',
		'border-radius: inherit',
		'padding: 12px',
		'--sf-radius: 12px',
	].join('; ')
	assert.deepEqual(checkCss(preferThemeRadius, style), [])
})

test('a value holding a variable is left out, as it may be the theme size', () => {
	assert.deepEqual(
		checkCss(preferThemeRadius, 'border-radius: calc(var(--sf-radius-2) + 4px)'),
		[],
	)
})
