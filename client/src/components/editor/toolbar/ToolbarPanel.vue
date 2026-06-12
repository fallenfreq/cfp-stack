<template>
	<Teleport to="body">
		<div v-if="open" ref="panelEl" class="toolbar-panel" :style="panelStyle" @mousedown.stop>
			<slot />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch, type CSSProperties } from 'vue'

const props = defineProps<{
	open: boolean
	anchorEl: HTMLElement | null
	/** 'left' aligns panel's left edge to button's left; 'right' aligns right edge to button's right. */
	align?: 'left' | 'right'
}>()

const emit = defineEmits<{ close: [] }>()

const panelEl = ref<HTMLElement | null>(null)
const panelStyle = ref<CSSProperties>({})

const MARGIN = 4

const reposition = async () => {
	if (!props.anchorEl) return
	await nextTick()

	const rect = props.anchorEl.getBoundingClientRect()
	const viewportHeight = window.innerHeight
	const viewportWidth = window.innerWidth

	// Measure the panel for shift-not-shrink horizontal placement.
	// scrollHeight gives the intrinsic vertical size before max-height clamping
	// so we can decide whether to flip above.
	const panelWidth = panelEl.value?.offsetWidth ?? 0
	const panelHeight = panelEl.value?.scrollHeight ?? 0

	// Horizontal: compute the preferred left from `align`, then clamp so the
	// full-width panel stays inside the viewport. Shifts when the anchor sits
	// near an edge instead of shrinking the panel.
	const desiredLeft = props.align === 'right' ? rect.right - panelWidth : rect.left
	const maxLeft = Math.max(MARGIN, viewportWidth - panelWidth - MARGIN)
	const clampedLeft = Math.max(MARGIN, Math.min(desiredLeft, maxLeft))

	// Vertical: prefer below the anchor; flip above when room below is short
	// and room above is greater. Cap max-height to whatever room is available
	// in the chosen direction.
	const spaceBelow = viewportHeight - rect.bottom - MARGIN * 2
	const spaceAbove = rect.top - MARGIN * 2
	const flipAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow
	const maxHeight = Math.max(0, flipAbove ? spaceAbove : spaceBelow)

	panelStyle.value = {
		position: 'fixed',
		left: `${clampedLeft}px`,
		...(flipAbove
			? { bottom: `${viewportHeight - rect.top + MARGIN}px` }
			: { top: `${rect.bottom + MARGIN}px` }),
		maxHeight: `${maxHeight}px`,
		// Safety cap for the extreme case where the panel's intrinsic width is
		// wider than the viewport itself; horizontal placement above already
		// keeps it on-screen when widths fit.
		maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
	}
}

const onDocMousedown = (e: MouseEvent) => {
	if (props.anchorEl?.contains(e.target as Node)) return
	emit('close')
}

// capture: true so we catch scroll on any ancestor (e.g. a scrollable layout
// container around the editor), not just the window itself.
const onScroll = () => reposition()
const onScrollOptions = { passive: true, capture: true } as const

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) {
			reposition()
			document.addEventListener('mousedown', onDocMousedown)
			window.addEventListener('resize', reposition)
			window.addEventListener('scroll', onScroll, onScrollOptions)
			window.visualViewport?.addEventListener('resize', reposition)
		} else {
			document.removeEventListener('mousedown', onDocMousedown)
			window.removeEventListener('resize', reposition)
			window.removeEventListener('scroll', onScroll, onScrollOptions)
			window.visualViewport?.removeEventListener('resize', reposition)
		}
	},
)

onUnmounted(() => {
	document.removeEventListener('mousedown', onDocMousedown)
	window.removeEventListener('resize', reposition)
	window.removeEventListener('scroll', onScroll, onScrollOptions)
	window.visualViewport?.removeEventListener('resize', reposition)
})
</script>

<style scoped>
.toolbar-panel {
	/* Position must be fixed from the first paint: before reposition() writes
	 * an inline `position: fixed`, a default `static` block element teleported
	 * into <body> stretches to the full viewport width, and the first
	 * offsetWidth read returns ~viewport width — clamping the panel to the
	 * left edge on the first open. */
	position: fixed;
	z-index: var(--z-panel);
	background: rgb(var(--backgroundSecondary));
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 4px;
	padding: 4px;
	box-shadow: 0 2px 8px rgb(0 0 0 / var(--alpha-20));
	overflow-y: auto;
	scrollbar-width: none;
}

.toolbar-panel::-webkit-scrollbar {
	display: none;
}
</style>
