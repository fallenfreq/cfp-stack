// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { maxHideShowRun } from '../rules/maxHideShowRun.ts'
import { checkHtml } from './checkHtml.mjs'

// A run of blocks a line each, a desktop and a mobile version of each paragraph.
const run = (length) =>
	Array.from({ length }, (_, i) =>
		i % 2
			? '<p class="sl-show-below-md">Mobile</p>'
			: '<p class="sl-hide-below-md">Desktop</p>',
	)
const slows = (length) =>
	`${length} blocks in a row each hide or show, which slows the page as its width changes: put those that hide together in one box and hide the box`

test('100 or more side-by-side blocks that each hide or show is a suggestion on the first', () => {
	const page = ['<p>Shown</p>', ...run(100), '<p>Shown</p>', ...run(120)].join('\n')
	assert.deepEqual(checkHtml(maxHideShowRun, page), [
		{ message: slows(100), lines: [2] },
		{ message: slows(120), lines: [103] },
	])
	assert.equal(maxHideShowRun.type, 'suggestion')
})

test('the run goes on past text and counts each block once, whatever it wears', () => {
	const blocks = run(100)
	blocks[50] =
		'Some text between\n<p class="sl-hide-below-sm sl-show-below-md">Between sm and md</p>'
	const page = `<div class="sl-stack">\n${blocks.join('\n')}\n</div>`
	assert.deepEqual(checkHtml(maxHideShowRun, page), [{ message: slows(100), lines: [2] }])
})

test('a shorter run, a shown block between, or blocks in boxes of their own is no result', () => {
	const broken = run(100)
	broken[50] = '<p>Shown</p>'
	const page = [
		...run(99),
		'<p>Shown</p>',
		...broken,
		`<div class="sl-hide-below-md">${run(60).join('')}</div>`,
		`<div class="sl-hide-below-md">${run(60).join('')}</div>`,
	].join('\n')
	assert.deepEqual(checkHtml(maxHideShowRun, page), [])
})
