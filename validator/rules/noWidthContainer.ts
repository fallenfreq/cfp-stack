import { keyword, property, walk } from '@eslint/css-tree'
import type { CssRule } from '../core.ts'

// What makes a box take no width from its content: a width container's type, or the size
// containment one has, which `contain` gives without the container.
const sizeKinds: Record<string, readonly string[]> = {
	'container-type': ['size', 'inline-size'],
	contain: ['size', 'inline-size', 'strict'],
}

export const noWidthContainer: CssRule = {
	name: 'no-width-container',
	type: 'problem',
	check(tree, report) {
		walk(tree, (declaration) => {
			if (declaration.type !== 'Declaration' || declaration.value.type !== 'Value') return
			const name = property(declaration.property).basename
			let words = [...declaration.value.children]
			// The shorthand is a name, then its type after a slash: `container: card / inline-size`.
			if (name === 'container') {
				const slash = words.findIndex(
					(word) => word.type === 'Operator' && word.value === '/',
				)
				words = slash < 0 ? [] : words.slice(slash + 1)
			}
			const kinds = sizeKinds[name === 'container' ? 'container-type' : name]
			if (
				kinds
				&& words.some(
					(word) =>
						word.type === 'Identifier' && kinds.includes(keyword(word.name).basename),
				)
			)
				report({
					message:
						"This box takes no width from its content, so it's 0 wide where its width comes from its content (a cluster, a table cell)",
					nodes: [declaration],
				})
		})
	},
}
