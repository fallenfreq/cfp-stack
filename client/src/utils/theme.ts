import { useOSThemePreference } from '@/composables/useOSThemePreference'
import { isValidTheme, type Theme } from '@/constants/theme'
import { computed, type WritableComputedRef } from 'vue'
import { useColors } from 'vuestic-ui'

// Type-safe theme preset applicator
const safeApplyPreset = (theme: Theme) => {
	if (!isValidTheme(theme)) {
		console.warn(`Invalid theme: ${theme}`)
		return false
	}
	useColors().applyPreset(theme)
	return true
}

const themeToOsPreference = () => {
	const osTheme = useOSThemePreference()
	safeApplyPreset(osTheme.value)
	return osTheme.value
}

// Type-safe current preset name
const safeCurrentPresetName: WritableComputedRef<Theme> = computed({
	get: () => {
		const value = useColors().currentPresetName.value
		if (isValidTheme(value)) {
			return value
		}
		// This should never happen, but allows the return type to be safe
		console.error(
			`Invalid theme detected: "${value}". Resetting to OS preference: "${useOSThemePreference().value}".`
		)
		return themeToOsPreference()
	},
	set: (value: Theme) => {
		safeApplyPreset(value)
	}
})

export { safeApplyPreset, safeCurrentPresetName, themeToOsPreference }
