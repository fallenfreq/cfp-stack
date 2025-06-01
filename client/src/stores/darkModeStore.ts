import { useOSThemePreference } from '@/composables/useOSThemePreference'
import { safeApplyPreset, safeCurrentPresetName } from '@/utils/theme'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { useGlobalConfig } from 'vuestic-ui'

export const useDarkModeStore = defineStore('darkMode', () => {
	const osTheme = useOSThemePreference()
	const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary')
	const { globalConfig } = useGlobalConfig()
	// Set the primary color to the value of the CSS variable used by other components
	globalConfig.value.colors.presets.light.primary = `rgb(${primaryColor.replace(new RegExp(' ', 'g'), ', ')})`

	// Dark mode starts using the os preference
	// The dark class is added in the head of the index.html using:
	// if (window.matchMedia('(prefers-color-scheme: dark)').matches)
	safeApplyPreset(osTheme.value)

	const isDarkMode: Ref<boolean> = ref(document.documentElement.classList.contains('dark'))
	const isPinkMode = ref(false)

	function toggleDarkMode(event: any) {
		if (event.target['checked']) {
			safeApplyPreset('dark')
			document.documentElement.classList.add('dark')
		} else {
			safeApplyPreset('light')
			document.documentElement.classList.remove('dark')
		}
	}

	let previousMode = safeCurrentPresetName.value

	// Secret pink mode
	function togglePinkMode(): void {
		if (safeCurrentPresetName.value === 'pink') {
			safeApplyPreset(previousMode)
			document.documentElement.classList.remove('pink')
			document.documentElement.classList.add(previousMode)
			isPinkMode.value = false
			isDarkMode.value = document.documentElement.classList.contains('dark')
			console.log('Secret pink mode deactivated')
		} else {
			previousMode = safeCurrentPresetName.value
			safeApplyPreset('pink')
			document.documentElement.classList.add('pink')
			isPinkMode.value = true
			isDarkMode.value = false
			document.documentElement.classList.remove(previousMode)
			console.log('Secret pink mode activated')
		}
	}

	return {
		mode: safeCurrentPresetName,
		isDarkMode,
		isPinkMode,
		toggleDarkMode,
		togglePinkMode
	}
})
