import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

// What's true of a placed box, so the theme can draw it as floating
// (client/src/assets/sf-system.md, "Placing a box over another").
export const preferOverlayOnOver: ElementRule = {
	name: 'prefer-overlay-on-over',
	type: 'suggestion',
	check(tree, report) {
		visit(tree, 'element', (element) => {
			const classes = element.properties.className ?? []
			if (classes.includes('sl-over') && !classes.includes('sf-is-overlay'))
				report({
					message:
						'A placed box usually wears sf-is-overlay too, so the theme can draw it as floating',
					nodes: [element],
				})
		})
	},
}
