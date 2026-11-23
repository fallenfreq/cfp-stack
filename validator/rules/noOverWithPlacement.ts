import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

// Each sets the position, margins or grid place sl-over sets, so one loses by the stylesheet's
// order (client/src/assets/sf-system.md, "Placing a box over another"). Measured: a pin never
// sticks, a centred column or a block bleeding in a page loses its corner, a row its columns.
const places = (name: string) =>
	name.startsWith('sl-pin-') || name === 'sl-bleed' || name === 'sl-center' || name === 'sl-row'

export const noOverWithPlacement: ElementRule = {
	name: 'no-over-with-placement',
	type: 'problem',
	check(tree, report) {
		visit(tree, 'element', (element) => {
			const classes = element.properties.className ?? []
			if (!classes.includes('sl-over')) return
			for (const name of classes.filter((c) => typeof c === 'string' && places(c)))
				report({
					message: `A placed box (sl-over) can't also wear ${name}: both place the box and one loses. Put ${name} on a box around or inside it`,
					nodes: [element],
				})
		})
	},
}
