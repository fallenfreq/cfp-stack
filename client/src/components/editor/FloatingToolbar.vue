<template>
	<div
		v-if="visibleItems.length"
		class="floating-toolbar flex flex-wrap gap-2 px-7 z-10"
		:style="{ top: `${position.top}px`, left: `${position.left}px`, right: '0' }"
	>
		<component
			:is="item.component"
			v-for="item in visibleItems"
			:key="item.id"
			:editor="editor"
			:context="activeNodeContext"
		/>
	</div>
</template>

<script setup lang="ts">
import {
	FloatingToolbarExtension,
	type FloatingToolbarOptions,
} from '@/editor/extensions/floatingToolbar'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { useMultiSelectStore } from '@/stores/multiSelectStore'
import { getExtensionOptions, nodeSelectionPos, resolvedNodePos } from '@/utils/editor/editorUtils'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ editor: Editor }>()

const dragHandleStore = useDragHandleStore()
const multiSelectStore = useMultiSelectStore()
const position = ref({ top: 0, left: 0 })

const TOOLBAR_SPACING = 10

const tick = ref(0)

// Resolves the active node (matching NodePath's logic) and its doc position.
// Returns nodePos=null when no valid node exists.
const resolveActive = (): ToolbarItemContext => {
	const { state } = props.editor
	const { selection } = state

	// For non-leaf NodeSelection the anchor is before the node; resolve inside instead.
	const pathPos =
		selection instanceof NodeSelection && !selection.node.isLeaf
			? selection.from + 1
			: selection.anchor

	const $pos = state.doc.resolve(pathPos)
	const effectiveDepth = Math.min(dragHandleStore.activeDepth, $pos.depth)

	if (selection instanceof NodeSelection && selection.node.isLeaf) {
		return {
			activeNode: selection.node,
			activeDepth: $pos.depth + 1,
			nodePos: nodeSelectionPos(selection),
		}
	}

	return {
		activeNode: $pos.node(effectiveDepth),
		activeDepth: effectiveDepth,
		nodePos: effectiveDepth > 0 ? resolvedNodePos($pos, effectiveDepth) : null,
	}
}

const activeNodeContext = computed((): ToolbarItemContext => {
	void tick.value
	return resolveActive()
})

const updatePosition = () => {
	tick.value++

	const { nodePos } = resolveActive()
	if (nodePos === null) return

	const domNode = props.editor.view.nodeDOM(nodePos) as HTMLElement | null
	if (!domNode) return

	const nodeRect = domNode.getBoundingClientRect()
	const editorRect = (props.editor.view.dom as HTMLElement).getBoundingClientRect()
	position.value = {
		top: nodeRect.top - TOOLBAR_SPACING,
		left: editorRect.left,
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
})

onUnmounted(() => {
	props.editor.off('transaction', updatePosition)
	window.removeEventListener('resize', updatePosition)
	window.removeEventListener('scroll', updatePosition)
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

.floating-toolbar {
	position: fixed;
	transform: translateY(-100%);
	background: rgba(var(--backgroundSecondary) / 0.9);
	border: 1px solid rgb(var(--backgroundBorder));
	padding: 8px;
	border-radius: 4px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	z-index: 1000;
}
</style>
