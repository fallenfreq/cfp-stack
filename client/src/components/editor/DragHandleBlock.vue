<template>
	<div
		class="drag-handle-block"
		:class="[`variant-${variant}`, { 'is-dragging': isDragging }]"
		contenteditable="false"
		draggable="true"
		@mousedown="onMousedown"
		@dragstart="onDragstart"
		@dragend="onDragend"
	>
		<svg width="10" height="16" viewBox="0 0 10 16">
			<circle cx="2" cy="2" r="1.5" fill="currentColor" />
			<circle cx="2" cy="8" r="1.5" fill="currentColor" />
			<circle cx="2" cy="14" r="1.5" fill="currentColor" />
			<circle cx="8" cy="2" r="1.5" fill="currentColor" />
			<circle cx="8" cy="8" r="1.5" fill="currentColor" />
			<circle cx="8" cy="14" r="1.5" fill="currentColor" />
		</svg>
	</div>
</template>

<script setup lang="ts">
import {
	findNodeDOM,
	selectNodeForDrag,
	type DragHandleOptions,
} from '@/editor/extensions/dragHandle'
import { getExtensionOptions } from '@/utils/editor/editorUtils'
import { Fragment, Slice } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/vue-3'
import { ref } from 'vue'

const props = withDefaults(
	defineProps<{
		editor: Editor
		nodePos: number
		variant?: 'inline' | 'floating'
		selectOnMousedown?: boolean
	}>(),
	{ variant: 'inline', selectOnMousedown: true },
)

const isDragging = ref(false)

const onMousedown = (event: MouseEvent) => {
	const view = props.editor.view
	if (view.composing) return
	if (!props.selectOnMousedown) {
		// Prevent blur — the editor must stay focused for the drag to work.
		// The floating variant never changes the selection so the toolbar stays
		// on the current active node for the full drag lifecycle.
		event.preventDefault()
		return
	}
	selectNodeForDrag(view, props.nodePos)
}

const onDragstart = (event: DragEvent) => {
	const view = props.editor.view
	if (view.composing) return
	const pos = props.nodePos

	const nodeDOM = findNodeDOM(view, pos)
	if (nodeDOM && event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setDragImage(nodeDOM, 0, 0)
	}

	const opts = getExtensionOptions<DragHandleOptions>(props.editor, 'dragHandle')
	const custom = opts?.buildDragSlice?.(view, pos, event)
	if (custom) {
		view.dragging = custom
	} else {
		// Inline variant: select the node so the toolbar follows the drag.
		// Floating variant: build the slice directly without a selection
		// transaction — the toolbar stays on the current active node and the
		// floating handle element stays mounted for the full drag lifecycle.
		if (props.selectOnMousedown) {
			selectNodeForDrag(view, pos)
		}
		const node = view.state.doc.nodeAt(pos)
		if (!node) return
		view.dragging = { slice: new Slice(Fragment.from(node), 0, 0), move: !event.altKey }
	}

	isDragging.value = true
}

const onDragend = () => {
	isDragging.value = false
	// Clear drag state in case the drop landed outside the editor, where
	// ProseMirror's own dragend listener won't fire.
	// eslint-disable-next-line vue/no-mutating-props
	props.editor.view.dragging = null
}
</script>

<style scoped>
.drag-handle-block {
	width: var(--toolbar-height);
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: grab;
	color: rgba(var(--textPrimary) / 0.4);
	user-select: none;
	box-sizing: border-box;
}

.drag-handle-block:hover {
	color: rgb(var(--primary));
}

.drag-handle-block.is-dragging {
	cursor: grabbing;
	color: rgb(var(--primary));
}

.variant-inline {
	align-self: stretch;
	border-right: 1px solid rgb(var(--backgroundBorder));
}

.variant-inline:hover {
	background: rgba(var(--textPrimary) / 0.05);
}

.variant-inline.is-dragging {
	background: rgba(var(--primary) / 0.1);
}

.variant-floating {
	height: var(--toolbar-height);
	background: rgba(var(--backgroundSecondary) / 0.9);
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 4px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.variant-floating:hover {
	background: rgba(var(--backgroundSecondary) / 0.95);
	border-color: rgb(var(--primary));
}

.variant-floating.is-dragging {
	background: rgba(var(--primary) / 0.1);
	border-color: rgb(var(--primary));
}
</style>
