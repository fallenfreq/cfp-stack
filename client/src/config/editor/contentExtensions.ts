import { enumAttr } from '@/editor/enumAttr'
import { AllowAttributesExtension } from '@/editor/extensions/allowAttributesExtension'
import { CustomTaskItem } from '@/editor/extensions/customTaskItem'
import Div from '@/editor/extensions/divExtension'
import FontStyle from '@/editor/extensions/fontStyleMark'
import Span from '@/editor/extensions/spanExtension'
import TextColor from '@/editor/extensions/textColorMark'
import type { Extensions } from '@tiptap/core'
import { mergeAttributes } from '@tiptap/core'
import Heading, { type Level } from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import { TaskList } from '@tiptap/extension-list'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import StarterKit from '@tiptap/starter-kit'
import { registerCustomNodes } from './registerCustomNodes'

interface ContentExtensionOptions {
	tableNodeSelection?: boolean
}

export function getContentExtensions({
	tableNodeSelection = false,
}: ContentExtensionOptions = {}): Extensions {
	return [
		StarterKit.configure({
			codeBlock: false,
			heading: false,
			bulletList: { HTMLAttributes: { class: 'list-disc' } },
			orderedList: { HTMLAttributes: { class: 'list-decimal' } },
			listItem: { HTMLAttributes: { class: '' } },
			blockquote: {
				HTMLAttributes: { class: 'border-l-8 border-primary sf-bg_secondary p-4' },
			},
			link: { openOnClick: 'whenNotEditable' },
		}),
		Heading.extend({
			addOptions() {
				return { ...this.parent?.(), levels: [1, 2, 3] as Level[] }
			},
			addAttributes() {
				const parent = (this.parent?.() ?? {}) as Record<string, unknown>
				return {
					...parent,
					level: {
						...(parent.level as object),
						...enumAttr(this.options.levels[0], this.options.levels),
					},
				}
			},
			renderHTML({ node, HTMLAttributes }) {
				const level = this.options.levels.includes(node.attrs.level)
					? node.attrs.level
					: this.options.levels[0]
				const classes: Record<number, string> = {
					1: 'text-4xl',
					2: 'text-2xl',
					3: 'text-xl',
				}
				return [
					`h${level}`,
					mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
						class: classes[level],
					}),
					0,
				]
			},
		}).configure({ levels: [1, 2, 3] }),
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
			HTMLAttributes: { class: 'flex items-start' },
			nested: true,
		}),
	]
}
