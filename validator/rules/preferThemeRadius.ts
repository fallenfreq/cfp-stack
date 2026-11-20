import { type CssNode, property, walk } from '@eslint/css-tree'
import { CORNER_PROPERTIES } from '@somefreq-app/shared/corners'
import type { CssRule } from '../core.ts'
import { isOwnValue } from '../ownValue.ts'

const corners = new Set<string>(CORNER_PROPERTIES)

// A size other than 0: square is square in every theme, so 0 can't fall out of step with one.
const isSize = (node: CssNode) =>
	(node.type === 'Dimension' || node.type === 'Percentage') && Number(node.value) !== 0

export const preferThemeRadius: CssRule = {
	name: 'prefer-theme-radius',
	type: 'suggestion',
	check(tree, report) {
		walk(tree, (declaration) => {
			if (declaration.type !== 'Declaration') return
			// By its name without a vendor's prefix, as the browser reads -webkit-border-radius.
			if (!corners.has(property(declaration.property).basename)) return
			if (!isOwnValue(declaration.value)) return
			let hasSize = false
			walk(declaration.value, (node) => {
				if (isSize(node)) hasSize = true
			})
			if (hasSize)
				report({
					message: "A fixed corner size doesn't change with the theme: use a theme size",
					nodes: [declaration],
				})
		})
	},
}
