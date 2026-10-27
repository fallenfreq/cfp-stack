import {
	DOMParser,
	DOMSerializer,
	Schema,
	type DOMOutputSpec,
	type MarkSpec,
	type NodeSpec,
	type TagParseRule,
} from '@tiptap/pm/model'
import { elementFromString } from '@tiptap/vue-3'

// In the check's copy of the page's schema, each block and mark has one more setting: the element
// it was read from, which its outermost element carries when it's written.
const FROM = 'cantKeepFrom'
const FROM_ATTRIBUTE = 'data-cant-keep-from'

const short = (text: string, most = 30) =>
	text.length > most ? `${text.slice(0, most - 1)}…` : text
const quoted = (value: string) => `"${short(value).replaceAll('"', '&quot;')}"`
const label = (el: Element) => `<${el.localName}${el.id ? ` id=${quoted(el.id)}` : ''}>`
// What its rule tells an element by (`data-type="taskList"`), not one of its settings.
const kindOf = (rule: TagParseRule) =>
	new Set([...rule.tag.matchAll(/\[([\w-]+)/g)].flatMap(([, name]) => name ?? []))
// A style property's name as the browser takes it: in any case, but a custom one's (`--x`) as is.
const property = (name: string) => (name.startsWith('--') ? name : name.toLowerCase())
// The properties a style sets, as written (`text-decoration`, not its parts) and without its
// comments: each one the browser takes.
const styleProperties = (style: string) => {
	const tmp = document.createElement('div')
	tmp.style.cssText = style
	const named = style
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.split(';')
		.map((declaration) => property(declaration.split(':')[0]!.trim()))
	return [...new Set(named)].filter((name) => name && tmp.style.getPropertyValue(name))
}

const withFrom = (out: DOMOutputSpec, from: unknown): DOMOutputSpec => {
	if (typeof from !== 'number' || typeof out === 'string') return out
	if (Array.isArray(out)) {
		const [tag, second, ...rest] = out
		const attrs =
			typeof second === 'object'
			&& second !== null
			&& !Array.isArray(second)
			&& !(second instanceof Node)
				? second
				: null
		return attrs
			? [tag, { ...attrs, [FROM_ATTRIBUTE]: from }, ...rest]
			: [tag, { [FROM_ATTRIBUTE]: from }, ...out.slice(1)]
	}
	const dom = 'dom' in out ? out.dom : out
	if (dom instanceof Element) dom.setAttribute(FROM_ATTRIBUTE, String(from))
	return out
}

// Tells `seen` each attribute the page reads of these elements, the code's own, which nothing else
// holds. Styles aren't watched: a style the page keeps it writes back, and one it only looks at
// (bold's `font-weight` on `<b>`, to rule out `normal`) it doesn't keep.
const watch = (elements: Element[], seen: (el: Element, name: string) => void) => {
	for (const el of elements) {
		const getAttribute = el.getAttribute.bind(el)
		const hasAttribute = el.hasAttribute.bind(el)
		el.getAttribute = (name) => {
			seen(el, name.toLowerCase())
			return getAttribute(name)
		}
		el.hasAttribute = (name) => {
			seen(el, name.toLowerCase())
			return hasAttribute(name)
		}
	}
}

/**
 * What of this code the page can't keep, said for its author (the first thing, and how many
 * more), or null. Asked once TipTap has read the code, which refuses an element the page doesn't
 * know (`errorOnInvalidContent`) and a value a setting can't take. The code is read with the
 * page's rules, watching which attributes they read, and written back as the page writes it; each
 * element in it is compared with what was written for it. An attribute, class name or style
 * property is kept if it was written for it; an attribute also if it was read, to be written the
 * page's own way (a cell's `align`, as `text-align`), by another element (a column's width, by
 * its cells) or left out as the default it is (`colspan="1"`); a class name also if its rule reads
 * it (a colour's, written as its style). Anything else is lost, as is an
 * element nothing was written for (bold in a code block), and a comment. What the page adds or
 * rewrites itself (spaces, attribute order, `color: red;`) doesn't count.
 */
export const cantKeep = (schema: Schema, code: string): string | null => {
	const body = elementFromString(code)
	const elements = [...body.querySelectorAll('*')]
	const index = new Map(elements.map((el, i) => [el, i]))
	// The rule that took each element.
	const taken = new Map<Element, TagParseRule>()

	// Which attributes the page read of each element: of the one its rule took (`own`), or of
	// another (a cell, of its table's column list); not when a rule tries an element and passes it
	// by.
	const reads = { own: new Map<Element, Set<string>>(), other: new Map<Element, Set<string>>() }
	const noted = (map: Map<Element, Set<string>>, el: Element, read: string) => {
		const set = map.get(el)
		if (set) set.add(read)
		else map.set(el, new Set([read]))
	}
	let reading: [Element, string][] | null = null
	watch(elements, (el, read) => reading?.push([el, read]))

	const traced = (rule: TagParseRule): TagParseRule => ({
		...rule,
		getAttrs: (dom) => {
			const seen: [Element, string][] = []
			reading = seen
			let attrs
			try {
				attrs = rule.getAttrs ? rule.getAttrs(dom) : (rule.attrs ?? null)
			} finally {
				reading = null
			}
			if (attrs === false) return false
			taken.set(dom, rule)
			for (const [el, read] of seen) noted(el === dom ? reads.own : reads.other, el, read)
			return { ...attrs, [FROM]: index.get(dom) ?? null }
		},
	})
	const nodes: Record<string, NodeSpec> = {}
	schema.spec.nodes.forEach((name, spec) => {
		const { parseDOM, toDOM } = spec
		// Text has no settings.
		nodes[name] =
			name === 'text'
				? spec
				: {
						...spec,
						attrs: { ...spec.attrs, [FROM]: { default: null } },
						...(parseDOM && { parseDOM: parseDOM.map(traced) }),
						...(toDOM && { toDOM: (node) => withFrom(toDOM(node), node.attrs[FROM]) }),
					}
	})
	const marks: Record<string, MarkSpec> = {}
	schema.spec.marks.forEach((name, spec) => {
		const { parseDOM, toDOM } = spec
		marks[name] = {
			...spec,
			attrs: { ...spec.attrs, [FROM]: { default: null } },
			// A rule for a style (bold's `font-weight`) reads no element of its own.
			...(parseDOM && {
				parseDOM: parseDOM.map((rule) => (rule.tag === undefined ? rule : traced(rule))),
			}),
			...(toDOM && {
				toDOM: (mark, inline) => withFrom(toDOM(mark, inline), mark.attrs[FROM]),
			}),
		}
	})
	const check = new Schema({ topNode: schema.topNodeType.name, nodes, marks })
	const doc = DOMParser.fromSchema(check).parse(body)
	const writtenFor = new Map<number, Element[]>()
	for (const el of DOMSerializer.fromSchema(check)
		.serializeFragment(doc.content)
		.querySelectorAll(`[${FROM_ATTRIBUTE}]`)) {
		const from = Number(el.getAttribute(FROM_ATTRIBUTE))
		writtenFor.set(from, [...(writtenFor.get(from) ?? []), el])
	}
	const written = (el: Element) => writtenFor.get(index.get(el)!) ?? []
	// What the page writes at an element's place: what was written for it, or else what it writes
	// there as part of the block around it (a code block's code, a to-do item's tick box), the same
	// one of that tag (a table's second column).
	const writtenAt = (el: Element): Element[] => {
		const own = written(el)
		const around = el.parentElement
		if (own.length || !around || around === body) return own
		const alike = (parent: Element) =>
			[...parent.children].filter((child) => child.localName === el.localName)
		const nth = alike(around)
			.filter((part) => !written(part).length)
			.indexOf(el)
		return writtenAt(around).flatMap((w) =>
			alike(w)
				.filter((part) => !part.hasAttribute(FROM_ATTRIBUTE))
				.slice(nth, nth + 1),
		)
	}
	// Whether its rule reads a class name: what it makes of the element changes without it (a
	// colour's `sf-color-primary`, or its see-through step beside it). A class is read whole, so
	// each name is asked about on its own, on a copy of the element.
	const readsClass = (rule: TagParseRule, el: Element, name: string) => {
		if (!rule.getAttrs) return false
		const withIt = el.cloneNode() as HTMLElement
		const without = el.cloneNode() as HTMLElement
		without.classList.remove(name)
		return JSON.stringify(rule.getAttrs(withIt)) !== JSON.stringify(rule.getAttrs(without))
	}

	const lost = (el: Element): string[] => {
		const rule = taken.get(el)
		const kind = rule ? kindOf(rule) : new Set<string>()
		const attributes = [...el.attributes].filter(({ name }) => !kind.has(name))
		const writtenAs = writtenAt(el)
		// Its own block or mark, written: what its rule read of it, its settings keep.
		const ownRule = rule && written(el).length ? rule : null
		const read = (what: string) =>
			!!(reads.other.get(el)?.has(what) || (ownRule && reads.own.get(el)?.has(what)))
		// Nothing written for it, nor read by another element (a column's width, by its cells), nor
		// taken apart for what it holds (a table's head, a video's box).
		const readElsewhere = attributes.some(({ name }) => reads.other.get(el)?.has(name))
		if (!rule?.skip && !writtenAs.length && !readElsewhere) {
			// Spaces the page takes out at a line's start or end (a bold space) leave nothing to write.
			if (!el.children.length && el.textContent && !el.textContent.trim()) return []
			const around = el.parentElement
			return [
				short(el.outerHTML, 40)
					+ (around && around !== body ? ` inside ${label(around)}` : ''),
			]
		}
		return attributes.flatMap(({ name, value }): string[] => {
			if (name === 'class')
				return [...el.classList]
					.filter(
						(cls) =>
							!writtenAs.some((w) => w.classList.contains(cls))
							&& !(ownRule && readsClass(ownRule, el, cls)),
					)
					.map((cls) => `the class ${cls} on ${label(el)}`)
			if (name === 'style')
				return styleProperties(value)
					.filter(
						(p) =>
							!writtenAs.some(
								(w) => w instanceof HTMLElement && w.style.getPropertyValue(p),
							),
					)
					.map((p) => `${p} in the style of ${label(el)}`)
			if (writtenAs.some((w) => w.hasAttribute(name)) || read(name)) return []
			return [
				`${value ? `${name}=${quoted(value)}` : name} on ${name === 'id' ? `<${el.localName}>` : label(el)}`,
			]
		})
	}

	const problems: string[] = []
	const walker = document.createTreeWalker(
		body,
		NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
	)
	for (let at = walker.nextNode(); at; at = walker.nextNode()) {
		if (at instanceof Comment) problems.push(`comments: <!--${short(at.data)}-->`)
		else if (at instanceof Element) problems.push(...lost(at))
	}
	if (!problems.length) return null
	const more = problems.length - 1
	return `The page can't keep ${problems[0]}${more ? ` (and ${more} more)` : ''}.`
}
