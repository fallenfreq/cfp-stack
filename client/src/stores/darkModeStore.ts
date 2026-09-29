import type { Theme } from '@/constants/theme'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useDarkModeStore = defineStore('darkMode', () => {
	// Starts from the OS preference: index.html adds theme-dark before the app loads.
	const mode = ref<Theme>(
		document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light',
	)

	function setMode(next: Theme) {
		const root = document.documentElement.classList
		root.remove(`theme-${mode.value}`)
		if (next !== 'light') root.add(`theme-${next}`)
		mode.value = next
	}

	const isDarkMode = computed({
		get: () => mode.value === 'dark',
		set: (dark: boolean) => setMode(dark ? 'dark' : 'light'),
	})
	const isPinkMode = computed(() => mode.value === 'pink')

	// Secret pink mode: toggles back to whichever mode was on before.
	let previousMode: Theme = mode.value
	function togglePinkMode(): void {
		if (isPinkMode.value) {
			setMode(previousMode)
			console.log('Secret pink mode deactivated')
		} else {
			previousMode = mode.value
			setMode('pink')
			console.log('Secret pink mode activated')
		}
	}

	return { mode, isDarkMode, isPinkMode, togglePinkMode }
})
