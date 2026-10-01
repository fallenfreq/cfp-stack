// From api/: node --test 'test/*.test.mjs'  (Node 24 loads the .ts helper as it is)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { throughNodeViews } from '../src/domain/css/nodeViewSelectors.ts'

const PLACEMENT = ['sl-row', 'sl-bleed', 'sl-pin-', 'sl-hide-below-', 'sl-show-below-']
const ASIDE =
	'.sl-stack, .sl-cluster, .sl-columns, .sl-row, .sl-split, .sl-grid, .sl-inset, .sl-cover'
const looks = { placementClasses: PLACEMENT, stepAside: ASIDE }
const placed = { ...looks, subject: 'placed' }

const W = '[data-node-view-wrapper]'
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
	])
		assert.equal(throughNodeViews(s, looks), s)
})

test('a child step reaches the blocks in a content box', () => {
	assert.equal(throughNodeViews('.sl-inset > *', placed), `:is(.sl-inset, .sl-inset > ${C}) > *`)
	// A placement class is on the wrapper too, so the placed box is found directly.
	assert.equal(
		throughNodeViews('.sl-inset > .sl-bleed', placed),
		`:is(.sl-inset, .sl-inset > ${C}) > .sl-bleed`,
	)
	// A look lands on the element wearing the classes: the block, or a component's root.
	assert.equal(
		throughNodeViews('.sl-inset > .sl-bleed.sl-inset', looks),
		`:is(.sl-inset, .sl-inset > ${C}) > .sl-bleed.sl-inset, `
			+ `:is(.sl-inset, .sl-inset > ${C}) > :where(${W}) > .sl-bleed.sl-inset`,
	)
})

test('dividers: tested between the placed boxes, drawn on the wearer', () => {
	const q = `:is(.sf-divide-y, .sf-divide-y > ${C})`
	const aside = `.sf-divide-y:where(${ASIDE}) > * + ${C} >`
	assert.equal(
		throughNodeViews('.sf-divide-y > * + *', looks),
		[
			`${q} > * + :where(:not(${W}))`,
			`${q} > * + :where(${W}) > *`,
			`${aside} :where(:not(${W}, ${W} > *)):where(:first-child)`,
			`${aside} :where(${W}):where(:first-child) > *`,
		].join(', '),
	)
	// Without stepAside, only the first two.
	assert.equal(
		throughNodeViews('.sf-divide-y > * + *', { placementClasses: PLACEMENT }),
		`${q} > * + :where(:not(${W})), ${q} > * + :where(${W}) > *`,
	)
})

test(':has() lists each way a child can sit', () => {
	assert.equal(
		throughNodeViews('.sl-scroll-frame:has(> .sl-scroll-x)::after', looks),
		'.sl-scroll-frame:has('
			+ [
				'> .sl-scroll-x',
				`> :where(${W}) > .sl-scroll-x`,
				`> ${C} > .sl-scroll-x`,
				`> ${C} > :where(${W}) > .sl-scroll-x`,
			].join(', ')
			+ ')::after',
	)
})

test('a placement class: placed rules skip the root, looks skip the wrapper', () => {
	assert.equal(throughNodeViews('.sl-pin-top', placed), `.sl-pin-top:where(:not(${W} > *))`)
	assert.equal(
		throughNodeViews('.sl-pin-top::after', looks),
		`.sl-pin-top:where(:not(${W}))::after`,
	)
	assert.equal(
		throughNodeViews('.sf-is-overflow-bottom .sl-pin-bottom::after', looks),
		`.sf-is-overflow-bottom .sl-pin-bottom:where(:not(${W}))::after`,
	)
})

test(':is() / :where() naming a class rule the wrapper out; :not() does not', () => {
	assert.equal(
		throughNodeViews(':where(.tiptap.ProseMirror) .sl-hide-below-md', placed),
		`:where(.tiptap.ProseMirror) .sl-hide-below-md:where(:not(${W} > *))`,
	)
	assert.equal(throughNodeViews(':not(.x)', looks), `:not(.x):where(:not(${W}))`)
})

test('a place test moves to the placed box', () => {
	const q = `:is(.x, .x > ${C})`
	assert.equal(
		throughNodeViews('.x > :not(:first-child)', looks),
		`${q} > :where(:not(${W}, ${W} > *)):not(:first-child), ${q} > :where(${W}):not(:first-child) > *`,
	)
})

test('shapes that cannot be mapped faithfully throw', () => {
	for (const s of [
		'.a:has(.b:has(.c))', // nested :has() — the browser drops the whole rule
		'.a:has(+ .b)', // a sibling step straight inside :has()
		'.a:not(.b > .c)', // a child step inside :not()
		'.a:where(.b :first-child)', // a place test in a descendant step inside :where()
		'.a:not(.b:first-child)', // a place test mixed with other tests
		`${W} > .x`, // already written for node views
		'> .a', // a leading combinator
		'.a >', // a trailing combinator
		'.a::after .b', // a pseudo-element before the last step
		'.a, ', // an empty selector
		'.a:has(> .b + .c)', // would need :has() inside :has()
	])
		assert.throws(() => throughNodeViews(s, looks), /throughNodeViews/, s)
})

// Every alternative keeps the weight the selector was written with.
test('weights are unchanged', () => {
	const cases = [
		['.sf-divide-y > * + *', looks],
		['.sf-divide-x > * + *', looks],
		['.sl-scroll-frame:has(> .sl-scroll-x)::after', looks],
		['.sl-scroll-frame:has(> .sl-scroll-x.sf-is-overflow-right .sl-pin-right)::after', looks],
		['.sf-is-overflow-bottom .sl-pin-bottom::after', looks],
		['.sl-inset > *', placed],
		['.sl-inset > .sl-bleed', placed],
		['.sl-inset > .sl-bleed.sl-inset', looks],
		['.sl-cluster.sl-scroll-x > *', placed],
		['.sl-object-cover > img:only-child', looks],
		['tr:last-child td', looks],
		['.x > :not(:first-child)', looks],
		['.a + .b', looks],
		['.a > .b ~ p:nth-child(2n+1)', looks],
		['.a .b > .c', placed],
		['div.x > .y:hover', looks],
	]
	for (const [s, options] of cases) {
		const want = specificity(s)
		for (const alternative of splitList(throughNodeViews(s, options)))
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
