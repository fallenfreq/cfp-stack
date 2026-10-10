import { enumAttr } from '@/editor/enumAttr'
import { AllowAttributesExtension } from '@/editor/extensions/allowAttributesExtension'
import { CustomTaskItem } from '@/editor/extensions/customTaskItem'
import Div from '@/editor/extensions/divExtension'
import FontStyle from '@/editor/extensions/fontStyleMark'
import Span from '@/editor/extensions/spanExtension'
import TextColor from '@/editor/extensions/textColorMark'
import Heading, { type Level } from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import { TaskList } from '@tiptap/extension-list'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Plugin } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import type { Extensions } from '@tiptap/vue-3'
import { CodeBlockExtension } from './codeBlockExtension'
import { registerCustomNodes } from './registerCustomNodes'
import { YoutubeExtension } from './youtubeExtension'

interface ContentExtensionOptions {
	tableNodeSelection?: boolean
}

// `class` is the source of truth: an appendTransaction plugin keeps any heading
// node's `class` attr containing exactly `sf-heading-{level}` (preserving other
// classes the author set). This means renderHTML can stay vanilla — no computed
// class injection — so the attribute panel, the live DOM, and code-view
// roundtrips all see the same value.
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
	addProseMirrorPlugins() {
		return [
			new Plugin({
				appendTransaction: (_transactions, _oldState, newState) => {
					let tr = newState.tr
					let changed = false
					newState.doc.descendants((node, pos) => {
						const isHeading = node.type.name === 'heading'
						const classAttr = node.attrs.class
						if (typeof classAttr !== 'string' && !isHeading) return
						const currentClass = typeof classAttr === 'string' ? classAttr : ''
						const otherClasses = currentClass
							.split(/\s+/)
							.filter((c) => c && !SF_HEADING_CLASS_RE.test(c))
						const expected = isHeading
							? [...otherClasses, `sf-heading-${node.attrs.level}`]
							: otherClasses
						const newClass = expected.join(' ')
						if (newClass !== currentClass) {
							tr = tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								class: newClass,
							})
							changed = true
						}
					})
					return changed ? tr : null
				},
			}),
		]
	},
}).configure({ levels: [1, 2, 3] })

// A cell's width is its own `colwidth`, as TipTap writes it. TipTap also reads the table's
// `<col width>`, which tables from elsewhere carry: kept, those tables didn't fit their column.
const cellWidth = {
	default: null,
	parseHTML: (cell: HTMLElement) =>
		cell
			.getAttribute('colwidth')
			?.split(',')
			.map((width) => parseInt(width, 10)) ?? null,
}

export function getContentExtensions({
	tableNodeSelection = false,
}: ContentExtensionOptions = {}): Extensions {
	return [
		StarterKit.configure({
			codeBlock: false,
			heading: false,
			// A quote sits on a card surface; the theme draws the quote stripe (blockquote.sf).
			blockquote: { HTMLAttributes: { class: 'sf sf-depth-1' } },
			link: { openOnClick: 'whenNotEditable' },
			// Inline code opts into the theme's code look (code.sf).
			code: { HTMLAttributes: { class: 'sf' } },
			// Lists opt into the theme's markers and indent (ul.sf, ol.sf).
			bulletList: { HTMLAttributes: { class: 'sf' } },
			orderedList: { HTMLAttributes: { class: 'sf' } },
		}),
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
		}).configure({
			allowTableNodeSelection: tableNodeSelection,
			HTMLAttributes: { class: 'tiptap-table' },
			// Drawn as saved. TipTap's view wraps the table in a box of the editor's own (the table
			// wasn't the block, and didn't fill its column); what else it does, keeping column widths
			// in step as columns change, cells without widths don't need.
			View: null,
		}),
		TableCell.extend({
			addAttributes() {
				return { ...this.parent?.(), colwidth: cellWidth }
			},
		}),
		TableHeader.extend({
			addAttributes() {
				return { ...this.parent?.(), colwidth: cellWidth }
			},
		}),
		TableRow,
		Span,
		TextColor,
		FontStyle,
		Div,
		...registerCustomNodes(),
		AllowAttributesExtension,
		TaskList.configure(),
		CustomTaskItem.configure({
			// Checkbox beside the item's content: fixed side + flexible side.
			HTMLAttributes: { class: 'sl-split sf-gap-md' },
			nested: true,
		}),
		CodeBlockExtension,
		YoutubeExtension,
	]
}
