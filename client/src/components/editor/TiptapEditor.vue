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
import Span from '@/editor/extensions/spanExtension'
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
					class: 'border-l-8 border-primary bg-backgroundSecondary p-4',
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

.material-symbols-rounded.icon-inline {
	font-size: 1.1em;
	vertical-align: -0.2em;
	opacity: 0.85;
}

.tiptap p.is-empty::before {
	color: rgba(var(--textPrimary) / 0.5);
	content: attr(data-placeholder);
	float: left;
	height: 0;
	pointer-events: none;
}

/* tiptap table style */
.tiptap-table {
	border-collapse: collapse;
	width: 100%;
	text-align: left;
}

.tiptap-table th,
.tiptap-table td {
	padding: 8px;
	border: 1px solid;
}

.tiptap-table p {
	margin: 0;
}

/* Styling for drop position */
.ProseMirror-selectednode {
	outline: 3px solid rgba(var(--primary) / 0.2);
}

.node-selected {
	outline: 2px solid rgb(var(--primary));
	outline-offset: 1px;
	border-radius: 2px;
}

/* Youtube video styling in the editor */
.tiptap [data-youtube-video]:has(> iframe.resp-yt) {
	position: relative;
	padding-bottom: 56.25%; /* 16:9 */
	height: 0;
	overflow: hidden;
}

.tiptap [data-youtube-video] > iframe.resp-yt {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	max-width: 100%;
}

/* Image radius — data-radius is set by the global `radius` attribute and
   maps to the same RADIUS token sizes used by LayoutCard. Default 'none'
   renders no attribute. */
.tiptap img[data-radius='sm'] {
	border-radius: 4px;
}
.tiptap img[data-radius='md'] {
	border-radius: 8px;
}
.tiptap img[data-radius='lg'] {
	border-radius: 16px;
}

/* Basic editor styles */
.tiptap:focus {
	outline: none;
}

.tiptap a {
	color: rgb(var(--primary));
	text-decoration: underline;
}

.tiptap :is(p, h1, h2, h3, pre, table, img, ol, ul, blockquote, hr, .code-block):not(:last-child),
.tiptap > [data-node-view-wrapper]:not(:last-child),
.tiptap > [data-container]:not(:last-child),
.tiptap > [data-youtube-video]:not(:last-child) {
	margin-bottom: 1rem;
}

.tiptap ul:not([data-type='taskList']),
.tiptap ol {
	padding-left: 1.5em; /* em scales with font size so markers stay proportional */
}

.tiptap li {
	margin-bottom: 0.5rem;
}
.tiptap ul[data-type='taskList'] li label {
	margin-right: 1em; /* Add space between checkbox and div */
}

.tiptap [data-youtube-video] > [data-youtube-video] {
	margin-bottom: 0;
}
</style>
