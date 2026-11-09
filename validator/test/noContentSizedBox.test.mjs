// From validator/: pnpm test.
import { parse } from '@eslint/css-tree'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { check } from '../core.ts'
import { noContentSizedBox } from '../rules/noContentSizedBox.ts'
import { checkCss } from './checkCss.mjs'

// What each style names, one style to a box. Each case was measured in Chrome (see the rule): 0
// wide when named, wider when not.
const found = (style) => checkCss(noContentSizedBox, style).flatMap(({ parts }) => parts)

test('a box that sizes what is inside by its content is a result naming what does it', () => {
	const cases = {
		'display: flex': 'display: flex',
		'display: inline-flex; flex-direction: column': 'display: inline-flex',
		'display: inline-flex; width: 100%': 'display: inline-flex',
		'display: flex; flex-direction: row-reverse': 'display: flex',
		'display: flex; flex-direction: column; flex-flow: wrap': 'display: flex',
		'display: flex; flex-flow: column; flex-direction: row': 'display: flex',
		'display: inline flex': 'display: inline flex',
		'display: inline-block': 'display: inline-block',
		'display: inline-block; min-width: 0': 'display: inline-block',
		'display: inline-block; min-width: 0px': 'display: inline-block',
		'display: inline-block; width: fit-content(20rem)': 'display: inline-block',
		'display: grid; grid-template-columns: none; grid-auto-columns: max-content':
			'grid-auto-columns: max-content',
		'display: inline-grid': 'display: inline-grid',
		'display: table': 'display: table',
		'display: inline-table': 'display: inline-table',
		'display: table-cell': 'display: table-cell',
		'display: table-cell; width: 100%': 'display: table-cell',
		'display: inline flow-root': 'display: inline flow-root',
		'display: flex; flex-direction: column; align-items: center': 'align-items: center',
		'display: flex; flex-direction: column; align-items: safe center':
			'align-items: safe center',
		'display: flex; flex-flow: column wrap; place-items: start': 'place-items: start',
		'display: grid; justify-items: center': 'justify-items: center',
		'display: grid; place-items: center': 'place-items: center',
		'display: grid; justify-content: start': 'justify-content: start',
		'display: grid; place-content: center': 'place-content: center',
		'display: grid; grid-template-columns: auto auto; justify-content: start':
			'justify-content: start',
		'display: grid; grid-auto-columns: auto; justify-content: center':
			'justify-content: center',
		'display: grid; grid-template-columns: auto 1fr': 'grid-template-columns: auto 1fr',
		'display: grid; grid-template-columns: minmax(0, auto) 1fr':
			'grid-template-columns: minmax(0, auto) 1fr',
		'display: grid; grid-template-columns: max-content': 'grid-template-columns: max-content',
		'display: grid; grid-template-columns: min-content 1fr':
			'grid-template-columns: min-content 1fr',
		'display: grid; grid-template-columns: fit-content(300px) 1fr':
			'grid-template-columns: fit-content(300px) 1fr',
		'display: grid; grid-auto-columns: max-content': 'grid-auto-columns: max-content',
		'display: grid; grid-template: auto / max-content': 'grid-template: auto / max-content',
		'display: grid; grid: auto-flow / max-content': 'grid: auto-flow / max-content',
		'display: grid; grid: auto / auto-flow max-content': 'grid: auto / auto-flow max-content',
		'float: left': 'float: left',
		'position: absolute': 'position: absolute',
		'position: fixed': 'position: fixed',
		'width: fit-content': 'width: fit-content',
		'width: max-content': 'width: max-content',
		'width: -webkit-fit-content': 'width: -webkit-fit-content',
		'inline-size: min-content': 'inline-size: min-content',
		'max-width: fit-content': 'max-width: fit-content',
		'width: 100%; max-width: fit-content': 'max-width: fit-content',
		'max-inline-size: max-content': 'max-inline-size: max-content',
		'display: flex !important; display: block': 'display: flex !important',
	}
	for (const [style, part] of Object.entries(cases)) assert.deepEqual(found(style), [part], style)
	assert.deepEqual(
		checkCss(noContentSizedBox, 'display: flex')[0].message,
		'display: flex sizes the blocks inside by their content, so a layout in it that holds a collapsing block is 0 wide: arrange them with sl- classes',
	)
})

test('a box whose blocks fill its width, or a width of its own, is no result', () => {
	for (const style of [
		'',
		'display: block',
		'display: grid',
		'display: flow-root',
		'display: contents',
		'display: inline',
		'display: flex; flex-direction: column',
		'display: flex; flex-flow: column-reverse',
		'display: flex; flex-direction: column; align-items: stretch',
		'display: flex; flex-direction: column; align-items: center; place-items: stretch',
		'display: flex; flex-direction: column; justify-items: center',
		'display: inline-flex; width: 100%; flex-direction: column',
		'display: grid; justify-items: center; place-items: stretch',
		'display: grid; PLACE-ITEMS: center stretch',
		'display: grid; place-items: first baseline stretch',
		'display: grid; grid: auto / auto-flow max-content; grid-auto-columns: 1fr',
		'display: grid; grid-template: max-content / 1fr',
		'display: grid; place-content: center stretch',
		'display: grid; grid-template-columns: 1fr 1fr',
		'display: grid; grid-template-columns: auto',
		'display: grid; grid-template-columns: auto auto',
		'display: grid; grid-template-columns: repeat(3, auto)',
		'display: grid; grid-template-columns: auto 200px',
		'display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr))',
		'display: grid; grid-template-columns: minmax(auto, 1fr)',
		'display: grid; grid-template-columns: 1fr; justify-content: center',
		'display: grid; grid-template-columns: none; grid-auto-columns: 1fr; justify-content: center',
		'display: inline-block; width: 300px',
		'display: inline-block; width: 100%',
		'display: inline-block; min-width: 200px',
		'display: table; width: 100%',
		'display: inline-table; min-width: 100%',
		'display: table-cell; width: 300px',
		'float: left; width: 50%',
		'position: absolute; width: 100%',
		'width: fit-content; min-width: 100%',
		'position: relative',
		'position: sticky',
		'margin-inline: auto',
		'min-width: max-content',
		'width: 50%',
		'float: none',
		'display: flex; display: block',
	])
		assert.deepEqual(found(style), [], style)
})

test('in a stylesheet each rule is a box of its own', () => {
	const sheet =
		'.row { display: flex } .row { flex-direction: column } @media (width > 40rem) { .wide { width: fit-content } }'
	const results = check(parse(sheet, { positions: true }), [noContentSizedBox])
	assert.deepEqual(
		results.map(({ nodes }) =>
			sheet.slice(nodes[0].loc.start.offset, nodes[0].loc.end.offset).trim(),
		),
		['display: flex', 'width: fit-content'],
	)
})
