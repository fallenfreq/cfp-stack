<template>
	<Teleport to="body">
		<div v-if="open" ref="panelEl" class="toolbar-panel" :style="panelStyle" @mousedown.stop>
			<slot />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch, type CSSProperties } from 'vue'

const props = defineProps<{
	open: boolean
	anchorEl: HTMLElement | null
	/** 'left' aligns panel's left edge to button's left; 'right' aligns right edge to button's right. */
	align?: 'left' | 'right'
}>()

const emit = defineEmits<{ close: [] }>()

const panelEl = ref<HTMLElement | null>(null)
const panelStyle = ref<CSSProperties>({})

const reposition = () => {
	if (!props.anchorEl) return
	const rect = props.anchorEl.getBoundingClientRect()
	const MARGIN = 4
	if (props.align === 'right') {
		panelStyle.value = {
			position: 'fixed',
			top: `${rect.bottom + MARGIN}px`,
			right: `${window.innerWidth - rect.right}px`,
			maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
		}
	} else {
		panelStyle.value = {
			position: 'fixed',
			top: `${rect.bottom + MARGIN}px`,
			left: `${rect.left}px`,
			maxWidth: `calc(100vw - ${rect.left + MARGIN}px)`,
		}
	}
}

const onDocMousedown = (e: MouseEvent) => {
	if (props.anchorEl?.contains(e.target as Node)) return
	emit('close')
}

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) {
			reposition()
			document.addEventListener('mousedown', onDocMousedown)
			window.addEventListener('resize', reposition)
			window.visualViewport?.addEventListener('resize', reposition)
		} else {
			document.removeEventListener('mousedown', onDocMousedown)
			window.removeEventListener('resize', reposition)
			window.visualViewport?.removeEventListener('resize', reposition)
		}
	},
)

onUnmounted(() => {
	document.removeEventListener('mousedown', onDocMousedown)
	window.removeEventListener('resize', reposition)
	window.visualViewport?.removeEventListener('resize', reposition)
})
</script>

<style scoped>
.toolbar-panel {
	z-index: 1001;
	background: rgb(var(--backgroundSecondary));
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 4px;
	padding: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
