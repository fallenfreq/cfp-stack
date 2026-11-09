import { HEADING_CLASS } from '@somefreq-app/shared/headings'
import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

const headings = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const list = new Intl.ListFormat('en-GB')

export const validHeadingClass: ElementRule = {
	name: 'valid-heading-class',
	type: 'problem',
	check(tree, report) {
		visit(tree, 'element', (element) => {
			// A class worn twice is one prominence.
			const worn = new Set(
				(element.properties.className ?? []).filter((name) => HEADING_CLASS.test(name)),
			)
			if (!worn.size) return
			if (!headings.has(element.tagName))
				report({
					message: `A heading's look (${list.format(worn)}) on what isn't a heading: larger body text takes a text size`,
					nodes: [element],
				})
			else if (worn.size > 1)
				report({
					message: `One heading has ${worn.size} prominences: ${list.format(worn)}`,
					nodes: [element],
				})
		})
	},
}
