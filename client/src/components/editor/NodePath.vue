<template>
	<div
		ref="nodePathEl"
		class="node-path sf-text-xs"
		:class="{ 'sf-is-overflow-left': isOverflowLeft, 'sf-is-overflow-right': isOverflowRight }"
	>
		<template v-for="(segment, i) in path" :key="segment.depth">
			<span v-if="i > 0" class="path-sep sf-icon sf-loudness-1">›</span>
			<button
				class="path-node sf sf-single-line sf-is-contained sf-loudness-1 sf-on-hover sf-on-disabled sf-size-xs"
				:class="{ 'sf-on-current': segment.depth === effectiveActiveDepth }"
				:disabled="segment.depth === 0"
				@mousedown.prevent
				@click="handleDepthClick(segment)"
			>
				{{ segment.name }}
			</button>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useScrollOverflow } from '@/composables/useScrollOverflow'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { getNodeAlias } from '@/utils/editor/nodeRegistry'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ editor: Editor }>()
const dragHandleStore = useDragHandleStore()

const tick = ref(0)
const nodePathEl = ref<HTMLElement | null>(null)
const { left: isOverflowLeft, right: isOverflowRight } = useScrollOverflow(nodePathEl, tick)

interface PathSegment {
	name: string
	depth: number
	start: number // $pos.start(depth); -1 for leaf nodes
}

const path = computed((): PathSegment[] => {
	void tick.value
	const { state } = props.editor
	const { selection } = state

	// For a non-leaf NodeSelection the anchor resolves *before* the node (at the
	// parent's depth).  Resolve one step inside instead so the node appears
	// naturally in the ancestry chain without special-casing the loop.
	const pathPos =
		selection instanceof NodeSelection && !selection.node.isLeaf
			? selection.from + 1
			: selection.anchor

	const $pos = state.doc.resolve(pathPos)
	const segments: PathSegment[] = []

	for (let depth = 0; depth <= $pos.depth; depth++) {
		segments.push({
			name: getNodeAlias($pos.node(depth).type.name),
			depth,
			start: $pos.start(depth),
		})
	}

	// Leaf atoms (Image, HR, …) have no content positions.
	// Append them at parentDepth + 1 so they appear in the path.
	if (selection instanceof NodeSelection && selection.node.isLeaf) {
		segments.push({
			name: getNodeAlias(selection.node.type.name),
			depth: $pos.depth + 1,
			start: -1,
		})
	}

	return segments
})

// Clamp to the deepest segment that actually exists so the highlight always
// lands on something visible, even when activeDepth exceeds the current path.
const effectiveActiveDepth = computed(() => {
	const maxDepth = path.value.at(-1)?.depth ?? 0
	return Math.min(dragHandleStore.activeDepth, maxDepth)
})

const handleDepthClick = (segment: PathSegment) => {
	if (segment.depth === 0) return
	dragHandleStore.setActiveDepth(segment.depth)

	const { state } = props.editor
	const { selection } = state

	// A non-leaf NodeSelection only resolves as deep as the selected node.
	// Resolve one step inside so selDepth reflects the node's actual depth.
	const pathPos =
		selection instanceof NodeSelection && !selection.node.isLeaf
			? selection.from + 1
			: selection.anchor
	const selDepth = state.doc.resolve(pathPos).depth

	if (segment.start >= 0 && selDepth < segment.depth) {
		// Cursor is shallower than target — move it inside the node.
		props.editor.view.dispatch(
			state.tr.setSelection(TextSelection.near(state.doc.resolve(segment.start))),
		)
	} else {
		// Keep cursor in place; tag so the drag handle recomputes with new activeDepth.
		props.editor.view.dispatch(state.tr.setMeta('refreshDragHandle', true))
	}
}

const onTransaction = () => {
	tick.value++
}

onMounted(() => {
	props.editor.on('transaction', onTransaction)
})

onUnmounted(() => {
	props.editor.off('transaction', onTransaction)
})
</script>

<style>
@layer ui {
	.node-path {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.node-path::-webkit-scrollbar {
		display: none;
	}

	.path-sep {
		padding: 0 4px;
		user-select: none;
		flex-shrink: 0;
	}

	.path-node {
		white-space: nowrap;
	}
}
</style>
