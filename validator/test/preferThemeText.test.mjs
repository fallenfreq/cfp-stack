// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { preferThemeText } from '../rules/preferThemeText.ts'
import { checkCss } from './checkCss.mjs'

test('a font, size, line height or letter spacing of its own is a result, however it is written', () => {
	const style = [
		'font-family: Arial, sans-serif',
		'FONT-SIZE: 14PX',
		'font-size: 1.2em',
		'font-size: small',
		'line-height: 1.5',
		'line-height: normal',
		'letter-spacing: 0.05em',
		'letter-spacing: normal',
		'font: 12px Arial',
	].join('; ')
	const results = checkCss(preferThemeText, style)
	assert.deepEqual(
		results.map(({ parts }) => parts[0]),
		style.split('; '),
	)
	assert.deepEqual(
		results
			.map(({ message }) => message)
			.filter((message, index, all) => all.indexOf(message) === index),
		[
			"A font of its own isn't the theme's: use a theme font",
			"A font size of its own isn't the theme's: use a theme font size",
			"A line height of its own isn't the theme's: use a theme line height",
			"A letter spacing of its own isn't the theme's: use a theme letter spacing",
			"`font` sets a font, size and line height of its own: take it off in the code view, then pick the theme's",
		],
	)
})

test("a theme value, the text around it's, or another property is no result", () => {
	const style = [
		'font-family: var(--sf-font-1)',
		'font-size: var(--sf-text-lg)',
		'line-height: calc(var(--sf-leading-tight) * 1.1)',
		'letter-spacing: inherit',
		'font: unset',
		'color: red',
		'font-weight: 700',
		'--sf-text-size: 14px',
	].join('; ')
	assert.deepEqual(checkCss(preferThemeText, style), [])
})
