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

const entries = Object.entries(cssVariables.root)

function buildPalette(prefix: string): FontOption[] {
	return entries
		.filter(([k]) => k.startsWith(prefix))
		.map(([cssVar, value]) => ({ cssVar, value, label: cssVar.slice(prefix.length) }))
}

export const FONT_FAMILIES = buildPalette('--font-')
export const FONT_SIZES = buildPalette('--text-')
export const LEADING_OPTIONS = buildPalette('--leading-')
export const TRACKING_OPTIONS = buildPalette('--tracking-')

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
