// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noDuplicateId } from '../rules/noDuplicateId.ts'
import { checkHtml } from './checkHtml.mjs'

test('two blocks with one id, at any depth, are one result naming both in page order', () => {
	const page = `<p id="intro">One</p>
<div>
	<section>
		<p id="intro">Two</p>
	</section>
</div>`
	assert.deepEqual(checkHtml(noDuplicateId, page), [
		{ message: '2 blocks share the id "intro"', lines: [1, 4] },
	])
})

test('a block with an id is walked into too, and each id is its own result, in page order', () => {
	const page = `<div id="a">
	<p id="a">One</p>
	<p id="b">Two</p>
</div>
<p id="b">Three</p>
<p id="a">Four</p>`
	assert.deepEqual(checkHtml(noDuplicateId, page), [
		{ message: '3 blocks share the id "a"', lines: [1, 2, 6] },
		{ message: '2 blocks share the id "b"', lines: [3, 5] },
	])
})

test('no id, an empty one, or ids that differ only in case are no result', () => {
	const page = `<p>One</p>
<p id="">Two</p>
<p id="">Three</p>
<p id="Intro">Four</p>
<p id="intro">Five</p>`
	assert.deepEqual(checkHtml(noDuplicateId, page), [])
})
