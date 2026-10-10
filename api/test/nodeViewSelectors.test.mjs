// From api/: node --test 'test/*.test.mjs'  (Node 24 loads the .ts helper as it is)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { throughNodeViews } from '../src/domain/css/nodeViewSelectors.ts'

const ASIDE =
	'.sl-stack, .sl-cluster, .sl-columns, .sl-row, .sl-split, .sl-grid, .sl-inset, .sl-cover'
const map = (s) => throughNodeViews(s, ASIDE)

const C = ':where([data-node-view-content])'

test('selectors with nothing to cross stay as written', () => {
	for (const s of [
		'.sf-depth-1',
		'button.sf-x:hover',
		'table th',
		'input:is([type="checkbox"], [type="radio"])',
		'.sl-scroll-y:has(.sl-pin-top):has(.sl-pin-bottom)',
		'a.sf-link::after',
		'a:where(p *, li *, td *, blockquote *)', // a link inside running text (seed)
		'.sl-pin-top::after',
		':where(.tiptap.ProseMirror) .sl-hide-below-md',
		':not(.x)',
		'.a:not(.b:first-child)',
		'.a:where(.b :first-child)',
	])
		assert.equal(map(s), s)
})

test('a child step reaches the blocks in a content box', () => {
	assert.equal(map('.sl-inset > *'), `:is(.sl-inset, .sl-inset > ${C}) > *`)
	assert.equal(
		map('.sl-inset > .sl-bleed.sl-inset'),
		`:is(.sl-inset, .sl-inset > ${C}) > .sl-bleed.sl-inset`,
	)
	assert.equal(map('.x > :not(:first-child)'), `:is(.x, .x > ${C}) > :not(:first-child)`)
})

test("in a layout, a content box's first block follows the component's own parts", () => {
	const q = `:is(.sf-divide-y, .sf-divide-y > ${C})`
	assert.equal(
		map('.sf-divide-y > * + *'),
		`${q} > * + *, .sf-divide-y:where(${ASIDE}) > * + ${C} > :where(:first-child)`,
	)
	// Without stepAside, only the first.
	assert.equal(throughNodeViews('.sf-divide-y > * + *'), `${q} > * + *`)
})

test(':has() lists each way a child can sit', () => {
	assert.equal(
		map('.sl-scroll-frame:has(> .sl-scroll-x)::after'),
		`.sl-scroll-frame:has(> .sl-scroll-x, > ${C} > .sl-scroll-x)::after`,
	)
})

test('shapes that cannot be mapped faithfully throw', () => {
	for (const s of [
		'.a:has(.b:has(.c))', // nested :has() — the browser drops the whole rule
		'.a:has(+ .b)', // a sibling step straight inside :has()
		'.a:not(.b > .c)', // a child step inside :not()
		'.a:is(.b:has(.c))', // :has() inside :is()
		'[data-node-view-wrapper] > .x', // already written for node views
		'> .a', // a leading combinator
		'.a >', // a trailing combinator
		'.a::after .b', // a pseudo-element before the last step
		'.a, ', // an empty selector
	])
		assert.throws(() => map(s), /throughNodeViews/, s)
})

// Every alternative keeps the weight the selector was written with.
test('weights are unchanged', () => {
	for (const s of [
		'.sf-divide-y > * + *',
		'.sf-divide-x > * + *',
		'.sl-scroll-frame:has(> .sl-scroll-x)::after',
		'.sl-scroll-frame:has(> .sl-scroll-x.sf-is-overflow-right .sl-pin-right)::after',
		'.sl-inset > *',
		'.sl-inset > .sl-bleed.sl-inset',
		'.sl-cluster.sl-scroll-x > *',
		'.sl-object-cover > img:only-child',
		'tr:last-child td',
		'.x > :not(:first-child)',
		'.a + .b',
		'.a > .b ~ p:nth-child(2n+1)',
		'.a .b > .c',
		'div.x > .y:hover',
	]) {
		const want = specificity(s)
		for (const alternative of splitList(map(s)))
			assert.deepEqual(specificity(alternative), want, `${s}\n  → ${alternative}`)
	}
})

// ─── A small specificity calculator (selectors level 4) ──────────────────

function specificity(selector) {
	return splitList(selector)
		.map(complexSpecificity)
		.reduce((a, b) => (compare(a, b) >= 0 ? a : b))
}

function complexSpecificity(text) {
	const s = [0, 0, 0]
	let i = 0
	while (i < text.length) {
		const ch = text[i]
		if (ch === '#') {
			s[0]++
			i = ident(text, i + 1)
		} else if (ch === '.') {
			s[1]++
			i = ident(text, i + 1)
		} else if (ch === '[') {
			s[1]++
			i = close(text, i)
		} else if (ch === ':' && text[i + 1] === ':') {
			s[2]++
			i = ident(text, i + 2)
			if (text[i] === '(') i = close(text, i)
		} else if (ch === ':') {
			const end = ident(text, i + 1)
			const name = text.slice(i + 1, end).toLowerCase()
			i = end
			if (text[i] === '(') {
				const after = close(text, i)
				const argument = text.slice(i + 1, after - 1)
				i = after
				if (name === 'where') continue
				if (['is', 'not', 'has', 'matches'].includes(name)) {
					const inner = specificity(
						argument.replace(/^\s*[>+~]/, '').replace(/,\s*[>+~]/g, ','),
					)
					for (const k of [0, 1, 2]) s[k] += inner[k]
					continue
				}
				if (/^nth-/.test(name) && /\bof\b/.test(argument))
					throw new Error('nth of S not handled')
			}
			s[1]++
		} else if (/[a-z]/i.test(ch)) {
			s[2]++
			i = ident(text, i)
		} else i++
	}
	return s
}

function compare(a, b) {
	return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
}

function ident(text, i) {
	while (i < text.length && /[\w-]/.test(text[i])) i++
	return i
}

function close(text, i) {
	const open = text[i]
	const shut = open === '(' ? ')' : ']'
	let depth = 0
	for (; i < text.length; i++) {
		if (text[i] === '"' || text[i] === "'") i = text.indexOf(text[i], i + 1)
		else if (text[i] === open) depth++
		else if (text[i] === shut && --depth === 0) return i + 1
	}
	throw new Error(`unclosed ${open}`)
}

function splitList(text) {
	const out = []
	let depth = 0
	let start = 0
	for (let i = 0; i < text.length; i++) {
		const ch = text[i]
		if (ch === '"' || ch === "'") i = text.indexOf(ch, i + 1)
		else if (ch === '(' || ch === '[') depth++
		else if (ch === ')' || ch === ']') depth--
		else if (ch === ',' && depth === 0) {
			out.push(text.slice(start, i).trim())
			start = i + 1
		}
	}
	out.push(text.slice(start).trim())
	return out
}
