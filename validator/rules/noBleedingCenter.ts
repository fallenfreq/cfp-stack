import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

export const noBleedingCenter: ElementRule = {
	name: 'no-bleeding-center',
	type: 'problem',
	check(tree, report) {
		visit(tree, 'element', (element) => {
			const classes = element.properties.className ?? []
			if (classes.includes('sl-center') && classes.includes('sl-bleed'))
				report({
					message: "A centred column can't also bleed: set a block around it to bleed",
					elements: [element],
				})
		})
	},
}
