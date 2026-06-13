<template>
	<div v-if="!editor" class="p-7">Loading editor...</div>
	<div v-else>
		<NodePath :editor="editor" />
		<FloatingToolbar :editor="editor" />
		<ToolbarScrollHint :editor="editor" />
		<FloatingDragHandle :editor="editor" />
		<CodeViewToggle />
		<EditorContent :editor="editor" />
	</div>
</template>

<script setup lang="ts">
import { useNodeViewInteractions } from '@/composables/editor/useNodeViewInteractions'
import initialContent from '@/config/editor/initialContent.html?raw'
import { registerCustomNodes } from '@/config/editor/registerCustomNodes'
import { AllowAttributesExtension } from '@/editor/extensions/allowAttributesExtension'
import { FloatingToolbarExtension, type ToolbarItem } from '@/editor/extensions/floatingToolbar'
import { defaultToolbarItems } from '@/editor/extensions/floatingToolbar/defaultItems'
import {
	EditorContent,
	mergeAttributes,
	useEditor,
	VueNodeViewRenderer,
	type NodeViewProps,
} from '@tiptap/vue-3'

import { enumAttr } from '@/editor/enumAttr'
import Div from '@/editor/extensions/divExtension'
import { DragHandle } from '@/editor/extensions/dragHandle'
import FontStyle from '@/editor/extensions/fontStyleMark'
import Span from '@/editor/extensions/spanExtension'
import TextColor from '@/editor/extensions/textColorMark'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import Heading, { type Level } from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import Youtube from '@tiptap/extension-youtube'
import StarterKit from '@tiptap/starter-kit'
import CodeViewToggle from './CodeViewToggle.vue'
import FloatingDragHandle from './FloatingDragHandle.vue'
import FloatingToolbar from './FloatingToolbar.vue'
import NodePath from './NodePath.vue'
import ToolbarScrollHint from './ToolbarScrollHint.vue'

import { CustomTaskItem } from '@/editor/extensions/customTaskItem'
import { TaskList } from '@tiptap/extension-list'

import Commands from '@/editor/extensions/commands/commands.js'
import suggestion from '@/editor/extensions/commands/suggestion.js'

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TiptapCodeBlock from './TiptapCodeBlock.vue'

import { watch, type Component } from 'vue'

import { lowlight } from '@/config/editor/lowlight'
import {
	buildMultiDragSlice,
	MultiSelectExtension,
	multiSelectPluginKey,
} from '@/editor/extensions/multiSelect'
import { useEditorStore } from '@/stores/editorStore.js'
import { useMultiSelectStore } from '@/stores/multiSelectStore'

import { useSyntaxHighlighting } from '@/composables/editor/syntaxHighlighting'
useSyntaxHighlighting()

const toolbarItems: ToolbarItem[] = defaultToolbarItems
const dragHandleStore = useDragHandleStore()
const multiSelectStore = useMultiSelectStore()

const editor = useEditor({
	extensions: [
		MultiSelectExtension,
		FloatingToolbarExtension.configure({ items: toolbarItems }),
		DragHandle.configure({
			shouldShowHandle: (node, depth) =>
				depth <= dragHandleStore.activeDepth
				&& !!(node.isBlock || node.isAtom || node.type.spec.draggable),
			buildDragSlice: buildMultiDragSlice,
			setHoverPos: (pos) => dragHandleStore.setHoverNodePos(pos),
			onHoverLost: () => dragHandleStore.unlockFade(),
			onDrop: (depth) => dragHandleStore.setActiveDepth(depth),
			onSingleDropConsumed: () => {
				dragHandleStore.setIsDragging(false)
				dragHandleStore.setFrozenTargetPos(null)
			},
		}),
		CodeBlockLowlight.extend({
			addNodeView() {
				return VueNodeViewRenderer(TiptapCodeBlock as Component<NodeViewProps>)
			},
		}).configure({ lowlight }),
		StarterKit.configure({
			codeBlock: false,
			heading: false,
			bulletList: {
				HTMLAttributes: {
					class: 'list-disc',
				},
			},
			orderedList: {
				HTMLAttributes: {
					class: 'list-decimal',
				},
			},
			listItem: {
				HTMLAttributes: {
					class: '',
				},
			},
			blockquote: {
				HTMLAttributes: {
					class: 'border-l-8 border-primary sf-bg_secondary p-4',
				},
			},
			link: {
				openOnClick: 'whenNotEditable',
			},
		}),
		Youtube.extend({
			renderHTML({ node, HTMLAttributes }) {
				const { resp } = node.attrs
				const maxWidthStyle = resp ? `max-width: ${resp};` : null
				// `this` is the function we are in > node.type.spec.toDOM?.(node).
				// Use this.parent?.({ node, HTMLAttributes }) to get the original DomOutputSpec
				const domOutputSpec = this.parent?.({ node, HTMLAttributes })
				if (!domOutputSpec) throw new Error('No parent DomOutputSpec found')
				return resp === '' || resp
					? ['div', { class: 'max-w-xl', style: maxWidthStyle }, domOutputSpec]
					: domOutputSpec
			},
			addAttributes() {
				const existingAttributes = this.parent?.() || {}
				return {
					...existingAttributes,
					resp: {
						default: '',
						renderHTML: (attributes) => {
							return attributes.resp === '' || attributes.resp
								? {
										width: 'auto',
										height: 'auto',
										class: (attributes.class || '' + ' resp-yt').trim(),
									}
								: {}
						},
					},
				}
			},
		}),
		Heading.extend({
			addOptions() {
				return {
					...this.parent?.(),
					levels: [1, 2, 3] as Level[],
				}
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
			allowTableNodeSelection: true,
			HTMLAttributes: { class: 'tiptap-table' },
		}),
		TableCell,
		TableHeader,
		TableRow,
		Span,
		TextColor,
		FontStyle,
		Div,
		Placeholder.configure({
			includeChildren: true,
			showOnlyCurrent: false,
			placeholder: ({ node }) => {
				if (node.type.name === 'heading') {
					console.log(node.type.name)
					return 'What’s the title?'
				}
				return 'Type slash for commands'
			},
		}),
		...registerCustomNodes(),
		AllowAttributesExtension,
		TaskList.configure(),
		CustomTaskItem.configure({
			HTMLAttributes: {
				class: 'flex items-start',
			},
			nested: true,
		}),
		// If the extension is not renamed, it will log the following warning:
		// Duplicate extension names found: ['commands']. This can lead to issues.
		Commands.extend({ name: 'slashCommands' }).configure({ suggestion }),
	],
	content: initialContent,
	autofocus: true,
	parseOptions: {
		// preserveWhitespace: 'full'
	},
})

useNodeViewInteractions()
// editor.value should be undefined at this point until the next tick
watch(editor, (newEditor) => {
	if (newEditor) {
		useEditorStore().setEditor(newEditor)
		newEditor.on('transaction', () => {
			const state = multiSelectPluginKey.getState(newEditor.state)
			multiSelectStore.sync(state?.positions ?? [])
		})
	}
})
</script>

<style>
/* Editor-UI only — styles that apply to the editing experience, not rendered content.
   Content styles (typography, spacing, radius, embeds) live in main.css under .tiptap. */

.tiptap {
	position: relative;
}

.tiptap div[data-container],
.tiptap img[draggable='true'] {
	cursor: grab;
	&:active {
		cursor: grabbing;
	}
}

.tiptap div[data-container] > * {
	cursor: default;
}

.tiptap p.is-empty::before {
	color: rgba(var(--text_primary) / var(--alpha-50));
	content: attr(data-placeholder);
	float: left;
	height: 0;
	pointer-events: none;
}

/* ProseMirror / drag-handle selection states */
.ProseMirror-selectednode {
	outline: 3px solid rgba(var(--primary) / var(--alpha-20));
}

.node-selected {
	outline: 2px solid rgb(var(--primary));
	outline-offset: 1px;
	border-radius: 2px;
}

.tiptap:focus {
	outline: none;
}
</style>
