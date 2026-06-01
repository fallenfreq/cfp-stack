<template>
	<div
		v-if="visibleItems.length"
		ref="toolbarEl"
		class="floating-toolbar z-10"
		:style="{ top: `${position.top}px`, left: `${position.left}px` }"
	>
		<OverflowRow :refresh-key="toolbarRefreshKey">
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
	FloatingToolbarExtension,
	type FloatingToolbarOptions,
} from '@/editor/extensions/floatingToolbar'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { useMultiSelectStore } from '@/stores/multiSelectStore'
import { getExtensionOptions, nodeSelectionPos, resolvedNodePos } from '@/utils/editor/editorUtils'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import OverflowRow from './OverflowRow.vue'

const props = defineProps<{ editor: Editor }>()

const dragHandleStore = useDragHandleStore()
const multiSelectStore = useMultiSelectStore()
const position = ref({ top: 0, left: 0 })
const toolbarEl = ref<HTMLElement | null>(null)

const TOOLBAR_SPACING = 10
const VIEWPORT_PADDING = 8

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

const toolbarRefreshKey = computed(
	() => `${visibleItems.value.map((item) => item.id).join('|')}:${tick.value}`,
)

const clampLeftToViewport = async (preferredLeft: number) => {
	await nextTick()

	const width = toolbarEl.value?.offsetWidth ?? 0
	const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)

	position.value.left = Math.min(Math.max(preferredLeft, VIEWPORT_PADDING), maxLeft)
}

const updatePosition = async () => {
	tick.value++

	const { nodePos } = resolveActive()
	if (nodePos === null) return

	const domNode = props.editor.view.nodeDOM(nodePos) as HTMLElement | null
	if (!domNode) return

	const nodeRect = domNode.getBoundingClientRect()
	position.value = {
		top: nodeRect.top - TOOLBAR_SPACING,
		left: nodeRect.left,
	}

	await clampLeftToViewport(nodeRect.left)
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
	display: block;
	box-sizing: border-box;
	width: fit-content;
	max-width: calc(100vw - 1rem);
	transform: translateY(-100%);
	background: rgba(var(--backgroundSecondary) / 0.9);
	border: 1px solid rgb(var(--backgroundBorder));
	padding: 8px;
	border-radius: 4px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	z-index: 1000;
	overflow: visible;
}
</style>
