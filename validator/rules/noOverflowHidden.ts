import { keyword, property, walk } from '@eslint/css-tree'
import type { CssRule } from '../core.ts'

const overflows = new Set([
	'overflow',
	'overflow-x',
	'overflow-y',
	'overflow-inline',
	'overflow-block',
])

export const noOverflowHidden: CssRule = {
	name: 'no-overflow-hidden',
	type: 'problem',
	check(tree, report) {
		walk(tree, (declaration) => {
			if (
				declaration.type === 'Declaration'
				&& declaration.value.type === 'Value'
				&& overflows.has(property(declaration.property).basename)
				&& [...declaration.value.children].some(
					(word) =>
						word.type === 'Identifier' && keyword(word.name).basename === 'hidden',
				)
			)
				report({
					message:
						'overflow: hidden makes this box a scroll area, so a pinned block inside stops sticking: use overflow: clip',
					nodes: [declaration],
				})
		})
	},
}
