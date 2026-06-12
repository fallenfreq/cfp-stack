<template>
	<Transition name="hint-fade">
		<button
			v-if="direction !== null"
			class="toolbar-scroll-hint"
			:style="hintStyle"
			@click="scrollToToolbar"
		>
			<span class="material-symbols-rounded">
				{{ direction === 'up' ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
			</span>
		</button>
	</Transition>
</template>

<script setup lang="ts">
import { useToolbarRect } from '@/composables/editor/useToolbarRect'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'

const props = defineProps<{ editor: Editor }>()

const toolbarRect = useToolbarRect(props.editor)

const getNodepathBottom = () => {
	return document.querySelector<HTMLElement>('.node-path')?.getBoundingClientRect().bottom ?? 0
}

const direction = computed<'up' | 'down' | null>(() => {
	const rect = toolbarRect.value
	if (!rect) return null
	if (rect.bottom <= getNodepathBottom()) return 'up'
	if (rect.top >= window.innerHeight) return 'down'
	return null
})

const hintStyle = computed(() =>
	direction.value === 'up' ? { top: `${getNodepathBottom() + 8}px` } : { bottom: '16px' },
)

const scrollToToolbar = () => {
	const rect = toolbarRect.value
	if (!rect) return
	const delta = rect.top - (getNodepathBottom() + 8)
	window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' })
}
</script>

<style>
.toolbar-scroll-hint {
	position: fixed;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px 12px;
	background: rgba(var(--backgroundSecondary) / var(--alpha-90));
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 12px;
	box-shadow: 0 2px 5px rgb(0 0 0 / var(--alpha-20));
	cursor: pointer;
	z-index: var(--z-scroll-hint);
	color: rgb(var(--textPrimary));
}

.toolbar-scroll-hint:hover {
	background: rgba(var(--backgroundElement) / var(--alpha-90));
}

.hint-fade-enter-active,
.hint-fade-leave-active {
	transition: opacity 0.15s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
	opacity: 0;
}
</style>
