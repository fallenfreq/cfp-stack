import cssVariables from '@/../cssVariables'

export interface FontOption {
	cssVar: string // e.g. '--font-sans'
	value: string // resolved value (full font-family string or rem size)
	label: string // display name, e.g. 'sans', 'lg'
}

export interface FontStyleAttrs {
	fontFamily: string | null
	fontSize: string | null
	lineHeight: string | null
	letterSpacing: string | null
}

const SIZE_ORDER = [
	'xs',
	'sm',
	'base',
	'lg',
	'xl',
	'2xl',
	'3xl',
	'4xl',
	'5xl',
	'6xl',
	'7xl',
	'8xl',
	'9xl',
]
const LEADING_ORDER = ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose']
const TRACKING_ORDER = ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']

const entries = Object.entries(cssVariables.root)

function buildPalette(prefix: string, order: string[]): FontOption[] {
	return entries
		.filter(([k]) => k.startsWith(prefix))
		.map(([cssVar, value]) => ({ cssVar, value, label: cssVar.slice(prefix.length) }))
		.sort((a, b) => {
			const ai = order.indexOf(a.label)
			const bi = order.indexOf(b.label)
			return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
		})
}

export const FONT_FAMILIES = buildPalette('--font-', [])
export const FONT_SIZES = buildPalette('--text-', SIZE_ORDER)
export const LEADING_OPTIONS = buildPalette('--leading-', LEADING_ORDER)
export const TRACKING_OPTIONS = buildPalette('--tracking-', TRACKING_ORDER)

// Auto-pair: when a font size is picked, this leading is applied automatically.
// User can override with the leading chips afterwards.
export const SIZE_TO_LEADING: Record<string, string> = {
	'--text-xs': '--leading-normal',
	'--text-sm': '--leading-normal',
	'--text-base': '--leading-normal',
	'--text-lg': '--leading-relaxed',
	'--text-xl': '--leading-relaxed',
	'--text-2xl': '--leading-snug',
	'--text-3xl': '--leading-snug',
	'--text-4xl': '--leading-tight',
	'--text-5xl': '--leading-tight',
	'--text-6xl': '--leading-none',
	'--text-7xl': '--leading-none',
	'--text-8xl': '--leading-none',
	'--text-9xl': '--leading-none',
}

// Parse a stored CSS value like 'var(--font-sans)' → '--font-sans', or null.
export const parseFontVar = (value: string | null | undefined): string | null => {
	const m = value?.trim().match(/^var\(\s*(--[\w-]+)\s*\)$/)
	return m ? m[1]! : null
}
