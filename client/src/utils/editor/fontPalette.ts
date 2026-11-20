import { useThemeTokensStore } from '@/stores/themeTokensStore'
import {
	FONTS,
	LEADINGS,
	SIZES,
	TRACKINGS,
	type Leading,
	type LookSetting,
	type Size,
} from '@somefreq-app/shared/textLooks'
import { computed } from 'vue'

export interface FontOption {
	name: string // the slot's name, e.g. '1', 'lg'
	value: string // resolved value (full font-family string or rem size)
}

// The Font tool's looks, each a slot's name or none.
export const FONT_SETTINGS = [
	'fontFamily',
	'fontSize',
	'lineHeight',
	'letterSpacing',
] as const satisfies readonly LookSetting[]
export type FontSetting = (typeof FONT_SETTINGS)[number]
export type FontLooks = Record<FontSetting, string | null>

// Auto-pair: when a font size is picked, this leading is applied automatically.
// User can override with the leading chips afterwards.
export const SIZE_TO_LEADING: Record<Size, Leading> = {
	xs: 'normal',
	sm: 'normal',
	base: 'normal',
	lg: 'relaxed',
	xl: 'relaxed',
	'2xl': 'snug',
	'3xl': 'snug',
	'4xl': 'tight',
	'5xl': 'tight',
	'6xl': 'none',
	'7xl': 'none',
	'8xl': 'none',
	'9xl': 'none',
}

export function useFontPalette() {
	const store = useThemeTokensStore()

	// The theme's values for the fixed slots it sets.
	function buildPalette(prefix: string, slots: readonly string[]): FontOption[] {
		return store.rootTokens.flatMap((t) => {
			const name = t.name.slice(prefix.length)
			return t.name.startsWith(prefix) && slots.includes(name)
				? [{ name, value: t.value }]
				: []
		})
	}

	const families = computed(() => buildPalette('--sf-font-', FONTS))
	const sizes = computed(() => buildPalette('--sf-text-', SIZES))
	const leading = computed(() => buildPalette('--sf-leading-', LEADINGS))
	const tracking = computed(() => buildPalette('--sf-tracking-', TRACKINGS))

	return { families, sizes, leading, tracking }
}
