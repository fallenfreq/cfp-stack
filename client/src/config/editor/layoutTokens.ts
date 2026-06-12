import cssVariables from '@/../cssVariables'

function extractTokens(prefix: string): readonly string[] {
	return Object.keys(cssVariables.root)
		.filter((k) => k.startsWith(prefix))
		.map((k) => k.slice(prefix.length))
}

export const RADIUS_OPTIONS = extractTokens('--radius-')
export const RADIUS: Record<string, string> = Object.fromEntries(
	RADIUS_OPTIONS.map((k) => [k, `var(--radius-${k})`]),
)

export const SPACING_OPTIONS = extractTokens('--spacing-')
export const SPACING: Record<string, string> = Object.fromEntries(
	SPACING_OPTIONS.map((k) => [k, `var(--spacing-${k})`]),
)

export const BREAKPOINT_OPTIONS = extractTokens('--breakpoint-')
// 'never' is a sentinel meaning do not collapse; CSS breakpoints follow in base.css order.
export const COLLAPSE_OPTIONS: readonly string[] = ['never', ...BREAKPOINT_OPTIONS]

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
