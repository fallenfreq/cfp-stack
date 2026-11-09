import { FILLS, GAP_LAYOUTS, SHAPES } from '@somefreq-app/shared/layouts'
import type { Element } from 'hast'
import { visitParents } from 'unist-util-visit-parents'
import type { ElementRule } from '../core.ts'

const shapes = new Set<string>(Object.keys(SHAPES))
const fills = new Set<string>(Object.keys(FILLS))
const layouts = new Set<string>(GAP_LAYOUTS)
const classesOf = (element: Element) => element.properties.className ?? []

// A shape with a fill: on a picture, it fills its box's width at the shape's height; on a frame,
// the picture that's its only block covers it.
const shapedAndFilled = (element: Element) =>
	classesOf(element).some((name) => shapes.has(name))
	&& classesOf(element).some((name) => fills.has(name))

// A component block (an element named with a hyphen, `layout-card`, as HTML names its own
// elements) keeps its blocks in a box of its own, which a fill doesn't reach, unless a layout
// makes them its items (client/src/assets/sf-system.md, "A picture's space before it loads").
const keepsItsOwnBox = (element: Element) =>
	element.tagName.includes('-') && !classesOf(element).some((name) => layouts.has(name))

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
			const framed =
				frame?.type === 'element'
				&& shapedAndFilled(frame)
				&& frame.children.filter((child) => child.type === 'element').length === 1
			if (framed && !keepsItsOwnBox(frame)) return
			report({
				message: framed
					? "This block's shape and fill don't reach its picture: give the block a layout such as Stack, or put the shape and fill on the picture"
					: 'The page jumps when this picture loads: give it its width and height, or a shape with a fill',
				nodes: [element],
			})
		})
	},
}
