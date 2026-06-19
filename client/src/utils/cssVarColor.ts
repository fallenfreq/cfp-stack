import { useThemeTokensStore } from '@/stores/themeTokensStore'

// CSS variables in this project hold space-separated RGB triplets
// (e.g. "16 185 129"), so they must be wrapped in rgb()/rgba() to produce a
// valid color value. Inlining the resolved triplet as a var() fallback keeps
// the color portable when the variable isn't defined (e.g. content rendered
// outside the app's CSS scope).
//
// Reads the live token store, so theme switches naturally update the fallback
// the next time content is generated. Called from `<script setup>` and TipTap
// extensions — both run after pinia is installed in main.ts.
export const cssVarColor = (cssVar: string, alpha = 1): string => {
	const store = useThemeTokensStore()
	const token = store.rootTokens.find((t) => t.name === cssVar)
	const fallback = token?.value.trim() ?? ''
	const fallbackPart = fallback ? `, ${fallback}` : ''
	if (alpha >= 1) return `rgb(var(${cssVar}${fallbackPart}))`
	return `rgba(var(${cssVar}${fallbackPart}) / ${alpha})`
}
