<template>
	<Transition name="hint-fade">
		<SfButton
			v-if="direction !== null"
			class="toolbar-scroll-hint sf-depth-2 sf-is-overlay"
			size="xs"
			aria-label="Scroll to toolbar"
			:style="hintStyle"
			@click="scrollToToolbar"
		>
			<MaterialIcon>
				{{ direction === 'up' ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
			</MaterialIcon>
		</SfButton>
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

// Clear of the path bar above, or of the screen's bottom edge.
const hintStyle = computed(() =>
	direction.value === 'up'
		? { top: `calc(${getNodepathBottom()}px + var(--sf-spacing-xs))` }
		: { bottom: 'var(--sf-spacing-md)' },
)

const scrollToToolbar = () => {
	const rect = toolbarRect.value
	if (!rect) return
	// Scroll positions are pixels: 8 matches --sf-spacing-xs at the default font size.
	const delta = rect.top - (getNodepathBottom() + 8)
	window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' })
}
</script>

<style>
@layer ui {
	/* Floats centred over the page. Centred with auto margins, not a transform, so a
	   theme's own transforms on buttons can't move it. */
	.toolbar-scroll-hint {
		position: fixed;
		inset-inline: 0;
		width: fit-content;
		margin-inline: auto;
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
}
</style>
