// What the types refuse, kept by `pnpm typecheck`: a line marked @ts-expect-error fails the check
// once it stops being an error. Node never runs this file.
import type { Root } from 'hast'
import type { ElementRule } from '../core.ts'

const base: ElementRule = {
	name: 'a rule',
	type: 'problem',
	check: () => undefined,
}

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
			// @ts-expect-error -- a result names at least one element
			report({ message: 'nothing', elements: [] })
		},
	},
]
