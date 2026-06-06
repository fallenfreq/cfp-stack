<template>
	<div
		v-if="visiblePos !== null && pixelPos"
		class="floating-drag-handle-wrapper"
		:class="{ 'is-fading': store.isFading }"
		:style="{ top: `${pixelPos.top}px`, left: `${pixelPos.left}px` }"
		@mouseenter="store.lockFade"
		@mouseleave="store.unlockFade"
	>
		<DragHandleBlock
			:editor="editor"
			:node-pos="visiblePos"
			variant="floating"
			:select-on-mousedown="false"
		/>
	</div>
</template>

<script setup lang="ts">
import { useDragHandleStore } from '@/stores/dragHandleStore'
import type { Editor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import DragHandleBlock from './DragHandleBlock.vue'

const props = defineProps<{ editor: Editor }>()
const store = useDragHandleStore()

const HANDLE_GAP = 4

const visiblePos = computed(() => store.floatingHandlePos)
const pixelPos = ref<{ top: number; left: number } | null>(null)

const updatePixelPos = () => {
	const pos = visiblePos.value
	if (pos === null) {
		pixelPos.value = null
		return
	}
	const dom = props.editor.view.nodeDOM(pos) as HTMLElement | null
	if (!dom) {
		pixelPos.value = null
		return
	}
	const rect = dom.getBoundingClientRect()
	if (rect.width === 0 && rect.height === 0) {
		pixelPos.value = null
		return
	}
	pixelPos.value = { top: rect.top - HANDLE_GAP, left: rect.left }
}

watch(visiblePos, updatePixelPos, { flush: 'post' })

onMounted(() => {
	props.editor.on('transaction', updatePixelPos)
	window.addEventListener('scroll', updatePixelPos, { capture: true, passive: true })
	window.addEventListener('resize', updatePixelPos, { passive: true })
})

onUnmounted(() => {
	props.editor.off('transaction', updatePixelPos)
	window.removeEventListener('scroll', updatePixelPos, { capture: true })
	window.removeEventListener('resize', updatePixelPos)
})
</script>

<style scoped>
.floating-drag-handle-wrapper {
	position: fixed;
	transform: translateY(-100%);
	z-index: var(--z-toolbar);
	opacity: 1;
	transition: opacity 1s ease 1s;
}

.floating-drag-handle-wrapper.is-fading {
	opacity: 0;
}
</style>
