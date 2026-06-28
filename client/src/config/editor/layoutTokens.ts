import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { computed } from 'vue'

// Hard-coded — no DB equivalent, layout-only opinions.
export const MAX_WIDTH: Record<string, string> = {
	xs: '20rem',
	sm: '24rem',
	md: '28rem',
	lg: '32rem',
	xl: '36rem',
	'2xl': '42rem',
	'3xl': '48rem',
	full: '100%',
}

export const SPLIT_TEMPLATES: Record<string, string> = {
	'1/4': '1fr 3fr',
	'1/3': '1fr 2fr',
	'2/5': '2fr 3fr',
	'1/2': '1fr 1fr',
	'3/5': '3fr 2fr',
	'2/3': '2fr 1fr',
	'3/4': '3fr 1fr',
}

// Reactive options derived from the token store — change when themes do.
export function useLayoutTokens() {
	const store = useThemeTokensStore()

	const keysWithPrefix = (prefix: string): string[] =>
		store.rootTokens
			.filter((t) => t.name.startsWith(prefix))
			.map((t) => t.name.slice(prefix.length))

	const radiusOptions = computed(() => keysWithPrefix('--sf-radius-'))
	const radius = computed<Record<string, string>>(() =>
		Object.fromEntries(radiusOptions.value.map((k) => [k, `var(--sf-radius-${k})`])),
	)

	// '--sf-shadow-opacity' is a theme-character knob, not a shape — exclude.
	const shadowOptions = computed(() =>
		keysWithPrefix('--sf-shadow-').filter((k) => k !== 'opacity'),
	)

	const spacingOptions = computed(() => keysWithPrefix('--sf-spacing-'))
	const spacing = computed<Record<string, string>>(() =>
		Object.fromEntries(spacingOptions.value.map((k) => [k, `var(--sf-spacing-${k})`])),
	)

	const breakpointOptions = computed(() => store.collapseThresholds.map((t) => t.name))
	// 'never' is a sentinel meaning do not collapse; followed by collapse threshold names
	// in DB order (which the seed inserts ascending).
	const collapseOptions = computed(() => ['never', ...breakpointOptions.value])

	return {
		radiusOptions,
		radius,
		shadowOptions,
		spacingOptions,
		spacing,
		breakpointOptions,
		collapseOptions,
	}
}
