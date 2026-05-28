<template>
	<div
		v-if="visibleItems.length"
		class="floating-toolbar flex flex-wrap gap-2 px-7 z-10"
		:style="{ top: `${position.top}px`, left: `${position.left}px` }"
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
import { getExtensionOptions } from '@/utils/editor/editorUtils'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ editor: Editor }>()

const dragHandleStore = useDragHandleStore()
const position = ref({ top: 0, left: 0 })

const TOOLBAR_SPACING = 10

const tick = ref(0)

// Resolves the active node (matching NodePath's logic) and the doc position of
// its DOM node for positioning.  Returns domPos=null when no valid node exists.
const resolveActive = (): { context: ToolbarItemContext; domPos: number | null } => {
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
			context: { activeNode: selection.node, activeDepth: $pos.depth + 1 },
			domPos: selection.from,
		}
	}

	return {
		context: { activeNode: $pos.node(effectiveDepth), activeDepth: effectiveDepth },
		domPos: effectiveDepth > 0 ? $pos.before(effectiveDepth) : null,
	}
}

const activeNodeContext = computed((): ToolbarItemContext => {
	tick.value
	return resolveActive().context
})

const updatePosition = () => {
	tick.value++

	const { domPos } = resolveActive()
	if (domPos === null) return

	const domNode = props.editor.view.nodeDOM(domPos) as HTMLElement | null
	if (!domNode) return

	const rect = domNode.getBoundingClientRect()
	position.value = {
		top: rect.top - TOOLBAR_SPACING,
		left: rect.left,
	}
}

const items = computed(
	() =>
		getExtensionOptions<FloatingToolbarOptions>(props.editor, FloatingToolbarExtension.name)
			?.items ?? [],
)

const visibleItems = computed(() => {
	tick.value
	const context = activeNodeContext.value
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
