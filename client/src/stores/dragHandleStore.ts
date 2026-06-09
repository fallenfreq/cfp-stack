import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const FADE_DELAY_MS = 2000

export const useDragHandleStore = defineStore('dragHandle', () => {
	const activeDepth = ref(1)
	const selectionNodePos = ref<number | null>(null)
	const hoverNodePos = ref<number | null>(null)
	const isFading = ref(false)
	const isDragging = ref(false)
	// Locked at dragstart so the handle keeps targeting the same node even if
	// hoverNodePos changes mid-drag.  currentTargetPos returns this while
	// isDragging is true.
	const frozenTargetPos = ref<number | null>(null)
	let fadeTimer: ReturnType<typeof setTimeout> | null = null

	// The node the unified drag handle is currently targeting.  Defaults to the
	// hovered node when one is set; otherwise the selection-driven active node.
	// Locked to frozenTargetPos for the duration of a drag.
	const currentTargetPos = computed<number | null>(() =>
		isDragging.value ? frozenTargetPos.value : (hoverNodePos.value ?? selectionNodePos.value),
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

	const setIsDragging = (v: boolean) => {
		isDragging.value = v
	}

	const setFrozenTargetPos = (pos: number | null) => {
		frozenTargetPos.value = pos
	}

	return {
		activeDepth,
		selectionNodePos,
		hoverNodePos,
		isFading,
		isDragging,
		frozenTargetPos,
		currentTargetPos,
		setActiveDepth,
		setSelectionNodePos,
		setHoverNodePos,
		setIsDragging,
		setFrozenTargetPos,
		lockFade,
		unlockFade,
	}
})
