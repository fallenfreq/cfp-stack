import { ARRANGEMENTS } from '@somefreq-app/shared/layouts'
import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

const arrangements = new Set<string>(ARRANGEMENTS)
const list = new Intl.ListFormat('en-GB')

export const oneArrangementPerBox: ElementRule = {
	name: 'one-arrangement-per-box',
	type: 'problem',
	check(tree, report) {
		visit(tree, 'element', (element) => {
			// A class worn twice is one arrangement: a component's own, typed on its block too.
			const worn = new Set(
				(element.properties.className ?? []).filter((name) => arrangements.has(name)),
			)
			if (worn.size > 1)
				report({
					message: `One block has ${worn.size} arrangements: ${list.format(worn)}`,
					elements: [element],
				})
		})
	},
}
