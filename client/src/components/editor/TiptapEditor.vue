<template>
	<SfStatusDisplay v-if="invalid" state="error" message="This page can't be opened." />
	<SfStatusDisplay v-else-if="!editor" state="loading" message="Loading editor…" />
	<div v-else>
		<EditorTopBar :editor="editor" />
		<!-- The code view shows instead of the page, which stays underneath with its undo. -->
		<template v-if="!editorStore.isCodeView">
			<FloatingToolbar :editor="editor" />
			<ToolbarScrollHint :editor="editor" />
			<FloatingDragHandle :editor="editor" />
		</template>
		<CodeViewToggle />
		<!-- The document sits in the page shell, as a stored page does; the bars are the editor's.
		     page-content: in an inset, its blocks become the inset's items (slLayout.ts). -->
		<SfPageShell>
			<EditorContent v-show="!editorStore.isCodeView" class="page-content" :editor="editor" />
			<CodeView v-if="editorStore.isCodeView" />
		</SfPageShell>
	</div>
</template>

<script setup lang="ts">
import { useEditor } from '@/composables/editor/useEditor'
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
import { EditorContent, type Content } from '@tiptap/vue-3'
import { onBeforeUnmount, ref, watch } from 'vue'
import CodeView from './CodeView.vue'
import CodeViewToggle from './CodeViewToggle.vue'
import EditorTopBar from './EditorTopBar.vue'
import FloatingDragHandle from './FloatingDragHandle.vue'
import FloatingToolbar from './FloatingToolbar.vue'
import ToolbarScrollHint from './ToolbarScrollHint.vue'

// What the editor opens: a stored page, our own HTML (the demo, the layout test cases), or nothing
// (a new page). Read once: each page opens in a new editor.
const props = defineProps<{ content: Content }>()
const invalid = ref(false)

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
		...getContentExtensions({ tableNodeSelection: true }),
		Placeholder.configure({
			includeChildren: true,
			showOnlyCurrent: false,
			placeholder: ({ node }) => {
				if (node.type.name === 'heading') return "What's the title?"
				return 'Type slash for commands'
			},
		}),
		// TipTap has a core extension called commands, and two extensions can't share a name.
		Commands.extend({ name: 'slashCommands' }).configure({ suggestion }),
	],
	content: '',
	autofocus: true,
	parseOptions: {},
})

useNodeViewInteractions()
const editorStore = useEditorStore()
// Opening isn't an edit: the content goes in outside the undo history, so Undo can't empty the
// page. Invalid content isn't opened: TipTap would drop what it can't read. Not useEditor's
// `content`: what plugins add on the first change would become the first undo.
watch(editor, (newEditor) => {
	if (!newEditor) return
	try {
		newEditor
			.chain()
			.setMeta('addToHistory', false)
			.setContent(props.content, { errorOnInvalidContent: true, emitUpdate: false })
			.run()
	} catch (error) {
		console.error("This page can't be opened:", error)
		invalid.value = true
		return
	}
	editorStore.setEditor(newEditor)
	newEditor.on('transaction', () => {
		const state = multiSelectPluginKey.getState(newEditor.state)
		multiSelectStore.sync(state?.positions ?? [])
	})
})
// The store points at the editor on screen. Leaving the page closes it, so clear it too: the
// next editor starts with no page (Save can't write over this one), and a save still on its way
// for this one leaves the next alone (`save`).
onBeforeUnmount(() => {
	if (editorStore.editor === editor.value) editorStore.setEditor(null)
})
</script>

<style>
/* Editor-UI only — styles that apply to the editing experience, not rendered content.
   Content looks come from the theme (elements wearing sf); how the document's blocks sit
   (spacing, node views, a video's default box) is fixed CSS served with the theme
   (api/src/domain/css/blockSpacing.ts, nodeViews.ts, embeds.ts). */

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

/* TipTap placeholder — mirrors sf-field::placeholder's muted tint. Kept as a scoped
   bridge because TipTap's Placeholder extension emits the .is-empty class internally
   and we don't add .sf-field to editor node children. */
.tiptap p.is-empty::before {
	color: rgba(var(--sf-fg_primary) / var(--sf-alpha-5));
	content: attr(data-placeholder);
	float: left;
	height: 0;
	pointer-events: none;
}

/* ProseMirror / drag-handle selection states — mirrors sf-on-selected's bare rule
   (block/card-scale outline). Kept as a scoped bridge because ProseMirror applies
   this class internally on NodeSelection; we can't rename it without a TipTap plugin. */
.ProseMirror-selectednode {
	outline: var(--sf-stroke-3) solid rgba(var(--sf-primary) / var(--sf-alpha-2));
}

.tiptap:focus {
	outline: none;
}
</style>
