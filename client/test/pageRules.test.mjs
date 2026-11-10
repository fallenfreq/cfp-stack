// From client/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkPage } from '../src/editor/pageRules.ts'
import { block, page, wearsOn } from './editorPage.mjs'

// Each warning as [its rule, the positions of the blocks it names].
const found = (doc) => checkPage(doc, wearsOn(doc)).map(({ rule, blocks }) => [rule, blocks])

test('a warning names the blocks it was found on, a component block by its own classes', () => {
	// At 0 a line, at 2 a Stack (sl-stack its own), at 3 the line in it.
	const doc = page(
		block('paragraph', { id: 'intro' }),
		block('layout-stack', { class: 'sl-inset' }, block('paragraph', { id: 'intro' })),
	)
	assert.deepEqual(checkPage(doc, wearsOn(doc)), [
		{
			rule: 'no-duplicate-id',
			type: 'problem',
			message: '2 blocks share the id "intro"',
			blocks: [0, 3],
		},
		{
			rule: 'one-arrangement-per-box',
			type: 'problem',
			message: 'One block has 2 arrangements: sl-stack and sl-inset',
			blocks: [2],
		},
	])
})

test("a block's own style names its block, the rules for a box only one that holds blocks", () => {
	// At 0 a plain box, at 1 the line in it.
	const style = { style: 'overflow: hidden; width: 10cqw' }
	const doc = page(block('div', style, block('paragraph', style)))
	assert.deepEqual(found(doc), [
		['no-container-units', [0]],
		['no-overflow-hidden', [0]],
		['no-container-units', [1]],
	])
})

test('a page with nothing wrong has no warnings', () => {
	const doc = page(block('layout-stack', null, block('paragraph', { id: 'intro' })))
	assert.deepEqual(found(doc), [])
})
