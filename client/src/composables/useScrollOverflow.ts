import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export function useScrollOverflow(elRef: Ref<HTMLElement | null>, refreshKey?: Ref<unknown>) {
	const left = ref(false)
	const right = ref(false)
	let ro: ResizeObserver | null = null

	const sync = () => {
		const el = elRef.value
		if (!el) return
		// Read computed padding so the threshold is "content beyond the padding
		// edge is hidden" — theme-independent and handles momentum-scroll
		// imprecision (the element can't scroll into its own end padding).
		// Math.max(..., 2) keeps a minimum sub-pixel buffer when padding is 0.
		const style = getComputedStyle(el)
		const startEpsilon = Math.max(parseFloat(style.paddingLeft) || 0, 2)
		const endEpsilon = Math.max(parseFloat(style.paddingRight) || 0, 2)
		const maxScrollLeft = el.scrollWidth - el.clientWidth
		left.value = el.scrollLeft > startEpsilon
		right.value = maxScrollLeft - el.scrollLeft > endEpsilon
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

	return { left, right, sync }
}
