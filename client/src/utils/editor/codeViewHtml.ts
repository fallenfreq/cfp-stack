import { kindOf } from '@/utils/editor/cantKeep'
import {
	DOMSerializer,
	type Attrs,
	type DOMOutputSpec,
	type Mark,
	type MarkType,
	type NodeType,
	type ParseRule,
	type Node as ProseMirrorNode,
} from '@tiptap/pm/model'

/**
 * The page as code for the code view, written as the page writes it (as a copy is), so it reads
 * back as the same page. Each block and mark leaves out the attributes that one of its kind with
 * nothing set writes the same (a link's `target`, a Stack's `align="stretch"`): read back without
 * them, it has its defaults. What tells its kind (`data-type="taskList"`) stays.
 */
// Whether a spec is one of a block's settings, which the page's serializer refuses to write as
// HTML: an array in its settings could be someone's code.
const inSettings = (value: unknown, spec: DOMOutputSpec): boolean =>
	value === spec
	|| (typeof value === 'object'
		&& value !== null
		&& Object.values(value).some((inner) => inSettings(inner, spec)))

export const codeViewHtml = (doc: ProseMirrorNode): string => {
	const { schema } = doc.type
	const page = DOMSerializer.fromSchema(schema)
	// A document of its own, in which nothing written loads (a picture).
	const own = document.implementation.createHTMLDocument()
	// What one of each kind with nothing set writes, and the attributes that tell its kind.
	const plain = new Map<NodeType | MarkType, { written: Element | null; kind: Set<string> }>()
	const shortened = (
		type: NodeType | MarkType,
		attrs: Attrs,
		out: DOMOutputSpec,
		nothingSet: () => DOMOutputSpec,
	): DOMOutputSpec => {
		if (typeof out === 'string' || inSettings(attrs, out)) return out
		let bare = plain.get(type)
		if (!bare) {
			const { dom } = DOMSerializer.renderSpec(own, nothingSet())
			const rules: readonly ParseRule[] = type.spec.parseDOM ?? []
			bare = {
				written: dom instanceof Element ? dom : null,
				kind: new Set(
					rules.flatMap((rule) => (rule.tag === undefined ? [] : [...kindOf(rule)])),
				),
			}
			plain.set(type, bare)
		}
		const { written, kind } = bare
		const same = (name: string, value: unknown) =>
			!kind.has(name) && value != null && written?.getAttribute(name) === String(value)
		// Left a spec, which the page's serializer renders with its own checks.
		if (Array.isArray(out)) {
			const [tag, attributes, ...rest] = out
			if (
				typeof attributes !== 'object'
				|| attributes === null
				|| Array.isArray(attributes)
				|| attributes instanceof Node
			)
				return out
			return [
				tag,
				Object.fromEntries(
					Object.entries(attributes).filter(([name, value]) => !same(name, value)),
				),
				...rest,
			]
		}
		const dom = 'dom' in out ? out.dom : out
		if (dom instanceof Element)
			for (const { name, value } of [...dom.attributes])
				if (same(name, value)) dom.removeAttribute(name)
		return out
	}
	const nodes = Object.fromEntries(
		Object.entries(page.nodes).map(([name, toDOM]) => {
			const type = schema.nodes[name]!
			return [
				name,
				(node: ProseMirrorNode) =>
					shortened(type, node.attrs, toDOM(node), () =>
						toDOM(type.createAndFill() ?? type.create()),
					),
			]
		}),
	)
	const marks = Object.fromEntries(
		Object.entries(page.marks).map(([name, toDOM]) => {
			const type = schema.marks[name]!
			return [
				name,
				(mark: Mark, inline: boolean) =>
					shortened(type, mark.attrs, toDOM(mark, inline), () =>
						toDOM(type.create(), inline),
					),
			]
		}),
	)
	const code = own.createElement('div')
	code.appendChild(
		new DOMSerializer(nodes, marks).serializeFragment(doc.content, { document: own }),
	)
	return code.innerHTML
}
