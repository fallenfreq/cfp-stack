// From client/: pnpm test.
import { check } from '@somefreq-app/validator/core'
import { noBleedingCenter } from '@somefreq-app/validator/rules/noBleedingCenter'
import { noOverflowHidden } from '@somefreq-app/validator/rules/noOverflowHidden'
import { oneArrangementPerBox } from '@somefreq-app/validator/rules/oneArrangementPerBox'
import { preferCenterAroundVideo } from '@somefreq-app/validator/rules/preferCenterAroundVideo'
import { preferThemeColor } from '@somefreq-app/validator/rules/preferThemeColor'
import { requirePictureSize } from '@somefreq-app/validator/rules/requirePictureSize'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readPage } from '../src/editor/readPage.ts'
import { block, elementsOf, page, read, schema } from './editorPage.mjs'

// Each block with an id, by its position on the page.
const idsOf = (doc) => {
	const ids = new Map()
	doc.descendants((node, pos) => {
		if (node.attrs['id']) ids.set(pos, node.attrs['id'])
	})
	return ids
}

// The HTML the editor writes for each block (`getHTML()` in Chrome, 2026-11-10), without its
// text, and each style as saved: the browser tidies a style as it writes it (`color: red;`).
test('each block reads as the page writes it', () => {
	const doc = page(
		block('heading', { level: 2 }, 'Title'),
		block('heading', { level: 3, class: 'sf-heading-1' }, 'Own prominence'),
		block('paragraph', { style: 'color: red', id: 'intro' }, 'Text'),
		block('blockquote', null, block('paragraph', null, 'Quoted')),
		block('bulletList', null, block('listItem', null, block('paragraph', null, 'One'))),
		block('orderedList', null, block('listItem', null, block('paragraph', null, 'One'))),
		block(
			'taskList',
			null,
			block('taskItem', { checked: true }, block('paragraph', null, 'Done')),
		),
		block(
			'table',
			null,
			block(
				'tableRow',
				null,
				block('tableHeader', null, block('paragraph', null, 'H')),
				block('tableCell', null, block('paragraph', null, 'C')),
			),
		),
		block('codeBlock', { language: 'css' }, 'a {}'),
		block('image', { src: 'a.png', alt: 'A', width: 800, height: 600 }),
		block('horizontalRule'),
		block('div', { class: 'sl-cluster' }, block('paragraph', null, 'In a box')),
		block('layout-card', { class: 'sf-padding-md' }, block('paragraph', null, 'In a Card')),
		block(
			'layout-center',
			{ maxWidth: 'md' },
			block(
				'layout-stack',
				{ align: 'center', style: 'overflow: hidden' },
				block('paragraph', null, 'In a Stack'),
			),
		),
	)
	const html = `<h2></h2><h3 class="sf-heading-1"></h3><p id="intro" style="color: red"></p>
<blockquote><p></p></blockquote><ul><li><p></p></li></ul><ol><li><p></p></li></ol>
<ul data-type="taskList"><li data-checked="true" data-type="taskItem"><p></p></li></ul>
<table><tbody><tr><th><p></p></th><td><p></p></td></tr></tbody></table>
<pre><code class="language-css"></code></pre><img src="a.png" alt="A" width="800" height="600"><hr>
<div class="sl-cluster" data-container=""><p></p></div>
<layout-card class="sf-padding-md"><p></p></layout-card>
<layout-center maxwidth="md"><layout-stack align="center" style="overflow: hidden"><p></p></layout-stack></layout-center>`
	assert.deepEqual(readPage(doc, () => []).elements.children, elementsOf(html).children)
})

test('every kind of block in the editor reads', () => {
	for (const type of Object.values(schema.nodes)) {
		if (type.name === 'doc' || type.isText) continue
		const { elements } = readPage(
			schema.nodes.doc.create(null, [type.createAndFill()]),
			() => [],
		)
		assert.equal(elements.children[0]?.type, 'element', type.name)
	}
})

test("text and its marks aren't elements; what's in a line of text that's a block of its own is", () => {
	const { bold } = schema.marks
	const doc = page(
		block(
			'paragraph',
			null,
			schema.text('Bold', [bold.create()]),
			block('span', { class: 'sf-icon' }, 'Icon'),
			block('hardBreak'),
			'Plain',
		),
	)
	assert.deepEqual(
		read(doc).elements.children,
		elementsOf('<p><span class="sf-icon"></span><br></p>').children,
	)
})

test('each element wears what its block always wears, once, and what its page builder gave', () => {
	const doc = page(
		block('taskList', null, block('taskItem', { class: 'sf-depth-1' }, block('paragraph'))),
		block('heading', { level: 2 }),
		block('heading', { level: 2, class: 'sf-heading-1' }),
		block('layout-stack', { class: 'sl-stack sf-gap-sm' }, block('paragraph')),
		block('layout-card', null, block('paragraph')),
	)
	assert.deepEqual(
		read(doc).elements.children,
		elementsOf(`<ul data-type="taskList">
	<li class="sl-split sf-gap-md sf-depth-1" data-checked="false" data-type="taskItem"><p></p></li>
</ul>
<h2 class="sf-heading-2"></h2><h2 class="sf-heading-1"></h2>
<layout-stack class="sl-stack sf-gap-sm" align="stretch"><p></p></layout-stack>
<layout-card class="layout-card sf-depth-1"><p></p></layout-card>`).children,
	)
	// Its block's element only, not the other parts of its HTML.
	const table = page(
		block('table', null, block('tableRow', null, block('tableCell', null, block('paragraph')))),
	)
	assert.deepEqual(
		readPage(table, (node) => (node.type.name === 'table' ? ['sf-depth-1'] : [])).elements
			.children,
		elementsOf('<table class="sf-depth-1"><tbody><tr><td><p></p></td></tr></tbody></table>')
			.children,
	)
})

test('a rule run on what it reads finds the block, its own look and its component counted', () => {
	const doc = page(
		block(
			'taskList',
			null,
			block('taskItem', { id: 'item', class: 'sl-stack' }, block('paragraph')),
		),
		block('layout-center', { id: 'centre', class: 'sl-bleed' }, block('paragraph')),
		block('layout-stack', { id: 'stack', class: 'sl-inset' }, block('paragraph')),
		block(
			'div',
			null,
			block('youtube', { id: 'video', class: 'sl-center', src: 'https://youtu.be/x' }),
		),
		block('layout-card', null, block('image', { id: 'picture', src: 'a.png' })),
	)
	const { elements, blockOf } = read(doc)
	const ids = idsOf(doc)
	const rules = [
		oneArrangementPerBox,
		noBleedingCenter,
		preferCenterAroundVideo,
		requirePictureSize,
	]
	assert.deepEqual(
		check(elements, rules).map(({ rule, nodes }) => [
			rule,
			...nodes.map((node) => ids.get(blockOf.get(node))),
		]),
		[
			['one-arrangement-per-box', 'item'],
			['one-arrangement-per-box', 'stack'],
			['no-bleeding-center', 'centre'],
			['prefer-center-around-video', 'video'],
			['require-picture-size', 'picture'],
		],
	)
})

test('every element is tied to its block, the parts of its HTML included', () => {
	const doc = page(
		block(
			'table',
			{ id: 'table' },
			block(
				'tableRow',
				{ id: 'row' },
				block('tableCell', { id: 'cell' }, block('paragraph', { id: 'line' })),
			),
		),
		block('codeBlock', { id: 'code' }),
	)
	const { elements, blockOf } = read(doc)
	const ids = idsOf(doc)
	const tied = []
	const walk = (node) => {
		for (const child of node.children) {
			tied.push([child.tagName, ids.get(blockOf.get(child))])
			walk(child)
		}
	}
	walk(elements)
	assert.deepEqual(tied, [
		['table', 'table'],
		['tbody', 'table'],
		['tr', 'row'],
		['td', 'cell'],
		['p', 'line'],
		['pre', 'code'],
		['code', 'code'],
	])
})

test("each block's own style is read as CSS, marked where the rules for a box that holds blocks run", () => {
	const hidden = { style: 'overflow: hidden' }
	const doc = page(
		block('div', { id: 'box', ...hidden }, block('paragraph', { id: 'line', ...hidden })),
		block('blockquote', { id: 'quote', ...hidden }, block('paragraph')),
		block(
			'layout-stack',
			{ id: 'stack', ...hidden },
			block('heading', { id: 'heading', ...hidden }),
		),
		block(
			'bulletList',
			{ id: 'list', ...hidden },
			block('listItem', { id: 'item', ...hidden }, block('paragraph')),
		),
		block(
			'table',
			{ id: 'table', ...hidden },
			block(
				'tableRow',
				null,
				block('tableCell', { id: 'cell', ...hidden }, block('paragraph')),
			),
		),
		block('image', { id: 'picture', src: 'a.png', ...hidden }),
		block('youtube', { id: 'video', src: 'https://youtu.be/x', ...hidden }),
		block('paragraph', null, block('span', { id: 'span', ...hidden }, 'Text')),
	)
	const ids = idsOf(doc)
	const styles = read(doc).styles.map(({ block, css, holdsBlocks }) => [
		ids.get(block),
		holdsBlocks,
		check(css, [noOverflowHidden]).length,
	])
	assert.deepEqual(styles, [
		['box', true, 1],
		['line', false, 1],
		['quote', true, 1],
		['stack', true, 1],
		['heading', false, 1],
		['list', true, 1],
		['item', true, 1],
		['table', true, 1],
		['cell', true, 1],
		['picture', false, 1],
		['video', false, 1],
		['span', false, 1],
	])
})

test("the styles text and inline blocks are written with are read on the block they're in, once for each written alike", () => {
	const { bold, textColor } = schema.marks
	const fixed = textColor.create({ fixed: 'red' })
	const doc = page(
		block(
			'paragraph',
			{ id: 'line' },
			schema.text('Red', [fixed]),
			schema.text(' and bold', [bold.create(), fixed]),
			schema.text(' themed', [textColor.create({ color: 'primary-5' })]),
		),
		block('paragraph', null, block('span', { id: 'span' }, schema.text('In a span', [fixed]))),
		// The colour around an inline block, not its text: on the block it's in.
		block('paragraph', { id: 'around' }, block('span', null, 'Plain').mark([fixed])),
	)
	const ids = idsOf(doc)
	const styles = read(doc).styles.map(({ block, css, holdsBlocks }) => [
		ids.get(block),
		holdsBlocks,
		check(css, [preferThemeColor]).length,
	])
	assert.deepEqual(styles, [
		['line', false, 1],
		['span', false, 1],
		['around', false, 1],
	])
})
