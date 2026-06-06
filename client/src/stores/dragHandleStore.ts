import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const FADE_DELAY_MS = 2000

export const useDragHandleStore = defineStore('dragHandle', () => {
	const activeDepth = ref(1)
	const selectionNodePos = ref<number | null>(null)
	const hoverNodePos = ref<number | null>(null)
	const isFading = ref(false)
	let fadeTimer: ReturnType<typeof setTimeout> | null = null

	// Hover handle only shows when it would target a different node than the
	// toolbar's active node — otherwise the toolbar's inline handle already serves.
	const floatingHandlePos = computed(() =>
		hoverNodePos.value !== null && hoverNodePos.value !== selectionNodePos.value
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

	return {
		activeDepth,
		selectionNodePos,
		hoverNodePos,
		isFading,
		floatingHandlePos,
		setActiveDepth,
		setSelectionNodePos,
		setHoverNodePos,
		lockFade,
		unlockFade,
	}
})
