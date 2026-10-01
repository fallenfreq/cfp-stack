// Rules are written for the content tree: each block is one element and its child blocks are its
// children. A block a component renders (a node view) is three boxes, in the editor and on
// published pages alike:
//   wrapper ([data-node-view-wrapper]) — the box its parent places;
//   component root (the wrapper's only child) — wears the block's classes and its look;
//   content box ([data-node-view-content], a child of the root) — holds the child blocks.
// throughNodeViews rewrites a selector so it reaches the same blocks through those boxes:
//   - A child step also finds the blocks in a content box.
//   - A block's place among its siblings (:first-child, :nth-*, +, ~) is tested on the box its
//     parent places; classes, element types and states on the element wearing them.
//   - The rule styles the element wearing the classes (a look), or with subject 'placed' the box
//     the parent places (where the block sits) — never both, so a look is drawn once.
//   - A layout's content box steps aside (display: contents), so its first block comes right after
//     the root's own last part. Given stepAside (those layouts), a + or ~ after a child step
//     reaches it.
// Inserted tests are zero-weight (:where) and a selector's alternatives share one weight, so a
// rewritten selector keeps the weight it was written with.
// Shapes it can't map faithfully throw: :has() inside :has() (the browser drops the whole rule),
// a child or sibling step inside :not() / :is() / :where(), a sibling step straight inside
// :has(), and a selector already written for node views.
// Imports nothing, so node --test runs it as it is (api/test/).

export interface NodeViewSelectorOptions {
	// Which element the rule styles: the one wearing the classes (default), or the box the parent
	// places.
	subject?: 'wearer' | 'placed'
	// Classes a block also puts on its wrapper; a trailing '-' names a prefix.
	placementClasses?: readonly string[]
	// The layouts whose content box steps aside, as a selector list.
	stepAside?: string
}

const W = '[data-node-view-wrapper]'
const IS_W = `:where(${W})`
const NOT_W = `:where(:not(${W}))`
const NOT_ROOT = `:where(:not(${W} > *))`
const NOT_W_OR_ROOT = `:where(:not(${W}, ${W} > *))`
const CBOX = ':where([data-node-view-content])'

const PLACE_TESTS =
	/^:(first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|nth-child|nth-last-child|nth-of-type|nth-last-of-type)$/i
const SELECTOR_ARGUMENT = /^:(not|is|where)$/i
const IDENT_CHAR = /[\w\-\u00a0-\uffff]/

type Combinator = '' | ' ' | '>' | '+' | '~'

interface Context {
	placementClasses: readonly string[]
	stepAside: string
	inHas: boolean
}

interface Compound {
	type: string // element name ('' for none or *)
	wearer: string // classes, ids, attributes, states, :has() — tested on the element wearing them
	place: string // its place among its siblings — tested on the box the parent places
	pseudoElement: string
	canBeWrapper: boolean // nothing in it rules the wrapper out
	placementOnly: boolean // it names only placement classes, which the wrapper wears too
}

interface Step {
	combinator: Combinator
	compound: Compound
}

interface Block {
	compound: Compound
	wearers: () => string[]
	placed: () => string[]
	// The parent's wearers, when this block was reached by a child step.
	parentWearers: (() => string[]) | null
}

export function throughNodeViews(selector: string, options: NodeViewSelectorOptions = {}): string {
	const ctx: Context = {
		placementClasses: options.placementClasses ?? [],
		stepAside: options.stepAside ?? '',
		inHas: false,
	}
	try {
		return mapList(selector, ctx, options.subject ?? 'wearer', false).join(', ')
	} catch (e) {
		throw new Error(`throughNodeViews: ${(e as Error).message} in "${selector}"`)
	}
}

function mapList(
	list: string,
	ctx: Context,
	subject: 'wearer' | 'placed',
	relative: boolean,
): string[] {
	const out = splitList(list).flatMap((complex) => {
		const steps = parseSteps(complex, ctx, relative)
		let last: Block | null = null
		for (const [i, step] of steps.entries()) {
			if (step.compound.pseudoElement && i < steps.length - 1)
				throw new Error('a pseudo-element before the last step')
			last = nextBlock(last, step, ctx, relative)
		}
		if (!last) throw new Error('an empty selector')
		const found = subject === 'placed' ? last.placed() : last.wearers()
		const pseudoElement = last.compound.pseudoElement
		return found.map((s) => s + pseudoElement)
	})
	return [...new Set(out)]
}

// ─── Mapping ─────────────────────────────────────────────────────────────

function nextBlock(prev: Block | null, step: Step, ctx: Context, relative: boolean): Block {
	const { combinator: comb, compound: c } = step
	if (!prev) {
		// The first block: anywhere, or inside :has() relative to the element :has() is on.
		if (comb === '+' || comb === '~') throw new Error('a sibling step straight inside :has()')
		if (comb === '>') return block(c, ['>', `> ${CBOX} >`], false, relative, null)
		return block(c, [''], true, relative, null)
	}
	if (comb === '>') {
		const parents = prev.wearers()
		const links = relative
			? parents.flatMap((p) => [`${p} >`, `${p} > ${CBOX} >`])
			: [`:is(${[...parents, ...parents.map((p) => `${p} > ${CBOX}`)].join(', ')}) >`]
		return block(c, links, false, relative, prev.wearers)
	}
	if (comb === ' ')
		return block(c, linksFrom(prev.wearers(), ' ', relative), true, relative, null)

	// + or ~: siblings are the boxes the parent places.
	const next = block(c, linksFrom(prev.placed(), comb, relative), false, relative, null)
	const parentWearers = prev.parentWearers
	if (!parentWearers || !ctx.stepAside || relative) return next
	// The first block of a content box that steps aside follows the root's own last part.
	const x = prev.compound
	const asideLink = `${fold(parentWearers())}:where(${ctx.stepAside}) > ${compound(x.type, x.wearer, x.place)} ${comb} ${CBOX} >`
	const first = comb === '+' ? ':where(:first-child)' : ''
	return {
		...next,
		wearers: once(() => [
			...next.wearers(),
			...wearerAlternatives(c, [asideLink], false, relative, first),
		]),
	}
}

function block(
	c: Compound,
	links: string[],
	descendant: boolean,
	relative: boolean,
	parentWearers: (() => string[]) | null,
): Block {
	return {
		compound: c,
		wearers: once(() => wearerAlternatives(c, links, descendant, relative, '')),
		placed: once(() => placedAlternatives(c, links, descendant, relative)),
		parentWearers,
	}
}

// The element wearing the block's classes: the block itself, or a component's root.
function wearerAlternatives(
	c: Compound,
	links: string[],
	descendant: boolean,
	relative: boolean,
	extraPlace: string,
): string[] {
	const place = c.place + extraPlace
	const wearer = compound(c.type, c.wearer)
	if (!place) {
		// Inside :has() only existence counts, so finding the wrapper as well does no harm.
		const guard = c.canBeWrapper && !relative ? NOT_W : ''
		const plain = links.map((l) => join(l, compound(c.type, c.wearer, guard)))
		// A descendant step already finds a component's root.
		if (descendant) return plain
		return links.flatMap((l, i) => [plain[i] as string, `${join(l, IS_W)} > ${wearer}`])
	}
	return links.flatMap((l) => [
		join(l, compound(c.type, c.wearer, NOT_W_OR_ROOT, place)),
		`${join(l, compound(IS_W, place))} > ${wearer}`,
	])
}

// The box the parent places: the block itself, or a component's wrapper.
function placedAlternatives(
	c: Compound,
	links: string[],
	descendant: boolean,
	relative: boolean,
): string[] {
	const notRoot = descendant ? NOT_ROOT : ''
	if (!c.type && !c.wearer) return links.map((l) => join(l, compound(notRoot, c.place)))
	if (c.placementOnly) return links.map((l) => join(l, compound(c.wearer, notRoot, c.place)))
	if (relative || c.wearer.includes(':has(')) throw new Error(':has() inside :has()')
	return links.flatMap((l) => [
		join(l, compound(c.type, c.wearer, descendant ? NOT_W_OR_ROOT : NOT_W, c.place)),
		join(l, compound(IS_W, c.place, `:has(> ${compound(c.type, c.wearer)})`)),
	])
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

function once<T>(fn: () => T): () => T {
	let done = false
	let value: T
	return () => {
		if (!done) {
			value = fn()
			done = true
		}
		return value
	}
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
	const c: Compound = {
		type: '',
		wearer: '',
		place: '',
		pseudoElement: '',
		canBeWrapper: true,
		placementOnly: true,
	}
	let i = 0
	if (text.charAt(0) === '*') i = 1
	else if (/[a-z]/i.test(text.charAt(0))) {
		i = readIdent(text, 0)
		c.type = text.slice(0, i)
		c.placementOnly = false
		if (c.type.toLowerCase() !== 'div') c.canBeWrapper = false
	}
	while (i < text.length) {
		if (c.pseudoElement) throw new Error('something after a pseudo-element')
		const ch = text.charAt(i)
		let j: number
		if (ch === '.' || ch === '#') {
			j = readIdent(text, i + 1)
			const name = text.slice(i + 1, j)
			if (!name) throw new Error(`an empty name after '${ch}'`)
			c.wearer += text.slice(i, j)
			if (ch === '#' || !isPlacement(name, ctx)) {
				c.canBeWrapper = false
				c.placementOnly = false
			}
		} else if (ch === '[') {
			j = skip(text, i)
			const attribute = text.slice(i, j)
			if (/data-node-view-(wrapper|content)/.test(attribute))
				throw new Error('a selector already written for node views')
			c.wearer += attribute
			c.placementOnly = false
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
			const whole = text.slice(i, j)
			if (PLACE_TESTS.test(name)) c.place += whole
			else if (name.toLowerCase() === ':has') {
				if (ctx.inHas || argument === null) throw new Error(':has() inside :has()')
				const inside = mapList(argument, { ...ctx, inHas: true }, 'wearer', true)
				c.wearer += `:has(${inside.join(', ')})`
				c.placementOnly = false
			} else if (argument !== null && SELECTOR_ARGUMENT.test(name)) {
				const read = readArgument(argument, ctx)
				if (read.testsPlace) c.place += whole
				else {
					c.wearer += whole
					c.placementOnly = false
					if (read.rulesOutWrapper && name.toLowerCase() !== ':not')
						c.canBeWrapper = false
				}
			} else {
				c.wearer += whole
				c.placementOnly = false
			}
		} else throw new Error(`an unexpected '${ch}'`)
		i = j
	}
	return c
}

// What a :not() / :is() / :where() argument tests: a place among siblings, or the element itself.
// Mixing the two in one argument can't be split between the boxes. A descendant step (`p *`,
// "inside a paragraph") reads the same through a node view, so it stays as written. When every
// alternative names something the wrapper never wears, :is() / :where() rule the wrapper out.
function readArgument(
	argument: string,
	ctx: Context,
): { testsPlace: boolean; rulesOutWrapper: boolean } {
	if (/:has\(/i.test(argument)) throw new Error(':has() inside :not(), :is() or :where()')
	const items = splitList(argument).map((item) => {
		const steps = parseSteps(item, ctx, false)
		if (steps.some((s) => s.combinator !== '' && s.combinator !== ' '))
			throw new Error('a child or sibling step inside :not(), :is() or :where()')
		if (steps.length > 1) {
			if (steps.some((s) => s.compound.place))
				throw new Error(
					'a place test in a descendant step inside :not(), :is() or :where()',
				)
			return { place: false, canBeWrapper: true }
		}
		const { type, wearer, place, canBeWrapper } = (steps[0] as Step).compound
		if (place && (type || wearer)) throw new Error('a place test mixed with other tests')
		return { place: Boolean(place), canBeWrapper }
	})
	if (items.some((k) => k.place !== items[0]?.place))
		throw new Error('a place test mixed with other tests')
	return {
		testsPlace: items[0]?.place ?? false,
		rulesOutWrapper: items.every((k) => !k.canBeWrapper),
	}
}

function isPlacement(name: string, ctx: Context): boolean {
	return ctx.placementClasses.some((p) => (p.endsWith('-') ? name.startsWith(p) : name === p))
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
