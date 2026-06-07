import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const FADE_DELAY_MS = 2000

export const useDragHandleStore = defineStore('dragHandle', () => {
	const activeDepth = ref(1)
	const selectionNodePos = ref<number | null>(null)
	const hoverNodePos = ref<number | null>(null)
	const isFading = ref(false)
	const isFloatDragging = ref(false)
	// True for the duration of an inline toolbar handle drag.  FloatingToolbar
	// freezes its visibleItems and skips updatePosition while this is set so the
	// toolbar layout doesn't shift under the browser's drag image.
	const isToolbarHandleDragging = ref(false)
	let fadeTimer: ReturnType<typeof setTimeout> | null = null

	// Hover handle only shows when it would target a different node than the
	// toolbar's active node — otherwise the toolbar's inline handle already serves.
	// During a floating-handle drag the selection is forced onto the hover node,
	// so we keep the handle mounted until dragend via the isFloatDragging lock.
	const floatingHandlePos = computed(() =>
		hoverNodePos.value !== null &&
		(isFloatDragging.value || hoverNodePos.value !== selectionNodePos.value)
			? hoverNodePos.value
			: null,
	)

	const lockFade = () => {
		if (fadeTimer) {
			clearTimeout(fadeTimer)
			fadeTimer = null
		}
		isFading.value = false
	}

	const unlockFade = () => {
		if (fadeTimer || hoverNodePos.value === null) return
		isFading.value = true
		fadeTimer = setTimeout(() => {
			hoverNodePos.value = null
			isFading.value = false
			fadeTimer = null
		}, FADE_DELAY_MS)
	}

	const setActiveDepth = (depth: number) => {
		activeDepth.value = depth
	}

	const setSelectionNodePos = (pos: number | null) => {
		selectionNodePos.value = pos
	}

	const setHoverNodePos = (pos: number | null) => {
		hoverNodePos.value = pos
		lockFade()
	}

	const setIsFloatDragging = (v: boolean) => {
		isFloatDragging.value = v
	}

	const setIsToolbarHandleDragging = (v: boolean) => {
		isToolbarHandleDragging.value = v
	}

	return {
		activeDepth,
		selectionNodePos,
		hoverNodePos,
		isFading,
		isFloatDragging,
		isToolbarHandleDragging,
		floatingHandlePos,
		setActiveDepth,
		setSelectionNodePos,
		setHoverNodePos,
		setIsFloatDragging,
		setIsToolbarHandleDragging,
		lockFade,
		unlockFade,
	}
})
