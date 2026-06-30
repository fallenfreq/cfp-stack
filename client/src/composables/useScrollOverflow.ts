import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

const OVERFLOW_EPSILON = 2

export function useScrollOverflow(elRef: Ref<HTMLElement | null>, refreshKey?: Ref<unknown>) {
	const left = ref(false)
	const right = ref(false)

	const sync = () => {
		const el = elRef.value
		if (!el) return
		const maxScrollLeft = el.scrollWidth - el.clientWidth
		left.value = el.scrollLeft > OVERFLOW_EPSILON
		right.value = maxScrollLeft - el.scrollLeft > OVERFLOW_EPSILON
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
	})

	onUnmounted(() => {
		elRef.value?.removeEventListener('scroll', sync)
	})

	if (refreshKey) watch(refreshKey, refresh)

	return { left, right }
}
