import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { onUnmounted, ref, watch } from 'vue'

export function useCollapseBreakpoint(name: string) {
	const store = useThemeTokensStore()
	const isBelowThreshold = ref(false)
	let mq: MediaQueryList | undefined

	const onchange = (e: MediaQueryListEvent | MediaQueryList) => {
		isBelowThreshold.value = e.matches
	}

	// Watch hydration so setup runs whether store is already ready or still loading.
	const stopWatch = watch(
		() => store.hydrated,
		(hydrated) => {
			if (!hydrated) return
			const threshold = store.collapseThresholds.find((t) => t.name === name)
			if (!threshold) return
			mq = window.matchMedia(`(max-width: ${threshold.value})`)
			isBelowThreshold.value = mq.matches
			mq.addEventListener('change', onchange)
			stopWatch()
		},
		{ immediate: true },
	)

	onUnmounted(() => {
		mq?.removeEventListener('change', onchange)
	})

	return { isBelowThreshold }
}
