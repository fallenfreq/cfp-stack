import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { computed } from 'vue'

export interface FontOption {
	cssVar: string // e.g. '--sf-font-1'
	value: string // resolved value (full font-family string or rem size)
	label: string // display name, e.g. '1', 'lg'
}

export interface FontStyleAttrs {
	fontFamily: string | null
	fontSize: string | null
	lineHeight: string | null
	letterSpacing: string | null
}

// Auto-pair: when a font size is picked, this leading is applied automatically.
// User can override with the leading chips afterwards.
export const SIZE_TO_LEADING: Record<string, string> = {
	'--sf-text-xs': '--sf-leading-normal',
	'--sf-text-sm': '--sf-leading-normal',
	'--sf-text-base': '--sf-leading-normal',
	'--sf-text-lg': '--sf-leading-relaxed',
	'--sf-text-xl': '--sf-leading-relaxed',
	'--sf-text-2xl': '--sf-leading-snug',
	'--sf-text-3xl': '--sf-leading-snug',
	'--sf-text-4xl': '--sf-leading-tight',
	'--sf-text-5xl': '--sf-leading-tight',
	'--sf-text-6xl': '--sf-leading-none',
	'--sf-text-7xl': '--sf-leading-none',
	'--sf-text-8xl': '--sf-leading-none',
	'--sf-text-9xl': '--sf-leading-none',
}

// Parse a stored CSS value like 'var(--sf-font-1)' → '--sf-font-1', or null.
export const parseFontVar = (value: string | null | undefined): string | null => {
	const m = value?.trim().match(/^var\(\s*(--[\w-]+)\s*\)$/)
	return m ? m[1]! : null
}

export function useFontPalette() {
	const store = useThemeTokensStore()

	function buildPalette(prefix: string): FontOption[] {
		return store.rootTokens
			.filter((t) => t.name.startsWith(prefix))
			.map((t) => ({
				cssVar: t.name,
				value: t.value,
				label: t.name.slice(prefix.length),
			}))
	}

	const families = computed(() => buildPalette('--sf-font-'))
	const sizes = computed(() => buildPalette('--sf-text-'))
	const leading = computed(() => buildPalette('--sf-leading-'))
	const tracking = computed(() => buildPalette('--sf-tracking-'))

	return { families, sizes, leading, tracking }
}
