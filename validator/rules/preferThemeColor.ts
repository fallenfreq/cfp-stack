import { type CssNode, lexer, walk } from '@eslint/css-tree'
import type { CssRule } from '../core.ts'

// Not a colour of its own: none, or the colour of the text around it.
const notFixed = new Set(['transparent', 'currentcolor'])

const isFixed = (color: CssNode) =>
	!(color.type === 'Identifier' && notFixed.has(color.name.toLowerCase()))

export const preferThemeColor: CssRule = {
	name: 'prefer-theme-color',
	type: 'suggestion',
	check(tree, report) {
		walk(tree, (declaration) => {
			if (declaration.type !== 'Declaration' || declaration.value.type !== 'Value') return
			const { value } = declaration
			// The colours in it, as CSS's grammar for the property reads it, so a font named Red isn't
			// one. A custom property has no grammar: it's a colour if its whole value is one. A value
			// holding a variable can't be matched, so it's left out.
			const colors: CssNode[] = []
			const custom = declaration.property.startsWith('--')
			const match = custom
				? lexer.matchType('color', value)
				: lexer.matchProperty(declaration.property, value)
			if (match.matched)
				walk(value, {
					enter(node: CssNode) {
						if (node === value || !(custom || match.isType(node, 'color'))) return
						colors.push(node)
						return walk.skip
					},
				})
			if (colors.some(isFixed))
				report({
					message: "A fixed colour doesn't change with the theme: use a theme colour",
					nodes: [declaration],
				})
		})
	},
}
