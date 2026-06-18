import cssVariables from '@/../cssVariables'

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

const entries = Object.entries(cssVariables.root)

function buildPalette(prefix: string): FontOption[] {
	return entries
		.filter(([k]) => k.startsWith(prefix))
		.map(([cssVar, value]) => ({ cssVar, value, label: cssVar.slice(prefix.length) }))
}

export const FONT_FAMILIES = buildPalette('--sf-font-')
export const FONT_SIZES = buildPalette('--sf-text-')
export const LEADING_OPTIONS = buildPalette('--sf-leading-')
export const TRACKING_OPTIONS = buildPalette('--sf-tracking-')

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
