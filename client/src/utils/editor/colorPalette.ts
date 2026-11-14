import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { computed } from 'vue'

/**
 * A theme colour as its names, kept from the class it's read from to the class it's written as:
 * `primary-5` and see-through step `3` are `sf-color-primary-5 sf-color-alpha-3` on text. Never a
 * colour value, so nothing has to be read back (client/src/assets/sf-system.md, "Colours and
 * alpha").
 */
export interface ThemeColor {
	/** The colour's name in the theme: its variable without `--sf-` (`primary-5`, `danger`). */
	color: string
	/** The see-through step's name (`3` for `--sf-alpha-3`), or null for solid. */
	alpha: string | null
}

export interface PaletteShade {
	key: string
	/** The colour's name in the theme (`primary-5`). */
	name: string
}

export interface PaletteFamily {
	key: string
	shades: PaletteShade[]
}

export interface AlphaStep {
	/** The step's name (`3` for `--sf-alpha-3`). */
	name: string
	label: string
}

/** The colour a theme colour paints, for a swatch. Its variables, so the theme draws it. */
export const swatchColor = ({ color, alpha }: ThemeColor): string =>
	alpha ? `rgb(var(--sf-${color}) / var(--sf-alpha-${alpha}))` : `rgb(var(--sf-${color}))`

/** A theme colour from a block's classes, by the prefix of its kind (`sf-bg-`, `sf-shadow-color-`). */
export const readThemeColor = (
	classes: string,
	colorPrefix: string,
	alphaPrefix: string,
): ThemeColor | null => {
	// A prefix with no name after it (`sf-color-`) names no colour or step.
	const names = classes.split(/\s+/)
	const color = names.find(
		(c) => c.startsWith(colorPrefix) && !c.startsWith(alphaPrefix) && c !== colorPrefix,
	)
	if (!color) return null
	const alpha = names.find((c) => c.startsWith(alphaPrefix) && c !== alphaPrefix)
	return {
		color: color.slice(colorPrefix.length),
		alpha: alpha ? alpha.slice(alphaPrefix.length) : null,
	}
}

/** A theme colour's classes, by the prefix of its kind. */
export const themeColorClasses = (
	{ color, alpha }: ThemeColor,
	colorPrefix: string,
	alphaPrefix: string,
): string[] => [`${colorPrefix}${color}`, ...(alpha ? [`${alphaPrefix}${alpha}`] : [])]

const TRIPLET = /^\s*\d+\s+\d+\s+\d+\s*$/
const ALPHA = /^--sf-alpha-(\d+)$/

// The theme's colours and see-through steps, from its tokens. A colour is a family and a shade:
// `--sf-primary-5` is family `primary`, shade `5`; one with no number (`--sf-fg_primary`) is a
// family of one. Only colours the theme makes classes for: a token pointing at another
// (`--sf-primary: var(--sf-primary-5)`) has none.
export function useColorPalette() {
	const store = useThemeTokensStore()

	const families = computed<PaletteFamily[]>(() => {
		const groups: Record<string, PaletteShade[]> = {}
		for (const tk of store.rootTokens) {
			if (tk.kind !== 'color-triplet') continue
			if (!tk.name.startsWith('--sf-')) continue
			if (!TRIPLET.test(tk.value)) continue
			const name = tk.name.slice('--sf-'.length)
			const match = name.match(/^(.+)-(\d+)$/)
			const familyKey = match ? match[1]! : name
			const shadeKey = match ? match[2]! : name
			;(groups[familyKey] ??= []).push({ key: shadeKey, name })
		}
		return Object.entries(groups).map(([key, shades]) => ({
			key,
			shades: shades.sort((a, b) => (Number(a.key) || 0) - (Number(b.key) || 0)),
		}))
	})

	// Most see-through first, as the slider runs to solid.
	const alphaSteps = computed<AlphaStep[]>(() =>
		store.rootTokens
			.flatMap((tk) => {
				const name = tk.name.match(ALPHA)?.[1]
				const value = Number(tk.value)
				return name && !isNaN(value) ? [{ name, value }] : []
			})
			.sort((a, b) => a.value - b.value)
			.map(({ name, value }) => ({ name, label: `${Math.round(value * 100)}%` })),
	)

	function findShade(name: string): { family: PaletteFamily; shadeIndex: number } | null {
		for (const family of families.value) {
			const shadeIndex = family.shades.findIndex((s) => s.name === name)
			if (shadeIndex >= 0) return { family, shadeIndex }
		}
		return null
	}

	return { families, alphaSteps, findShade }
}
