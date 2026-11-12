import {
	COLLAPSE_HOSTS,
	COLLAPSE_PREFIX,
	COLLAPSING_LAYOUTS,
	COLUMN_LAYOUTS,
} from '@somefreq-app/shared/layouts'
import type { Element } from 'hast'
import { visitParents } from 'unist-util-visit-parents'
import type { ElementRule } from '../core.ts'

const hosts = new Set<string>(COLLAPSE_HOSTS)
const collapsing = new Set<string>(COLLAPSING_LAYOUTS)
const columnLayouts = new Set<string>(COLUMN_LAYOUTS)
const classesOf = (element: Element) => element.properties.className ?? []

export const noCollapseStraightInColumns: ElementRule = {
	name: 'no-collapse-straight-in-columns',
	type: 'problem',
	check(tree, report) {
		visitParents(tree, 'element', (element, ancestors) => {
			const classes = classesOf(element)
			if (
				!classes.some((name) => collapsing.has(name))
				|| !classes.some((name) => name.startsWith(COLLAPSE_PREFIX))
			)
				return
			// What collapses measures the nearest layout around it that measures. Two rarer cases of
			// the collapse layer aren't followed: a layout in a spot sized by its content doesn't
			// measure, and none outside a popover measures for what's in it.
			const measured = ancestors
				.filter((ancestor) => ancestor.type === 'element')
				.reverse()
				.find((ancestor) => classesOf(ancestor).some((name) => hosts.has(name)))
			// The message doesn't name the layout around: it may be a block's own, which the page
			// builder never typed (a to-do item is a split).
			if (measured && classesOf(measured).some((name) => columnLayouts.has(name)))
				report({
					message:
						"Stacks by the width of the whole layout around it, not its column's: put it in an sl-stack in the column",
					nodes: [element],
				})
		})
	},
}
