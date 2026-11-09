import { type CssNode, type FunctionNode, type Value, walk } from '@eslint/css-tree'
import { CHANNELS } from '@somefreq-app/shared/layouts'
import type { CssRule } from '../core.ts'

const channels = new Set<string>(CHANNELS)
const isVar = (node: FunctionNode) => node.name.toLowerCase() === 'var'

export const requireChannelFallback: CssRule = {
	name: 'require-channel-fallback',
	type: 'problem',
	check(tree, report) {
		walk(tree, (declaration) => {
			if (declaration.type !== 'Declaration' || declaration.value.type !== 'Value') return
			// A var() that is the whole value, or the whole fallback of one that is: unset, the
			// property takes its initial value, no spacing, which is what a reader with no default
			// means. In a larger value, unset drops all of it.
			const whole = new Set<CssNode>()
			const onlyOf = (value: Value) =>
				value.children.size === 1 ? value.children.first : null
			let only = onlyOf(declaration.value)
			while (only?.type === 'Function' && isVar(only)) {
				whole.add(only)
				const fallback = only.children.last
				only = fallback?.type === 'Value' ? onlyOf(fallback) : null
			}
			walk(declaration.value, (part) => {
				if (part.type !== 'Function' || !isVar(part) || whole.has(part)) return
				const [name, ...fallback] = part.children
				if (name?.type !== 'Identifier' || !channels.has(name.name) || fallback.length)
					return
				report({
					message: `With no ${name.name} set, this whole value is dropped, not just its part: give it a fallback, var(${name.name}, …)`,
					nodes: [part],
				})
			})
		})
	},
}
