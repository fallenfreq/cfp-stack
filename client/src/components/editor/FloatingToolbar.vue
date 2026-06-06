<template>
	<div
		v-if="visibleItems.length"
		ref="toolbarEl"
		class="floating-toolbar"
		:style="{
			top: `${position.top}px`,
			left: `${position.left}px`,
			'max-width': `${position.maxWidth}px`,
		}"
	>
		<DragHandleBlock
			v-if="activeNodeContext.nodePos !== null"
			:editor="editor"
			:node-pos="activeNodeContext.nodePos"
			variant="inline"
		/>
		<OverflowRow class="toolbar-overflow" :refresh-key="toolbarRefreshKey">
			<component
				:is="item.component"
				v-for="item in visibleItems"
				:key="item.id"
				:editor="editor"
				:context="activeNodeContext"
			/>
		</OverflowRow>
	</div>
</template>

<script setup lang="ts">
import {
	resolveDragHandleTargetFromSelection,
	type DragHandleOptions,
} from '@/editor/extensions/dragHandle'
import {
	FloatingToolbarExtension,
	type FloatingToolbarOptions,
} from '@/editor/extensions/floatingToolbar'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { useMultiSelectStore } from '@/stores/multiSelectStore'
import { getExtensionOptions } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import DragHandleBlock from './DragHandleBlock.vue'
import OverflowRow from './OverflowRow.vue'

const props = defineProps<{ editor: Editor }>()

const dragHandleStore = useDragHandleStore()
const multiSelectStore = useMultiSelectStore()
const position = ref({ top: 0, left: 0, maxWidth: 0 })
const toolbarEl = ref<HTMLElement | null>(null)

const TOOLBAR_SPACING = 10
const VIEWPORT_PADDING = 8

const tick = ref(0)

// Defers to the drag-handle extension's resolver so the toolbar and the drag
// handle always agree on which node is active for any given selection — same
// logic the hover plugin uses via posAtCoords, so floating and inline handles
// behave identically.
const resolveActive = (): ToolbarItemContext => {
	const { state } = props.editor
	const options = getExtensionOptions<DragHandleOptions>(props.editor, 'dragHandle')
	if (!options) return { activeNode: state.doc, activeDepth: 0, nodePos: null }
	const target = resolveDragHandleTargetFromSelection(state, options)
	if (!target) return { activeNode: state.doc, activeDepth: 0, nodePos: null }
	return {
		activeNode: target.node,
		activeDepth: target.depth,
		nodePos: target.pos,
	}
}

const activeNodeContext = computed((): ToolbarItemContext => {
	void tick.value
	return resolveActive()
})

const toolbarRefreshKey = computed(
	() => `${visibleItems.value.map((item) => item.id).join('|')}:${tick.value}`,
)

const updatePosition = async () => {
	tick.value++

	const { nodePos } = resolveActive()
	dragHandleStore.setSelectionNodePos(nodePos)
	if (nodePos === null) return

	const domNode = props.editor.view.nodeDOM(nodePos) as HTMLElement | null
	if (!domNode) return

	const nodeRect = domNode.getBoundingClientRect()
	// Layout not yet committed (typical on initial mount before the editor's
	// DOM has its real size). Skip — we'll be called again on the next
	// transaction/scroll once the browser has finished layout, and `transform:
	// translateY(-100%)` keeps the toolbar off-screen at the default {0,0}
	// position in the meantime.
	if (nodeRect.width === 0 && nodeRect.height === 0) return

	// First pass: tentatively position at the node's left edge with maxWidth
	// allowing the toolbar to grow up to the full available viewport width.
	// The second pass below measures the actual rendered width and shifts the
	// toolbar left if it would overflow the right viewport edge.
	const preferredLeft = Math.max(nodeRect.left, VIEWPORT_PADDING)
	position.value = {
		top: nodeRect.top - TOOLBAR_SPACING,
		left: preferredLeft,
		maxWidth: window.innerWidth - 2 * VIEWPORT_PADDING,
	}

	await nextTick()
	if (!toolbarEl.value) return

	// Shift left to give the toolbar room to fit, clamped to VIEWPORT_PADDING.
	// If natural width still exceeds (innerWidth - 2 * VIEWPORT_PADDING), the
	// toolbar settles at left = VIEWPORT_PADDING and OverflowRow handles the
	// horizontal scroll inside.
	const width = toolbarEl.value.offsetWidth
	const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)
	const left = Math.min(preferredLeft, maxLeft)
	position.value = {
		top: nodeRect.top - TOOLBAR_SPACING,
		left,
		maxWidth: window.innerWidth - left - VIEWPORT_PADDING,
	}
}

const items = computed(
	() =>
		getExtensionOptions<FloatingToolbarOptions>(props.editor, FloatingToolbarExtension.name)
			?.items ?? [],
)

const visibleItems = computed(() => {
	void tick.value
	const context = activeNodeContext.value
	if (multiSelectStore.positions.length > 0) {
		return items.value
			.filter((i) => i.id.startsWith('sel-'))
			.filter((i) => i.show(props.editor, context))
	}
	return items.value.filter((item) => item.show(props.editor, context))
})

onMounted(() => {
	props.editor.on('transaction', updatePosition)
	window.addEventListener('resize', updatePosition)
	window.addEventListener('scroll', updatePosition, { passive: true })
	updatePosition()
	;(props.editor.view.dom as HTMLElement).classList.add('has-floating-toolbar')
})

onUnmounted(() => {
	props.editor.off('transaction', updatePosition)
	window.removeEventListener('resize', updatePosition)
	window.removeEventListener('scroll', updatePosition)
	dragHandleStore.setSelectionNodePos(null)
	;(props.editor.view.dom as HTMLElement).classList.remove('has-floating-toolbar')
})
</script>

<style>
.sel-count {
	font-size: 0.75rem;
	color: rgba(var(--textPrimary) / 0.6);
	padding: 0 4px;
	white-space: nowrap;
	align-self: center;
}

.tiptap.has-floating-toolbar[contenteditable='true'] {
	padding-top: calc(var(--toolbar-height) + 20px);
}

.floating-toolbar {
	position: fixed;
	display: flex;
	align-items: stretch;
	box-sizing: border-box;
	width: fit-content;
	height: var(--toolbar-height);
	transform: translateY(-100%);
	background: rgba(var(--backgroundSecondary) / 0.9);
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 4px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	z-index: var(--z-toolbar);
	overflow: hidden;
}

.toolbar-overflow {
	flex: 1;
	min-width: 0;
}
</style>
