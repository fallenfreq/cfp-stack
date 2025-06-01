import type { Theme } from '@/constants/theme'
import { readonly, ref, type Ref } from 'vue'

const osTheme = ref<Theme>('light')
let initialized = false

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const updateTheme = () => {
	osTheme.value = mediaQuery.matches ? 'dark' : 'light'
}

updateTheme()

export function useOSThemePreference(): Readonly<Ref<Theme>> {
	if (!initialized) {
		updateTheme()
		mediaQuery.addEventListener('change', updateTheme)
		initialized = true
	}
	return readonly(osTheme)
}
