// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noContainerUnits } from '../rules/noContainerUnits.ts'
import { checkCss } from './checkCss.mjs'

test('each container unit is a result, wherever it is in a value', () => {
	const style =
		'width: 10cqw; height: calc(100cqh - 1rem); padding: var(--x, 2CQI); --space: 5cqmin; margin: 1cqb 2cqmax'
	const results = checkCss(noContainerUnits, style)
	assert.deepEqual(
		results.map(({ parts }) => parts),
		[['10cqw'], ['100cqh'], ['2CQI'], ['5cqmin'], ['1cqb'], ['2cqmax']],
	)
	assert.equal(
		results[0].message,
		'cqw measures a container the system places, not one you choose',
	)
})

test('other units, or the letters in text or a name, are no result', () => {
	const style = 'width: 10vw; padding: 2rem; --cqw: 1px; content: "10cqw"'
	assert.deepEqual(checkCss(noContainerUnits, style), [])
})
