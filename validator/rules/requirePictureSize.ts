import { FILLS, SHAPES } from '@somefreq-app/shared/layouts'
import type { Element } from 'hast'
import { visitParents } from 'unist-util-visit-parents'
import type { ElementRule } from '../core.ts'

const shapes = new Set<string>(Object.keys(SHAPES))
const fills = new Set<string>(Object.keys(FILLS))

// A shape with a fill: on a picture, it fills its box's width at the shape's height; on a frame,
// the picture that's its only block covers it.
const shapedAndFilled = (element: Element) => {
	const classes = element.properties.className ?? []
	return classes.some((name) => shapes.has(name)) && classes.some((name) => fills.has(name))
}

export const requirePictureSize: ElementRule = {
	name: 'require-picture-size',
	type: 'problem',
	check(tree, report) {
		visitParents(tree, 'element', (element, ancestors) => {
			if (element.tagName !== 'img') return
			// Numbers, as only whole numbers give the browser the file's shape (not "100%" or "auto").
			const { width, height } = element.properties
			if (typeof width === 'number' && typeof height === 'number') return
			if (shapedAndFilled(element)) return
			const frame = ancestors.at(-1)
			if (
				frame?.type === 'element'
				&& shapedAndFilled(frame)
				&& frame.children.filter((child) => child.type === 'element').length === 1
			)
				return
			report({
				message:
					'The page jumps when this picture loads: give it its width and height, or a shape with a fill',
				nodes: [element],
			})
		})
	},
}
