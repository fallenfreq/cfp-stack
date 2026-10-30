import { enumAttr } from '@/editor/enumAttr'
import { AllowAttributesExtension } from '@/editor/extensions/allowAttributesExtension'
import { CopyAndPaste } from '@/editor/extensions/copyAndPaste'
import { CustomTaskItem } from '@/editor/extensions/customTaskItem'
import Div from '@/editor/extensions/divExtension'
import FontStyle from '@/editor/extensions/fontStyleMark'
import { OwnLook } from '@/editor/extensions/ownLook'
import Span from '@/editor/extensions/spanExtension'
import TextColor from '@/editor/extensions/textColorMark'
import { Blockquote } from '@tiptap/extension-blockquote'
import Heading, { type Level } from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import { BulletList, OrderedList, TaskList } from '@tiptap/extension-list'
import { createColGroup, Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { DOMSerializer, type Node as PMNode } from '@tiptap/pm/model'
import type { NodeView } from '@tiptap/pm/view'
import StarterKit from '@tiptap/starter-kit'
import type { Extensions } from '@tiptap/vue-3'
import { CodeBlockExtension } from './codeBlockExtension'
import { registerCustomNodes } from './registerCustomNodes'
import { YoutubeExtension } from './youtubeExtension'

interface ContentExtensionOptions {
	tableNodeSelection?: boolean
}

const SF_HEADING_CLASS_RE = /^sf-heading-\d+$/

export const SfHeading = Heading.extend({
	addOptions() {
		return { HTMLAttributes: {}, levels: [1, 2, 3] as Level[] }
	},
	addAttributes() {
		return {
			level: {
				rendered: false,
				...enumAttr(this.options.levels[0], this.options.levels),
			},
		}
	},
	// Its level's `sf-heading-*`, unless it has one of its own: a heading's prominence can differ
	// from its level (sf-system.md, "Headings").
	ownLook(node) {
		const own = String(node.attrs.class ?? '').split(/\s+/)
		if (own.some((name) => SF_HEADING_CLASS_RE.test(name))) return null
		return { class: `sf-heading-${node.attrs.level}` }
	},
}).configure({ levels: [1, 2, 3] })

// A table as the page writes it, drawn with a column list from its cells' widths as TipTap draws
// one (`createColGroup`), again with each change: the widths are the cells', so the list isn't
// written. TipTap's own view (`TableView`) draws it inside a box of the editor's own (the table
// wasn't the block, and didn't fill its column), and sets the table's width over its own style.
class DrawnTable implements NodeView {
	dom: HTMLElement
	contentDOM: HTMLElement
	private node: PMNode
	private readonly cellMinWidth: number
	private columns: HTMLElement | null = null
	private drawn = ''

	constructor(node: PMNode, cellMinWidth: number) {
		const { dom, contentDOM } = DOMSerializer.renderSpec(document, node.type.spec.toDOM!(node))
		if (!contentDOM) throw new Error('The table is no longer written holding its rows')
		this.dom = dom
		this.contentDOM = contentDOM
		this.node = node
		this.cellMinWidth = cellMinWidth
		this.drawColumns()
	}

	// Its own settings changed: drawn again, as written.
	update(node: PMNode) {
		if (!node.sameMarkup(this.node)) return false
		this.node = node
		this.drawColumns()
		return true
	}

	private drawColumns() {
		const { colgroup } = createColGroup(this.node, this.cellMinWidth)
		const drawn = JSON.stringify(colgroup ?? null)
		if (drawn === this.drawn) return
		this.drawn = drawn
		this.columns?.remove()
		this.columns = colgroup ? DOMSerializer.renderSpec(document, colgroup).dom : null
		if (this.columns) this.dom.insertBefore(this.columns, this.contentDOM)
	}
}

export function getContentExtensions({
	tableNodeSelection = false,
}: ContentExtensionOptions = {}): Extensions {
	return [
		StarterKit.configure({
			blockquote: false,
			bulletList: false,
			codeBlock: false,
			heading: false,
			orderedList: false,
			link: { openOnClick: 'whenNotEditable' },
			// Inline code opts into the theme's code look (code.sf). Written with it, as code has no
			// settings for a paste to save it in.
			code: { HTMLAttributes: { class: 'sf' } },
		}),
		// A quote sits on a card surface; the theme draws the quote stripe (blockquote.sf).
		Blockquote.extend({ ownLook: () => ({ class: 'sf sf-depth-1' }) }),
		// Lists opt into the theme's markers and indent (ul.sf, ol.sf).
		BulletList.extend({ ownLook: () => ({ class: 'sf' }) }),
		OrderedList.extend({ ownLook: () => ({ class: 'sf' }) }),
		SfHeading,
		Image,
		// A pasted table's tbody and colgroup (TipTap writes both) are claimed: TipTap's content check
		// refuses unclaimed elements. Column widths come from the cells. A head or foot written in the
		// code view holds rows like any other.
		Table.extend({
			parseHTML() {
				return [
					...(this.parent?.() ?? []),
					{ tag: 'tbody', skip: true },
					{ tag: 'thead', skip: true },
					{ tag: 'tfoot', skip: true },
					{ tag: 'colgroup', ignore: true },
				]
			},
			// Written with its own style and its rows. TipTap gives a table without a style a width
			// from its columns, which a paste would save as the table's own, and a column list, a
			// second copy of its cells' widths that the page doesn't read: both are drawn instead.
			renderHTML({ node, HTMLAttributes }) {
				const spec = this.parent?.({ node, HTMLAttributes })
				if (!Array.isArray(spec) || spec[0] !== 'table')
					throw new Error("TipTap's table is no longer written as a table")
				return ['table', { ...spec[1], style: HTMLAttributes.style }, ['tbody', 0]]
			},
			ownLook(node) {
				if (node.attrs.style) return null
				const { tableWidth, tableMinWidth } = createColGroup(
					node,
					this.options.cellMinWidth,
				)
				if (tableWidth) return { style: `width: ${tableWidth}` }
				return tableMinWidth ? { style: `min-width: ${tableMinWidth}` } : null
			},
		}).configure({
			allowTableNodeSelection: tableNodeSelection,
			View: DrawnTable,
		}),
		TableCell,
		TableHeader,
		TableRow,
		Span,
		TextColor,
		FontStyle,
		Div,
		...registerCustomNodes(),
		AllowAttributesExtension,
		OwnLook,
		TaskList.configure(),
		CustomTaskItem.configure({ nested: true }),
		CodeBlockExtension,
		YoutubeExtension,
		CopyAndPaste,
	]
}
