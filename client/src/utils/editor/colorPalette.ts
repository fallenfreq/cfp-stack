import cssVariables from '@/../cssVariables'

export interface PaletteShade {
	key: string
	cssVar: string
}

export interface PaletteFamily {
	key: string
	shades: PaletteShade[]
}

const TRIPLET = /^\s*\d+\s+\d+\s+\d+\s*$/

// Every key in cssVariables.root is a real CSS variable — pre-resolved at build.
// We filter to colors (RGB-triplet values) and group by family.
export const PALETTE_FAMILIES: PaletteFamily[] = (() => {
	const groups: Record<string, PaletteShade[]> = {}
	for (const [cssVar, value] of Object.entries(cssVariables.root)) {
		if (!TRIPLET.test(value)) continue
		const name = cssVar.slice(2)
		const match = name.match(/^(.+)-(\d+)$/)
		const familyKey = match ? match[1]! : name
		const shadeKey = match ? match[2]! : name
		;(groups[familyKey] ??= []).push({ key: shadeKey, cssVar })
	}
	return Object.entries(groups).map(([key, shades]) => {
		const numericShades = shades.filter((s) => /^\d+$/.test(s.key))
		return {
			key,
			shades: (numericShades.length > 0 ? numericShades : shades).sort(
				(a, b) => (Number(a.key) || 0) - (Number(b.key) || 0),
			),
		}
	})
})()

export const findShade = (cssVar: string): { family: PaletteFamily; shadeIndex: number } | null => {
	for (const family of PALETTE_FAMILIES) {
		const shadeIndex = family.shades.findIndex((s) => s.cssVar === cssVar)
		if (shadeIndex >= 0) return { family, shadeIndex }
	}
	return null
}

export const formatRgba = (r: number, g: number, b: number, a = 1): string =>
	a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`

export type ParsedColor =
	| { kind: 'token'; cssVar: string; alpha: number }
	| { kind: 'rgba'; r: number; g: number; b: number; a: number }
	| null

// Recognises the shapes cssVarColor / formatRgba emit. Anything else returns null.
export const parseStoredValue = (value: string | null | undefined): ParsedColor => {
	const trimmed = value?.trim()
	if (!trimmed) return null

	// rgb(var(--name[, R G B])) | rgba(var(--name[, R G B]) / alpha)
	const rgbVar = trimmed.match(
		/^rgba?\(\s*var\(\s*(--[\w-]+)\s*(?:,\s*[^)]+)?\)\s*(?:\/\s*([\d.]+))?\s*\)$/i,
	)
	if (rgbVar) {
		return {
			kind: 'token',
			cssVar: rgbVar[1]!,
			alpha: rgbVar[2] === undefined ? 1 : Number(rgbVar[2]),
		}
	}

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
