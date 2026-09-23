import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export function useScrollOverflow(elRef: Ref<HTMLElement | null>, refreshKey?: Ref<unknown>) {
	const top = ref(false)
	const right = ref(false)
	const bottom = ref(false)
	const left = ref(false)
	let ro: ResizeObserver | null = null

	const sync = () => {
		const el = elRef.value
		if (!el) return
		// Read computed padding so the threshold is "content beyond the padding
		// edge is hidden" — theme-independent and handles momentum-scroll
		// imprecision (the element can't scroll into its own end padding).
		// Math.max(..., 2) keeps a minimum sub-pixel buffer when padding is 0.
		const style = getComputedStyle(el)
		const leftEpsilon = Math.max(parseFloat(style.paddingLeft) || 0, 2)
		const rightEpsilon = Math.max(parseFloat(style.paddingRight) || 0, 2)
		const topEpsilon = Math.max(parseFloat(style.paddingTop) || 0, 2)
		const bottomEpsilon = Math.max(parseFloat(style.paddingBottom) || 0, 2)
		const maxScrollLeft = el.scrollWidth - el.clientWidth
		const maxScrollTop = el.scrollHeight - el.clientHeight
		left.value = el.scrollLeft > leftEpsilon
		right.value = maxScrollLeft - el.scrollLeft > rightEpsilon
		top.value = el.scrollTop > topEpsilon
		bottom.value = maxScrollTop - el.scrollTop > bottomEpsilon
	}

	const refresh = async () => {
		await nextTick()
		sync()
	}

	onMounted(() => {
		const el = elRef.value
		if (!el) return
		refresh()
		el.addEventListener('scroll', sync, { passive: true })
		// Re-sync when the container's clientWidth changes (e.g. FloatingToolbar
		// updating maxWidth on every transaction). ResizeObserver fires after
		// layout so scrollWidth/clientWidth are always up to date.
		ro = new ResizeObserver(sync)
		ro.observe(el)
	})

	onUnmounted(() => {
		elRef.value?.removeEventListener('scroll', sync)
		ro?.disconnect()
		ro = null
	})

	if (refreshKey) watch(refreshKey, refresh)

	return { top, right, bottom, left, sync }
}
