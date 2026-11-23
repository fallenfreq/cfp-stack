import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

// A component block (an element named with a hyphen, `layout-card`) puts its blocks in a box of
// its own or lets them step aside to an outer one, so a placed box straight in it sits on the
// wrong box (client/src/assets/sf-system.md, "Placing a box over another").
export const noOverInComponent: ElementRule = {
	name: 'no-over-in-component',
	type: 'problem',
	check(tree, report) {
		visit(tree, 'element', (element, _index, parent) => {
			if (parent?.type !== 'element' || !parent.tagName.includes('-')) return
			if ((element.properties.className ?? []).includes('sl-over'))
				report({
					message:
						'A placed box straight in a component block sits on the wrong box: put the block and it side by side in a plain block',
					nodes: [element],
				})
		})
	},
}
