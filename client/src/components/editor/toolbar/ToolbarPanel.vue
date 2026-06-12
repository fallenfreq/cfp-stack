<template>
	<Teleport to="body">
		<div
			v-if="open"
			ref="panelEl"
			class="toolbar-panel"
			:class="{ 'is-hidden': awaitingKeyboard }"
			:style="panelStyle"
			@mousedown.stop
		>
			<slot />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { useVirtualKeyboard } from '@/composables/useVirtualKeyboard'
import { nextTick, onUnmounted, ref, watch, type CSSProperties } from 'vue'

const props = defineProps<{
	open: boolean
	anchorEl: HTMLElement | null
	/** 'left' aligns panel's left edge to button's left; 'right' aligns right edge to button's right. */
	align?: 'left' | 'right'
}>()

const emit = defineEmits<{ close: [] }>()

const { dismiss: dismissKeyboard, restore: restoreKeyboard } = useVirtualKeyboard()

const panelEl = ref<HTMLElement | null>(null)
const panelStyle = ref<CSSProperties>({})
const awaitingKeyboard = ref(false)

const MARGIN = 4

const reposition = async () => {
	if (!props.anchorEl) return
	await nextTick()

	const rect = props.anchorEl.getBoundingClientRect()
	// visualViewport.height excludes the on-screen keyboard on both iOS and
	// Android; window.innerHeight is the full layout height on iOS and misreports
	// available space when the keyboard is up.
	const viewportHeight = window.visualViewport?.height ?? window.innerHeight
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
	// Use the nodepath's bottom edge as the effective top boundary so a
	// flipped-above panel doesn't slide under the sticky breadcrumb bar.
	const nodepathEl = document.querySelector('.node-path')
	const topBoundary = nodepathEl ? nodepathEl.getBoundingClientRect().bottom : 0
	const spaceBelow = viewportHeight - rect.bottom - MARGIN * 2
	const spaceAbove = rect.top - topBoundary - MARGIN * 2
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
	async (isOpen) => {
		if (isOpen) {
			// Add scroll/resize listeners immediately so events aren't missed
			// while waiting for the keyboard to dismiss. The visualViewport
			// resize listener is added after settling — the keyboard-drop event
			// is owned by dismissKeyboard(), adding it early would double-fire.
			document.addEventListener('mousedown', onDocMousedown)
			window.addEventListener('resize', reposition)
			window.addEventListener('scroll', onScroll, onScrollOptions)
			// Hide the panel, dismiss the keyboard, then reposition against the
			// settled viewport and reveal. dismiss() resolves immediately when
			// the keyboard isn't visible, so there's no delay on desktop.
			awaitingKeyboard.value = true
			await dismissKeyboard()
			if (!props.open) return
			window.visualViewport?.addEventListener('resize', reposition)
			await reposition() // measure & position while still hidden
			awaitingKeyboard.value = false // reveal at correct position in same flush
		} else {
			document.removeEventListener('mousedown', onDocMousedown)
			window.removeEventListener('resize', reposition)
			window.removeEventListener('scroll', onScroll, onScrollOptions)
			window.visualViewport?.removeEventListener('resize', reposition)
			awaitingKeyboard.value = false
			restoreKeyboard()
		}
	},
)

onUnmounted(() => {
	document.removeEventListener('mousedown', onDocMousedown)
	window.removeEventListener('resize', reposition)
	window.removeEventListener('scroll', onScroll, onScrollOptions)
	window.visualViewport?.removeEventListener('resize', reposition)
	restoreKeyboard()
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

.toolbar-panel.is-hidden {
	visibility: hidden;
	pointer-events: none;
}
</style>
