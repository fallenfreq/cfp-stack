import { useThemeTokensStore } from '@/stores/themeTokensStore'
import { computed } from 'vue'

export interface PaletteShade {
	key: string
	cssVar: string
}

export interface PaletteFamily {
	key: string
	shades: PaletteShade[]
}

export type ParsedColor =
	| { kind: 'token'; cssVar: string; alpha: number }
	| { kind: 'rgba'; r: number; g: number; b: number; a: number }
	| null

export const formatRgba = (r: number, g: number, b: number, a = 1): string =>
	a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`

// Reactive palette built from store tokens. Family/shade extraction strips the
// --sf- prefix and splits trailing -N (e.g. --sf-primary-5 → family "primary",
// shade "5"). Semantic tokens with no -N (--sf-fg_primary) form their own
// single-shade family. Only `color-triplet` tokens are included.
export function useColorPalette() {
	const store = useThemeTokensStore()

	const TRIPLET = /^\s*\d+\s+\d+\s+\d+\s*$/

	const families = computed<PaletteFamily[]>(() => {
		const groups: Record<string, PaletteShade[]> = {}
		for (const tk of store.rootTokens) {
			if (tk.kind !== 'color-triplet') continue
			if (!tk.name.startsWith('--sf-')) continue
			if (!TRIPLET.test(tk.value)) continue // skip var() semantic aliases (e.g. --sf-primary)
			const name = tk.name.slice('--sf-'.length)
			const match = name.match(/^(.+)-(\d+)$/)
			const familyKey = match ? match[1]! : name
			const shadeKey = match ? match[2]! : name
			;(groups[familyKey] ??= []).push({ key: shadeKey, cssVar: tk.name })
		}
		return Object.entries(groups).map(([key, shades]) => ({
			key,
			shades: shades.sort((a, b) => (Number(a.key) || 0) - (Number(b.key) || 0)),
		}))
	})

	function findShade(cssVar: string): { family: PaletteFamily; shadeIndex: number } | null {
		for (const family of families.value) {
			const shadeIndex = family.shades.findIndex((s) => s.cssVar === cssVar)
			if (shadeIndex >= 0) return { family, shadeIndex }
		}
		return null
	}

	// Resolves an alpha string that is either a plain number ("0.2") or a CSS
	// var reference ("var(--sf-alpha-3)") to a 0–1 number. No value, or a var
	// with no numeric root token, resolves to 1 (full opacity).
	function resolveAlpha(raw: string | undefined): number {
		if (raw === undefined) return 1
		const varName = raw.match(/^var\((--[\w-]+)\)$/)?.[1]
		if (varName) {
			const token = store.rootTokens.find((t) => t.name === varName)
			const n = Number(token?.value)
			return isNaN(n) ? 1 : n
		}
		return Number(raw)
	}

	// Recognises the shapes cssVarColor / formatRgba emit. Anything else → null.
	function parseStoredValue(value: string | null | undefined): ParsedColor {
		const trimmed = value?.trim()
		if (!trimmed) return null

		// rgb(var(--name[, R G B])) | rgba(var(--name[, R G B]) / alpha)
		// alpha may be a plain number or a CSS var reference (e.g. var(--sf-alpha-3))
		const rgbVar = trimmed.match(
			/^rgba?\(\s*var\(\s*(--[\w-]+)\s*(?:,\s*[^)]+)?\)\s*(?:\/\s*([\d.]+|var\(--[\w-]+\)))?\s*\)$/i,
		)
		if (rgbVar) return { kind: 'token', cssVar: rgbVar[1]!, alpha: resolveAlpha(rgbVar[2]) }

		// rgb(r, g, b) | rgba(r, g, b, a) | rgb(r g b / a)
		const rgba = trimmed.match(
			/^rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i,
		)
		if (rgba) {
			return {
				kind: 'rgba',
				r: Number(rgba[1]),
				g: Number(rgba[2]),
				b: Number(rgba[3]),
				a: rgba[4] === undefined ? 1 : Number(rgba[4]),
			}
		}

		return null
	}

	return { families, findShade, parseStoredValue }
}
