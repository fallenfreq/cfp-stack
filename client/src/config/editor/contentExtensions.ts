import { enumAttr } from '@/editor/enumAttr'
import { AllowAttributesExtension } from '@/editor/extensions/allowAttributesExtension'
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
		// TipTap writes a tbody and a colgroup without claiming them, and its content check refuses
		// unclaimed elements. Column widths come from the cells. A head or foot written in the code
		// view holds rows like any other.
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
			// Written with its own style only. TipTap gives a table without one a width from its
			// columns as its style, which a paste would save as the table's: it's drawn instead.
			renderHTML({ node, HTMLAttributes }) {
				const spec = this.parent?.({ node, HTMLAttributes })
				if (!Array.isArray(spec) || spec[0] !== 'table')
					throw new Error("TipTap's table is no longer written as a table")
				return ['table', { ...spec[1], style: HTMLAttributes.style }, ...spec.slice(2)]
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
			// Drawn as saved. TipTap's view wraps the table in a box of the editor's own (the table
			// wasn't the block, and didn't fill its column); what else it does, keeping column widths
			// in step as columns change, cells without widths don't need.
			View: null,
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
	]
}
