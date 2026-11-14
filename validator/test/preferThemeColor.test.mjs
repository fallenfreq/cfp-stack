// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { preferThemeColor } from '../rules/preferThemeColor.ts'
import { checkCss } from './checkCss.mjs'

test('a fixed colour is a result, however it is written and wherever it sits', () => {
	const style = [
		'color: red',
		'COLOR: RED',
		'background-color: #fff',
		'background: url(x.png) no-repeat rgb(255 0 0)',
		'border: 1px solid hsl(0 100% 50%)',
		'box-shadow: 0 0 4px black',
		'color: oklch(70% 0.1 200)',
		'--sf-shadow-color: rgb(255, 0, 0)',
	].join('; ')
	const results = checkCss(preferThemeColor, style)
	assert.deepEqual(
		results.map(({ parts }) => parts[0]),
		style.split('; '),
	)
	assert.equal(
		results[0].message,
		"A fixed colour doesn't change with the theme: use a theme colour",
	)
})

test("a theme colour, no colour of its own, or a word that isn't a colour is no result", () => {
	const style = [
		'color: rgb(var(--sf-primary-5))',
		'color: var(--sf-danger)',
		'background-color: transparent',
		'border-color: currentColor',
		'color: inherit',
		'font-family: Red Hat',
		'grid-area: red',
		'--sf-gap: 1rem',
		'--sf-shadow-color: rgb(var(--sf-primary-5) / var(--sf-alpha-3))',
	].join('; ')
	assert.deepEqual(checkCss(preferThemeColor, style), [])
})

test('a value holding a variable is left out, as it cannot be matched', () => {
	assert.deepEqual(checkCss(preferThemeColor, 'border-color: red var(--sf-danger)'), [])
})
