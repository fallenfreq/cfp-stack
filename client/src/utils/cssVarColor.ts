import cssVariables from '@/../cssVariables'

// CSS variables in this project hold space-separated RGB triplets (e.g. "16 185 129"),
// so they must be wrapped in rgb()/rgba() to produce a valid color value.
// Inlining the resolved triplet as a var() fallback keeps the color portable when
// the variable isn't defined (e.g. content rendered outside the app's CSS scope).
export const cssVarColor = (cssVar: string, alpha = 1): string => {
	const fallback = (cssVariables.root[cssVar] ?? '').trim()
	const fallbackPart = fallback ? `, ${fallback}` : ''
	if (alpha >= 1) return `rgb(var(${cssVar}${fallbackPart}))`
	return `rgba(var(${cssVar}${fallbackPart}) / ${alpha})`
}
