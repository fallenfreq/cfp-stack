import { HIDE_PREFIX, SHOW_PREFIX } from '@somefreq-app/shared/layouts'
import type { Element } from 'hast'
import { visit } from 'unist-util-visit'
import type { ElementRule } from '../core.ts'

// Each block in a run looks back to the run's start for a shown one, so the work grows with the
// square of its length. Measured in Chrome on a fast laptop, the page crossing a width: 2 ms at
// 100, 7 ms at 200, 23 ms at 400 (a dropped frame). A phone is several times slower.
const LONG_RUN = 100

const swaps = (element: Element) =>
	(element.properties.className ?? []).some(
		(name) => name.startsWith(HIDE_PREFIX) || name.startsWith(SHOW_PREFIX),
	)

export const maxHideShowRun: ElementRule = {
	name: 'max-hide-show-run',
	type: 'suggestion',
	check(tree, report) {
		visit(tree, (parent) => {
			if (parent.type !== 'root' && parent.type !== 'element') return
			let run: Element[] = []
			const end = () => {
				const [first] = run
				if (first && run.length >= LONG_RUN)
					report({
						message: `${run.length} blocks in a row each hide or show, which slows the page as its width changes: put those that hide together in one box and hide the box`,
						nodes: [first],
					})
				run = []
			}
			// Text between blocks isn't a block: CSS steps over it too.
			for (const child of parent.children)
				if (child.type === 'element') {
					if (swaps(child)) run.push(child)
					else end()
				}
			end()
		})
	},
}
