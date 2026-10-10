// Rules are written for the content tree: each block is one element and its child blocks are its
// children. A block a component renders (a node view) is one box too, in the editor and on
// published pages alike: the component's own box wears the block's classes and is the box its
// parent places. Inside it, a content box ([data-node-view-content]) holds the child blocks.
// throughNodeViews rewrites a selector so it reaches the same blocks through that content box:
//   - A child step also finds the blocks in a content box.
//   - A layout's content box steps aside (display: contents), so its first block comes right after
//     the component's own last part. Given stepAside (those layouts), a + or ~ after a child step
//     reaches it.
// Inserted tests are zero-weight (:where) and a selector's alternatives share one weight, so a
// rewritten selector keeps the weight it was written with.
// Shapes it can't map faithfully throw: :has() inside :has() (the browser drops the whole rule),
// a child or sibling step inside :not() / :is() / :where(), a sibling step straight inside
// :has(), and a selector already written for node views.
// Imports nothing, so node --test runs it as it is (api/test/).

const CBOX = ':where([data-node-view-content])'

const SELECTOR_ARGUMENT = /^:(not|is|where)$/i
const IDENT_CHAR = /[\w\-\u00a0-\uffff]/

type Combinator = '' | ' ' | '>' | '+' | '~'

interface Context {
	stepAside: string
	inHas: boolean
}

interface Compound {
	text: string // as written, a :has() argument rewritten ('' for * alone)
	pseudoElement: string
}

interface Step {
	combinator: Combinator
	compound: Compound
}

interface Block {
	compound: Compound
	found: string[] // the selectors that find it
	parentFound: string[] | null // the parent's, when this block was reached by a child step
}

// stepAside: the layouts whose content box steps aside, as a selector list.
export function throughNodeViews(selector: string, stepAside = ''): string {
	const ctx: Context = { stepAside, inHas: false }
	try {
		return mapList(selector, ctx, false).join(', ')
	} catch (e) {
		throw new Error(`throughNodeViews: ${(e as Error).message} in "${selector}"`)
	}
}

function mapList(list: string, ctx: Context, relative: boolean): string[] {
	const out = splitList(list).flatMap((complex) => {
		const steps = parseSteps(complex, ctx, relative)
		let last: Block | null = null
		for (const [i, step] of steps.entries()) {
			if (step.compound.pseudoElement && i < steps.length - 1)
				throw new Error('a pseudo-element before the last step')
			last = nextBlock(last, step, ctx, relative)
		}
		if (!last) throw new Error('an empty selector')
		const pseudoElement = last.compound.pseudoElement
		return last.found.map((s) => s + pseudoElement)
	})
	return [...new Set(out)]
}

// ─── Mapping ─────────────────────────────────────────────────────────────

function nextBlock(prev: Block | null, step: Step, ctx: Context, relative: boolean): Block {
	const { combinator: comb, compound: c } = step
	if (!prev) {
		// The first block: anywhere, or inside :has() relative to the element :has() is on.
		if (comb === '+' || comb === '~') throw new Error('a sibling step straight inside :has()')
		return block(c, comb === '>' ? ['>', `> ${CBOX} >`] : [''], null)
	}
	const parents = prev.found
	if (comb === '>') {
		const links = relative
			? parents.flatMap((p) => [`${p} >`, `${p} > ${CBOX} >`])
			: [`:is(${[...parents, ...parents.map((p) => `${p} > ${CBOX}`)].join(', ')}) >`]
		return block(c, links, parents)
	}
	const next = block(c, linksFrom(parents, comb, relative), null)
	if (comb === ' ' || !prev.parentFound || !ctx.stepAside || relative) return next
	// The first block of a content box that steps aside follows the component's own last part.
	const asideLink = `${fold(prev.parentFound)}:where(${ctx.stepAside}) > ${compound(prev.compound.text)} ${comb} ${CBOX} >`
	const first = comb === '+' ? ':where(:first-child)' : ''
	return { ...next, found: [...next.found, join(asideLink, compound(c.text, first))] }
}

function block(c: Compound, links: string[], parentFound: string[] | null): Block {
	return { compound: c, found: links.map((l) => join(l, compound(c.text))), parentFound }
}

function linksFrom(boxes: string[], comb: Combinator, relative: boolean): string[] {
	return relative ? boxes.map((b) => `${b} ${comb}`) : [`${fold(boxes)} ${comb}`]
}

function fold(alternatives: string[]): string {
	return alternatives.length === 1
		? (alternatives[0] as string)
		: `:is(${alternatives.join(', ')})`
}

function join(link: string, compoundText: string): string {
	const l = link.trimEnd()
	return l ? `${l} ${compoundText}` : compoundText
}

function compound(...parts: string[]): string {
	return parts.join('') || '*'
}

// ─── Parsing ─────────────────────────────────────────────────────────────

function parseSteps(text: string, ctx: Context, relative: boolean): Step[] {
	const steps: Step[] = []
	let comb: Combinator = ''
	let spaced = false
	let i = 0
	while (i < text.length) {
		const ch = text.charAt(i)
		if (/\s/.test(ch)) {
			spaced = true
			i++
		} else if (ch === '>' || ch === '+' || ch === '~') {
			if (comb) throw new Error('two combinators in a row')
			comb = ch
			i++
		} else {
			let j = i
			while (j < text.length && !/[\s>+~]/.test(text.charAt(j))) j = skip(text, j)
			if (steps.length === 0 && comb && !relative) throw new Error('a leading combinator')
			if (!comb && (steps.length > 0 || relative) && (spaced || steps.length === 0))
				comb = ' '
			steps.push({ combinator: comb, compound: parseCompound(text.slice(i, j), ctx) })
			comb = ''
			spaced = false
			i = j
		}
	}
	if (comb) throw new Error('a trailing combinator')
	if (steps.length === 0) throw new Error('an empty selector')
	return steps
}

function parseCompound(text: string, ctx: Context): Compound {
	const c: Compound = { text: '', pseudoElement: '' }
	let i = 0
	if (text.charAt(0) === '*') i = 1
	else if (/[a-z]/i.test(text.charAt(0))) {
		i = readIdent(text, 0)
		c.text = text.slice(0, i)
	}
	while (i < text.length) {
		if (c.pseudoElement) throw new Error('something after a pseudo-element')
		const ch = text.charAt(i)
		let j: number
		if (ch === '.' || ch === '#') {
			j = readIdent(text, i + 1)
			if (j === i + 1) throw new Error(`an empty name after '${ch}'`)
			c.text += text.slice(i, j)
		} else if (ch === '[') {
			j = skip(text, i)
			const attribute = text.slice(i, j)
			if (/data-node-view-(wrapper|content)/.test(attribute))
				throw new Error('a selector already written for node views')
			c.text += attribute
		} else if (ch === ':' && text.charAt(i + 1) === ':') {
			j = readIdent(text, i + 2)
			if (text.charAt(j) === '(') j = skip(text, j)
			c.pseudoElement = text.slice(i, j)
		} else if (ch === ':') {
			j = readIdent(text, i + 1)
			const name = text.slice(i, j)
			let argument: string | null = null
			if (text.charAt(j) === '(') {
				const end = skip(text, j)
				argument = text.slice(j + 1, end - 1)
				j = end
			}
			if (name.toLowerCase() === ':has') {
				if (ctx.inHas || argument === null) throw new Error(':has() inside :has()')
				const inside = mapList(argument, { ...ctx, inHas: true }, true)
				c.text += `:has(${inside.join(', ')})`
			} else {
				if (argument !== null && SELECTOR_ARGUMENT.test(name)) checkArgument(argument, ctx)
				c.text += text.slice(i, j)
			}
		} else throw new Error(`an unexpected '${ch}'`)
		i = j
	}
	return c
}

// A :not() / :is() / :where() argument stays as written, so a child or sibling step in it wouldn't
// reach through a content box, and a :has() in it would go unrewritten. A descendant step (`p *`,
// "inside a paragraph") reads the same through a node view.
function checkArgument(argument: string, ctx: Context): void {
	if (/:has\(/i.test(argument)) throw new Error(':has() inside :not(), :is() or :where()')
	for (const item of splitList(argument))
		if (parseSteps(item, ctx, false).some((s) => s.combinator !== '' && s.combinator !== ' '))
			throw new Error('a child or sibling step inside :not(), :is() or :where()')
}

function splitList(text: string): string[] {
	const out: string[] = []
	let start = 0
	for (let i = 0; i < text.length; ) {
		if (text.charAt(i) === ',') {
			out.push(text.slice(start, i).trim())
			start = ++i
		} else i = skip(text, i)
	}
	out.push(text.slice(start).trim())
	if (out.some((s) => !s)) throw new Error('an empty selector')
	return out
}

function readIdent(text: string, i: number): number {
	let j = i
	while (j < text.length) {
		const ch = text.charAt(j)
		if (ch === '\\') j += 2
		else if (IDENT_CHAR.test(ch)) j++
		else break
	}
	return j
}

// The index just past the escape, string or bracketed run starting at i (else past one char).
function skip(text: string, i: number): number {
	const ch = text.charAt(i)
	if (ch === '\\') return i + 2
	if (ch === '"' || ch === "'") {
		let j = i + 1
		while (j < text.length && text.charAt(j) !== ch) j += text.charAt(j) === '\\' ? 2 : 1
		if (j >= text.length) throw new Error('an unclosed string')
		return j + 1
	}
	if (ch === '(' || ch === '[') {
		const close = ch === '(' ? ')' : ']'
		let j = i + 1
		while (j < text.length && text.charAt(j) !== close) j = skip(text, j)
		if (j >= text.length) throw new Error(`an unclosed '${ch}'`)
		return j + 1
	}
	if (ch === ')' || ch === ']') throw new Error(`an unexpected '${ch}'`)
	return i + 1
}
