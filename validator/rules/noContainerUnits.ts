import { walk } from '@eslint/css-tree'
import type { CssRule } from '../core.ts'

const containerUnits = new Set(['cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax'])

export const noContainerUnits: CssRule = {
	name: 'no-container-units',
	type: 'problem',
	check(tree, report) {
		walk(tree, (node) => {
			if (node.type === 'Dimension' && containerUnits.has(node.unit.toLowerCase()))
				report({
					message: `${node.unit} measures a container the system places, not one you choose`,
					nodes: [node],
				})
		})
	},
}
