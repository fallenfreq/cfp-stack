import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { ref, watch } from 'vue'

export function useCollapseBreakpoint(name: string) {
	const store = useThemeTokensStore()
	const isBelowThreshold = ref(false)

	// Follows the theme's breakpoint: set up once it has loaded, again if it changes. Vue stops
	// the watch with the component, and the cleanup stops listening.
	watch(
		() => store.collapseThresholds.find((t) => t.name === name)?.value,
		(value, _, onCleanup) => {
			if (!value) return
			const mq = window.matchMedia(`(max-width: ${value})`)
			const onchange = () => {
				isBelowThreshold.value = mq.matches
			}
			onchange()
			mq.addEventListener('change', onchange)
			onCleanup(() => mq.removeEventListener('change', onchange))
		},
		{ immediate: true },
	)

	return { isBelowThreshold }
}
