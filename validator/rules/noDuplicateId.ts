import type { Element } from 'hast'
import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

export const noDuplicateId: ElementRule = {
	name: 'no-duplicate-id',
	type: 'problem',
	check(tree, report) {
		// Ids are compared as a link finds them, exactly: #Intro doesn't go to intro. The walk is
		// in page order, so each id's first element is the one a link goes to.
		const elementsById = new Map<string, [Element, ...Element[]]>()
		visit(tree, 'element', (element) => {
			const { id } = element.properties
			if (!id) return
			const elements = elementsById.get(id)
			if (elements) elements.push(element)
			else elementsById.set(id, [element])
		})
		for (const [id, elements] of elementsById)
			if (elements.length > 1)
				report({
					message: `${elements.length} blocks share the id "${id}"`,
					nodes: elements,
				})
	},
}
