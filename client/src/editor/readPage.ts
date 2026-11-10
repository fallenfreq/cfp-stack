// The page as the rules read it (client/src/assets/sf-system.md, "Validator and linter", "The
// shape"): its blocks as hast elements, each tied to its block, and each block's own style as CSS.
import { readStyle } from '@somefreq-app/validator/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { Element, ElementContent, Root } from 'hast'
import { h } from 'hastscript'

/** The classes a block always wears, which the page doesn't save (`blockWears`, ownLook.ts). */
export type Wears = (node: PMNode, pos: number) => readonly string[]

/** A block's own style, as the rules that read CSS take it. */
export interface BlockStyle {
	/** The block's position on the page. */
	block: number
	css: ReturnType<typeof readStyle>
	/**
	 * It holds blocks, not text: `no-overflow-hidden` and `no-content-sized-box` run only on such
	 * a box (a plain box, a quote, a component block, a list and its items, a table, its rows and
	 * its cells).
	 */
	holdsBlocks: boolean
}

/** The page as the rules take it. */
export interface PageForRules {
	/**
	 * Its blocks as elements, each as the page writes its HTML, every setting included (the code
	 * view leaves out those at their defaults), and wearing the classes its block always wears.
	 * Text and its styles (bold, a link) aren't read.
	 */
	elements: Root
	/** Each element's block, by its position on the page, so a result lands on its block. */
	blockOf: ReadonlyMap<Element, number>
	styles: readonly BlockStyle[]
}

// An attribute list in ProseMirror's description of HTML: an object, not a child or a DOM node.
const isAttributes = (part: unknown): part is object =>
	typeof part === 'object' && part !== null && !Array.isArray(part) && !('nodeType' in part)

// Each attribute as the page writes it: named in lower case, as HTML's are, its value as text, and
// left out when there's none.
const propertiesOf = (attributes: object, wears: readonly string[]) => {
	const properties: Record<string, string> = {}
	const entries: [string, unknown][] = Object.entries(attributes)
	for (const [name, value] of entries)
		if (value != null) properties[name.toLowerCase()] = String(value)
	const classes = [...wears, ...(properties['class']?.split(/\s+/) ?? [])].filter(Boolean)
	if (classes.length) properties['class'] = [...new Set(classes)].join(' ')
	return properties
}

export function readPage(doc: PMNode, wears: Wears): PageForRules {
	const blockOf = new Map<Element, number>()
	const styles: BlockStyle[] = []

	// One part of a block's HTML as ProseMirror describes it (its `toDOM`): a tag, its attributes
	// and what's in it, the hole (0) where the block's own blocks go.
	const element = (
		part: unknown,
		pos: number,
		inHole: () => ElementContent[],
		wearing: readonly string[],
	): Element => {
		const [tag, ...rest]: unknown[] = Array.isArray(part) ? part : []
		if (typeof tag !== 'string')
			throw new Error("A block's HTML is written as DOM, not as a list the page reader reads")
		const [first, ...others] = rest
		const attributes = isAttributes(first) ? first : {}
		const inside = isAttributes(first) ? others : rest
		const built = h(
			tag,
			propertiesOf(attributes, wearing),
			inside.map((child) =>
				child === 0
					? inHole()
					: typeof child === 'string'
						? child
						: element(child, pos, inHole, []),
			),
		)
		blockOf.set(built, pos)
		return built
	}

	// The blocks in a block, each at its position: the first one past the block's own.
	const blocksIn = (parent: PMNode, start: number) => {
		const elements: Element[] = []
		parent.forEach((node, offset) => {
			if (!node.isText) elements.push(block(node, start + offset))
		})
		return elements
	}

	const block = (node: PMNode, pos: number) => {
		const toDOM = node.type.spec.toDOM
		if (!toDOM) throw new Error(`A ${node.type.name} block isn't written as HTML`)
		const built = element(toDOM(node), pos, () => blocksIn(node, pos + 1), wears(node, pos))
		const { style } = built.properties
		if (typeof style === 'string')
			styles.push({
				block: pos,
				css: readStyle(style),
				holdsBlocks: !node.isLeaf && !node.inlineContent,
			})
		return built
	}

	const elements = h(null, blocksIn(doc, 0))
	// In the page's order, as a block is read after the blocks in it.
	return { elements, blockOf, styles: styles.sort((a, b) => a.block - b.block) }
}
