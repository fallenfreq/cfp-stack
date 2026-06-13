<template>
	<div
		v-if="targetPos !== null && pixelPos"
		class="floating-drag-handle-wrapper"
		:class="{
			'is-fading': store.isFading,
			'is-dragging': isDragging,
			'is-over-toolbar': isOverToolbar,
		}"
		contenteditable="false"
		draggable="true"
		:style="{ top: `${pixelPos.top}px`, left: `${pixelPos.left}px` }"
		@mousedown="onMousedown"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@mouseenter="store.lockFade"
		@mouseleave="store.unlockFade"
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
import { useToolbarRect } from '@/composables/editor/useToolbarRect'
import {
	clearPendingDrag,
	findNodeDOM,
	setPendingDrag,
	type DragHandleOptions,
} from '@/editor/extensions/dragHandle'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { getExtensionOptions } from '@/utils/editor/editorUtils'
import { Fragment, Slice } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'

const props = defineProps<{ editor: Editor }>()
const store = useDragHandleStore()
const toolbarRect = useToolbarRect(props.editor)

const HANDLE_GAP = 10

const targetPos = computed(() => store.currentTargetPos)
const isDragging = computed(() => store.isDragging)
// True when the handle should sit over the toolbar's reserved left slot.
// During a drag the result is locked: derived from frozenTargetPos so a stray
// mousemove (which can change hoverNodePos) can't make the handle visually
// jump from "in toolbar slot" to "floating above source node".
const isOverToolbar = computed(() => {
	if (isDragging.value) {
		return store.frozenTargetPos === store.selectionNodePos
	}
	return store.hoverNodePos === null || store.hoverNodePos === store.selectionNodePos
})

// Reading toolbarRect at the top registers the dep so this computed re-evaluates
// whenever the composable updates (on transaction/scroll/resize, plus the toolbar's
// own MutationObserver-tracked second-pass settle).  The not-over-toolbar branch
// then re-reads the nodeDOM rect on those same events without its own listeners.
const pixelPos = computed<{ top: number; left: number } | null>(() => {
	const pos = targetPos.value
	if (pos === null) return null
	const toolbar = toolbarRect.value

	if (isOverToolbar.value) {
		if (!toolbar || (toolbar.width === 0 && toolbar.height === 0)) return null
		return { top: toolbar.top, left: toolbar.left }
	}

	const dom = props.editor.view.nodeDOM(pos) as HTMLElement | null
	if (!dom) return null
	const rect = dom.getBoundingClientRect()
	if (rect.width === 0 && rect.height === 0) return null
	return { top: rect.top - HANDLE_GAP, left: rect.left }
})

const onMousedown = () => {
	const view = props.editor.view
	if (view.composing) return
	// Keep the editor focused without calling event.preventDefault() — that
	// would block dragstart from firing.  view.focus() is a no-op when already focused.
	view.focus()
}

const onDragstart = (event: DragEvent) => {
	const view = props.editor.view
	if (view.composing) return
	const pos = targetPos.value
	if (pos === null) return

	const node = view.state.doc.nodeAt(pos)
	if (!node) return

	const nodeDOM = findNodeDOM(view, pos)
	if (nodeDOM && event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setDragImage(nodeDOM, 0, 0)
	}

	// Lock the target so hover changes during the drag don't move the handle.
	// PM selection is intentionally NOT mutated — toolbar items stay stable.
	store.setFrozenTargetPos(pos)
	store.setIsDragging(true)

	// Multi-drag takes precedence when the drag target is part of an active
	// multi-selection.  buildMultiDragSlice caches positions in its plugin and
	// returns a custom slice; its handleDrop (registered before single-drag's)
	// will fire on drop.  We deliberately don't call setPendingDrag in that
	// case so the single-drag branch in dragHandle.ts's handleDrop never fires.
	const opts = getExtensionOptions<DragHandleOptions>(props.editor, 'dragHandle')
	const custom = opts?.buildDragSlice?.(view, pos, event)
	if (custom) {
		view.dragging = custom
	} else {
		setPendingDrag(pos)
		view.dragging = {
			slice: new Slice(Fragment.from(node), 0, 0),
			move: !event.altKey,
		}
	}
}

const onDragend = () => {
	store.setIsDragging(false)
	store.setFrozenTargetPos(null)
	clearPendingDrag()
	// Clear drag state in case the drop landed outside the editor, where
	// ProseMirror's own dragend listener won't fire.
	// eslint-disable-next-line vue/no-mutating-props
	props.editor.view.dragging = null
	// Browser DnD causes the editor to lose focus during the drag.  Without this,
	// the mousemove guard (!view.hasFocus()) blocks hover updates until the user
	// clicks, making the handle appear broken after every drop.
	props.editor.view.focus()
}
</script>

<style scoped>
.floating-drag-handle-wrapper {
	position: fixed;
	z-index: var(--z-toolbar);
	width: var(--toolbar-height);
	height: var(--toolbar-height);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: grab;
	color: rgba(var(--text_primary) / var(--alpha-40));
	user-select: none;
	box-sizing: border-box;
	transform: translateY(-100%);
	background: rgba(var(--bg_secondary) / var(--alpha-90));
	border: 1px solid rgb(var(--border_color));
	border-radius: 4px;
	box-shadow: 0 2px 5px rgb(0 0 0 / var(--alpha-20));
	opacity: 1;
	transition: opacity 1s ease 1s;
}

.floating-drag-handle-wrapper:hover {
	background: rgba(var(--bg_secondary) / var(--alpha-90));
	border-color: rgb(var(--primary));
	color: rgb(var(--primary));
}

.floating-drag-handle-wrapper.is-dragging {
	cursor: grabbing;
	color: rgb(var(--primary));
	background: rgba(var(--primary) / var(--alpha-10));
	border-color: rgb(var(--primary));
}

.floating-drag-handle-wrapper.is-fading {
	opacity: 0;
}

/* Over-toolbar variant: handle sits flush against the toolbar's left slot,
   no translate, no shadow/border (the toolbar provides those), transparent
   background.  A right border keeps the visual separation from the toolbar
   items, matching the old inline variant. */
.floating-drag-handle-wrapper.is-over-toolbar {
	transform: none;
	background: transparent;
	border: none;
	border-right: 1px solid rgb(var(--border_color));
	border-radius: 0;
	box-shadow: none;
}

.floating-drag-handle-wrapper.is-over-toolbar:hover {
	background: rgba(var(--text_primary) / var(--alpha-10));
	border-color: transparent;
	border-right-color: rgb(var(--border_color));
	color: rgb(var(--primary));
}

.floating-drag-handle-wrapper.is-over-toolbar.is-dragging {
	background: rgba(var(--primary) / var(--alpha-10));
	border-color: transparent;
	border-right-color: rgb(var(--border_color));
}
</style>
