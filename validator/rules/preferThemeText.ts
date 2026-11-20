import { property, walk } from '@eslint/css-tree'
import { LOOK_SETTINGS, LOOKS } from '@somefreq-app/shared/textLooks'
import type { CssRule } from '../core.ts'
import { isOwnValue } from '../ownValue.ts'

// The CSS property of each text look, taken from the looks list so a new look is checked too.
// Colour is left to prefer-theme-color.
const lookNamesByProperty = new Map<string, string>(
	LOOK_SETTINGS.flatMap((setting): [string, string][] => {
		const { property, displayName } = LOOKS[setting]
		return property && setting !== 'color' ? [[property, displayName]] : []
	}),
)

// `font` sets a font, size and line height in one, and no pick takes it out.
const fontMessage =
	"`font` sets a font, size and line height of its own: take it off in the code view, then pick the theme's"

export const preferThemeText: CssRule = {
	name: 'prefer-theme-text',
	type: 'suggestion',
	check(tree, report) {
		walk(tree, (declaration) => {
			if (declaration.type !== 'Declaration') return
			const { name } = property(declaration.property)
			const lookName = lookNamesByProperty.get(name)
			if (!(lookName || name === 'font') || !isOwnValue(declaration.value)) return
			report({
				message: lookName
					? `A ${lookName} of its own isn't the theme's: use a theme ${lookName}`
					: fontMessage,
				nodes: [declaration],
			})
		})
	},
}
