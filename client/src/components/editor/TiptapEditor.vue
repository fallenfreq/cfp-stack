<template>
	<div v-if="!editor" class="p-7">Loading editor...</div>
	<div v-else>
		<EditorTopBar :editor="editor" />
		<FloatingToolbar :editor="editor" />
		<ToolbarScrollHint :editor="editor" />
		<FloatingDragHandle :editor="editor" />
		<CodeViewToggle />
		<EditorContent :editor="editor" />
	</div>
</template>

<script setup lang="ts">
import { useSyntaxHighlighting } from '@/composables/editor/syntaxHighlighting'
import { useNodeViewInteractions } from '@/composables/editor/useNodeViewInteractions'
import { getContentExtensions } from '@/config/editor/contentExtensions'
import Commands from '@/editor/extensions/commands/commands.js'
import suggestion from '@/editor/extensions/commands/suggestion.js'
import { DragHandle } from '@/editor/extensions/dragHandle'
import { FloatingToolbarExtension, type ToolbarItem } from '@/editor/extensions/floatingToolbar'
import { defaultToolbarItems } from '@/editor/extensions/floatingToolbar/defaultItems'
import {
	buildMultiDragSlice,
	MultiSelectExtension,
	multiSelectPluginKey,
} from '@/editor/extensions/multiSelect'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { useEditorStore } from '@/stores/editorStore.js'
import { useMultiSelectStore } from '@/stores/multiSelectStore'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3'
import { watch, type Component } from 'vue'
import CodeViewToggle from './CodeViewToggle.vue'
import EditorTopBar from './EditorTopBar.vue'
import FloatingDragHandle from './FloatingDragHandle.vue'
import FloatingToolbar from './FloatingToolbar.vue'
import TiptapCodeBlock from './TiptapCodeBlock.vue'
import ToolbarScrollHint from './ToolbarScrollHint.vue'

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
		...getContentExtensions({
			tableNodeSelection: true,
			codeBlockNodeView: () =>
				VueNodeViewRenderer(TiptapCodeBlock as Component<NodeViewProps>),
		}),
		Placeholder.configure({
			includeChildren: true,
			showOnlyCurrent: false,
			placeholder: ({ node }) => {
				if (node.type.name === 'heading') return "What's the title?"
				return 'Type slash for commands'
			},
		}),
		// Renamed to avoid: Duplicate extension names found: ['commands']
		Commands.extend({ name: 'slashCommands' }).configure({ suggestion }),
	],
	content: '',
	autofocus: true,
	parseOptions: {
		// preserveWhitespace: 'full'
	},
})

useNodeViewInteractions()
const editorStore = useEditorStore()
// editor.value should be undefined at this point until the next tick
watch(editor, (newEditor) => {
	if (newEditor) {
		editorStore.setEditor(newEditor)
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
