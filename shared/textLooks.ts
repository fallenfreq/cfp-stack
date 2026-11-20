// The looks text can take, each one of the theme's fixed slots (client/src/assets/sf-system.md,
// "Tokens") written as a class, and which spans are text's looks. The text style mark, the Font
// tool and the code view's check read them here, as the validator will, so each tells a look from
// a span's own class the same way. By slot, not prefix: sf-text-block is a wrapper, not a size.

export const FONTS = ['1', '2', '3', 'mono'] as const
export const SIZES = [
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
] as const
export const LEADINGS = ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'] as const
export const TRACKINGS = ['tight', 'normal', 'wide'] as const
export const ALPHAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export type Size = (typeof SIZES)[number]
export type Leading = (typeof LEADINGS)[number]

// Each setting a look on text sets, in the order its classes are written.
export const LOOK_SETTINGS = [
	'color',
	'alpha',
	'fontFamily',
	'fontSize',
	'lineHeight',
	'letterSpacing',
] as const

export type LookSetting = (typeof LOOK_SETTINGS)[number]

interface Look {
	// What its class starts with.
	prefix: string
	// Its slots' names; a colour's are the theme's own.
	slots: readonly string[] | null
	// The CSS property it sets, which a look picked takes out of a style; a step sets none.
	property: string | null
	// What it's called to the author: in the validator's messages and the Font tool's sections.
	displayName: string
}

export const LOOKS = {
	color: { prefix: 'sf-color-', slots: null, property: 'color', displayName: 'colour' },
	alpha: { prefix: 'sf-color-alpha-', slots: ALPHAS, property: null, displayName: 'colour step' },
	fontFamily: { prefix: 'sf-font-', slots: FONTS, property: 'font-family', displayName: 'font' },
	fontSize: { prefix: 'sf-text-', slots: SIZES, property: 'font-size', displayName: 'font size' },
	lineHeight: {
		prefix: 'sf-leading-',
		slots: LEADINGS,
		property: 'line-height',
		displayName: 'line height',
	},
	letterSpacing: {
		prefix: 'sf-tracking-',
		slots: TRACKINGS,
		property: 'letter-spacing',
		displayName: 'letter spacing',
	},
} as const satisfies Record<LookSetting, Look>

// The setting a class is a look for, and its slot's name, or null when it isn't a look.
export const readLook = (className: string): { setting: LookSetting; name: string } | null => {
	for (const setting of LOOK_SETTINGS) {
		const { prefix, slots }: Look = LOOKS[setting]
		if (!className.startsWith(prefix)) continue
		const name = className.slice(prefix.length)
		if (slots ? slots.includes(name) : name && !className.startsWith(LOOKS.alpha.prefix))
			return { setting, name }
	}
	return null
}

// The looks in a class list, the first of each setting.
export const looksIn = (classes: string): Partial<Record<LookSetting, string>> => {
	const looks: Partial<Record<LookSetting, string>> = {}
	for (const className of classes.split(/\s+/)) {
		const look = readLook(className)
		if (look) looks[look.setting] ??= look.name
	}
	return looks
}

export const lookClass = (setting: LookSetting, name: string) => `${LOOKS[setting].prefix}${name}`

const LOOK_PROPERTIES: string[] = LOOK_SETTINGS.flatMap((setting) => LOOKS[setting].property ?? [])

// Whether a style property is one a look sets (`color`, `font-size`), as a reader of CSS names it.
export const isLookProperty = (property: string) => LOOK_PROPERTIES.includes(property)

// Whether a span is text's looks, not a span block: no id, and everything on it a look, with at
// least one (a step only beside a colour class). Its style's properties come from the reader's own
// reading of CSS (the browser's, CSSTree's).
export const isTextLooks = (span: { hasId: boolean; classes: string[]; properties: string[] }) => {
	if (span.hasId) return false
	const settings = span.classes.map((className) => readLook(className)?.setting)
	if (settings.includes(undefined)) return false
	if (settings.includes('alpha') && !settings.includes('color')) return false
	if (!span.properties.every(isLookProperty)) return false
	return settings.length + span.properties.length > 0
}
