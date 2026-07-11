<template>
	<Transition name="hint-fade">
		<button
			v-if="direction !== null"
			class="toolbar-scroll-hint sf sf-depth-2 sf-is-overlay sf-size-xs sf-on-hover"
			:style="hintStyle"
			@click="scrollToToolbar"
		>
			<MaterialIcon>
				{{ direction === 'up' ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
			</MaterialIcon>
		</button>
	</Transition>
</template>

<script setup lang="ts">
import MaterialIcon from '@/components/ui/MaterialIcon.vue'
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
	cursor: pointer;
	z-index: var(--z-scroll-hint);
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
