// What the types refuse, kept by `pnpm typecheck`: a line marked @ts-expect-error fails the check
// once it stops being an error. Node never runs this file.
import type { CssNode, DeclarationList } from '@eslint/css-tree'
import type { Element, Root } from 'hast'
import type { CssRule, ElementRule } from '../core.ts'

const base: ElementRule = {
	name: 'a rule',
	type: 'problem',
	check: () => undefined,
}
const css: CssNode = { type: 'Raw', value: '' }
const element: Element = { type: 'element', tagName: 'p', properties: {}, children: [] }

export const refused: ElementRule[] = [
	{
		...base,
		// @ts-expect-error -- a rule's type is ESLint's: a problem or a suggestion
		type: 'warning',
	},
	{
		...base,
		// @ts-expect-error -- a rule takes the whole tree as it is, never a narrower one
		check: (_tree: Root & { children: [] }) => undefined,
	},
	{
		...base,
		check: (_tree, report) => {
			// @ts-expect-error -- a result names at least one node
			report({ message: 'nothing', nodes: [] })
		},
	},
	{
		...base,
		check: (_tree, report) => {
			// @ts-expect-error -- a rule that reads elements names elements, not CSS
			report({ message: 'CSS', nodes: [css] })
		},
	},
]

export const refusedCss: CssRule[] = [
	{
		...base,
		// @ts-expect-error -- a CSS rule takes any part of a CSS tree, never only a block's style
		check: (_tree: DeclarationList) => undefined,
	},
	{
		...base,
		check: (_tree, report) => {
			// @ts-expect-error -- a rule that reads CSS names CSS, not elements
			report({ message: 'an element', nodes: [element] })
		},
	},
]
