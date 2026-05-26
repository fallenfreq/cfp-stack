<template>
	<div
		v-if="visibleItems.length"
		class="floating-toolbar flex flex-wrap gap-2 px-7 z-10"
		:style="{ top: `${position.top}px`, left: `${position.left}px` }"
	>
		<component
			v-for="item in visibleItems"
			:key="item.id"
			:is="item.component"
			:editor="editor"
		/>
	</div>
</template>

<script setup lang="ts">
import {
	FloatingToolbarExtension,
	type FloatingToolbarOptions,
} from '@/editor/extensions/floatingToolbar'
import { getExtensionOptions } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ editor: Editor }>()

const position = ref({ top: 0, left: 0 })

const TOOLBAR_HEIGHT = 48
const TOOLBAR_SPACING = 10

const tick = ref(0)

const updatePosition = () => {
	tick.value++

	const { view, state } = props.editor
	const { selection } = state
	const { anchor } = selection

	const resolvedPos = state.doc.resolve(anchor)
	const startPosition = resolvedPos.start(resolvedPos.depth)
	const nodeType = state.doc.nodeAt(anchor)?.type.name
	const isTextNodeType = nodeType === 'text'

	const nonTextNode = (
		isTextNodeType || !nodeType ? view.nodeDOM(startPosition - 1) : view.nodeDOM(anchor)
	) as HTMLElement | null

	if (!nonTextNode) return

	const rect = nonTextNode.getBoundingClientRect()
	position.value = {
		top: rect.top - TOOLBAR_HEIGHT - TOOLBAR_SPACING,
		left: rect.left,
	}
}

const items = computed(
	() =>
		getExtensionOptions<FloatingToolbarOptions>(props.editor, FloatingToolbarExtension.name)
			?.items ?? [],
)

const visibleItems = computed(() => {
	tick.value // establish dependency on editor state changes
	return items.value.filter((item) => item.show(props.editor))
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
	background: rgba(var(--backgroundSecondary) / 0.9);
	border: 1px solid rgb(var(--backgroundBorder));
	padding: 8px;
	border-radius: 4px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	z-index: 1000;
	transition:
		transform 0.15s ease-in-out,
		opacity 0.15s ease-in-out;
}
</style>
