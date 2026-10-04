import type { Theme } from '@/constants/theme'
import { useDarkModeStore } from '@/stores/darkModeStore'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import lightTheme from 'highlight.js/styles/base16/ros-pine-dawn.min.css?url'
import darkTheme from 'highlight.js/styles/base16/ros-pine-moon.min.css?url'

// Pink mode borrows the dark colours: the nearest highlight.js themes clash with pink.
const themes: Record<Theme, string> = {
	light: lightTheme,
	dark: darkTheme,
	pink: darkTheme,
}

const useSyntaxHighlighting = () => {
	const darkModeStore = useDarkModeStore()
	const themeLink = ref<HTMLLinkElement | null>(null)

	const updateHighlightTheme = (theme: Theme) => {
		if (!themeLink.value) {
			themeLink.value = document.createElement('link')
			themeLink.value.rel = 'stylesheet'
			themeLink.value.type = 'text/css'
			document.head.appendChild(themeLink.value)
		}

		themeLink.value.href = themes[theme]
	}
	watch(
		() => darkModeStore.mode,
		(newVal) => {
			updateHighlightTheme(newVal)
		},
	)

	onMounted(() => {
		updateHighlightTheme(darkModeStore.mode)
	})

	onUnmounted(() => {
		if (themeLink.value) {
			themeLink.value.remove()
			themeLink.value = null
		}
	})
}

export { useSyntaxHighlighting }
