<template>
	<div v-if="!editor" class="p-7">Loading editor...</div>
	<div v-else>
		<FloatingEditorMenu :editor="editor" />
		<EditorContent class="p-7" :editor="editor" />
	</div>
</template>

<script setup lang="ts">
import { useNodeViewInteractions } from '@/composables/editor/useNodeViewInteractions'
import initialContent from '@/config/editor/initialContent.html?raw'
import { registerCustomNodes } from '@/config/editor/registerCustomNodes'
import { AllowAttributesExtension } from '@/editor/extensions/allowAttributesExtension'
import {
	EditorContent,
	VueNodeViewRenderer,
	mergeAttributes,
	useEditor,
	type NodeViewProps,
} from '@tiptap/vue-3'

import Div from '@/editor/extensions/divExtension'
import Span from '@/editor/extensions/spanExtension'
import { DragHandle } from '@tiptap/extension-drag-handle'
import Heading from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import Youtube from '@tiptap/extension-youtube'
import StarterKit from '@tiptap/starter-kit'

import { TaskItem, TaskList } from '@tiptap/extension-list'

import Commands from '@/editor/extensions/commands/commands.js'
import suggestion from '@/editor/extensions/commands/suggestion.js'

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TiptapCodeBlock from './TiptapCodeBlock.vue'

import { watch, type Component } from 'vue'
import FloatingEditorMenu from './FloatingEditorMenu.vue'

import { lowlight } from '@/config/editor/lowlight'
import { useEditorStore } from '@/stores/editorStore.js'

import { useSyntaxHighlighting } from '@/composables/editor/syntaxHighlighting'
useSyntaxHighlighting()

const editor = useEditor({
	extensions: [
		// by default, you can style just using the class 'drag-handle'
		DragHandle,
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
					levels: [1, 2, 3] as number[],
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
		Table.configure({ allowTableNodeSelection: true, HTMLAttributes: { class: 'tiptap-table' } }),
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
		TaskItem.configure({
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
	}
})
</script>

<style>
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
	color: rgba(var(--textPrimary) / 0.5);
	content: attr(data-placeholder);
	float: left;
	height: 0;
	pointer-events: none;
}

.drag-handle {
	display: flex;
	align-items: center;
	justify-content: center;
	/* width: 1.75rem;
	height: 1.75rem; */
	cursor: grab;
	border-radius: 0.375rem;
	background-color: rgba(var(--textPrimary) / 0.05);
	color: rgba(var(--primary) / 1);
	font-size: 1.5rem;
	font-weight: 700;
	transition:
		background-color 0.2s ease,
		opacity 0.2s ease;

	&::after {
		content: '⠿';
		pointer-events: none;
	}

	&:hover {
		background-color: rgba(var(--textPrimary) / 0.1);
	}

	&:active {
		background-color: rgba(var(--textPrimary) / 0.15);
		cursor: grabbing;
	}
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

/* Basic editor styles */
.tiptap:focus {
	outline: none;
}

.tiptap p:not(:last-child),
.tiptap h1:not(:last-child),
.tiptap h2:not(:last-child),
.tiptap pre:not(:last-child),
.tiptap table:not(:last-child),
.tiptap img:not(:last-child),
.tiptap ol:not(:last-child),
.tiptap ul:not(:last-child),
.tiptap blockquote:not(:last-child),
.tiptap hr:not(:last-child),
.tiptap .code-block:not(:last-child),
.tiptap [data-node-view-wrapper]:not(:last-child),
.tiptap [data-container]:not(:last-child),
.tiptap [data-youtube-video]:not(:last-child) {
	margin-bottom: 1rem;
}

.tiptap ol,
.tiptap ul {
	list-style-position: inside;
}

.tiptap li {
	margin-bottom: 0.5rem;
}

/* tiptap automatically adds p tags inside each li */
.tiptap li > p {
	display: inline-block;
}
.tiptap ul[data-type='taskList'] li label {
	margin-right: 1em; /* Add space between checkbox and div */
}

.tiptap [data-youtube-video] > [data-youtube-video] {
	margin-bottom: 0;
}
</style>
