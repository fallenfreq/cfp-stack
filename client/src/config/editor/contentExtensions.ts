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
import type { Extensions, NodeViewRenderer } from '@tiptap/vue-3'
import { CodeBlockExtension } from './codeBlockExtension'
import { registerCustomNodes } from './registerCustomNodes'
import { YoutubeExtension } from './youtubeExtension'

interface ContentExtensionOptions {
	tableNodeSelection?: boolean
	codeBlockNodeView?: () => NodeViewRenderer
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

export function getContentExtensions({
	tableNodeSelection = false,
	codeBlockNodeView,
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
		Table.configure({
			allowTableNodeSelection: tableNodeSelection,
			HTMLAttributes: { class: 'tiptap-table' },
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
		TaskList.configure(),
		CustomTaskItem.configure({
			// Checkbox beside the item's content: fixed side + flexible side.
			HTMLAttributes: { class: 'sl-split sf-gap-md' },
			nested: true,
		}),
		codeBlockNodeView
			? CodeBlockExtension.extend({ addNodeView: codeBlockNodeView })
			: CodeBlockExtension,
		YoutubeExtension,
	]
}
