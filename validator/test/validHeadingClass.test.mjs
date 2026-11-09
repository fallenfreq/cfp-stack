// From validator/: pnpm test.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validHeadingClass } from '../rules/validHeadingClass.ts'
import { checkHtml } from './checkHtml.mjs'

test("a heading's look on what isn't a heading, or two on one heading, is a result", () => {
	const page = `<p class="sf-heading-2">Lead text</p>
<div class="sf-heading-1 sf-heading-2"><p>A box</p></div>
<p>Text with <span class="sf-heading-3">a word</span></p>
<h2 class="sf-heading-1 sf-heading-3">Two</h2>`
	assert.deepEqual(checkHtml(validHeadingClass, page), [
		{
			message:
				"A heading's look (sf-heading-2) on what isn't a heading: larger body text takes a text size",
			lines: [1],
		},
		{
			message:
				"A heading's look (sf-heading-1 and sf-heading-2) on what isn't a heading: larger body text takes a text size",
			lines: [2],
		},
		{
			message:
				"A heading's look (sf-heading-3) on what isn't a heading: larger body text takes a text size",
			lines: [3],
		},
		{ message: 'One heading has 2 prominences: sf-heading-1 and sf-heading-3', lines: [4] },
	])
})

test("a heading with one prominence, or a class that isn't one, is no result", () => {
	const page = `<h1 class="sf-heading-2">Nested h1, second prominence</h1>
<h2>Its level's</h2>
<h3 class="sf-heading-1 sf-heading-1">Twice</h3>
<h4 class="sf-heading-2"></h4><h5 class="sf-heading-2"></h5><h6 class="sf-heading-2"></h6>
<p class="sf-text-lg">Lead text</p>
<p class="sf-headings-1 sf-heading-x">Not a prominence</p>`
	assert.deepEqual(checkHtml(validHeadingClass, page), [])
})
