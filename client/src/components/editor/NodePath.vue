<template>
	<div class="node-path">
		<template v-for="(segment, i) in path" :key="segment.depth">
			<span v-if="i > 0" class="path-sep">›</span>
			<button
				class="path-node"
				:class="{
					'is-active': segment.depth === effectiveActiveDepth,
					'is-doc': segment.depth === 0,
				}"
				:disabled="segment.depth === 0"
				@click="handleDepthClick(segment)"
			>
				{{ segment.name }}
			</button>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ editor: Editor }>()
const dragHandleStore = useDragHandleStore()

const tick = ref(0)

interface PathSegment {
	name: string
	depth: number
	/** First content position inside this node; null for doc and leaf atoms. */
	pos: number | null
}

const path = computed((): PathSegment[] => {
	tick.value
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
			name: $pos.node(depth).type.name,
			depth,
			pos: depth === 0 ? null : $pos.start(depth),
		})
	}

	// Leaf atoms (Image, HR, …) have no content positions, so we can't resolve
	// inside them.  Append them at parentDepth + 1 so they appear in the path
	// and can be targeted for drag; pos stays null (no cursor to place inside).
	if (selection instanceof NodeSelection && selection.node.isLeaf) {
		segments.push({
			name: selection.node.type.name,
			depth: $pos.depth + 1,
			pos: null,
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
	// Leaf atoms: just update depth — the drag handle resolves them on the next
	// mousemove.  Navigable nodes: move cursor so view() shows the handle.
	if (segment.pos !== null) {
		props.editor.chain().focus().setTextSelection(segment.pos).run()
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
.node-path {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	padding: 4px 1.75rem;
	overflow-x: auto;
	scrollbar-width: none;
	background: rgb(var(--backgroundSecondary));
	border-bottom: 1px solid rgb(var(--backgroundBorder));
	font-size: 0.75rem;
}
.node-path::-webkit-scrollbar {
	display: none;
}

.path-sep {
	color: rgba(var(--textPrimary) / 0.3);
	padding: 0 4px;
	user-select: none;
}

.path-node {
	background: none;
	border: 1px solid transparent;
	border-radius: 3px;
	padding: 1px 5px;
	cursor: pointer;
	color: rgba(var(--textPrimary) / 0.6);
	font-size: 0.75rem;
	white-space: nowrap;
	transition:
		color 0.1s,
		background 0.1s;
}
.path-node:hover:not(:disabled) {
	color: rgb(var(--textPrimary));
	background: rgba(var(--textPrimary) / 0.06);
}
.path-node.is-active {
	color: rgb(var(--primary));
	border-color: rgba(var(--primary) / 0.4);
	background: rgba(var(--primary) / 0.08);
}
.path-node.is-doc {
	cursor: default;
	opacity: 0.4;
}
</style>
