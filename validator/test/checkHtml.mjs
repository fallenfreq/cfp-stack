import { fromHtml } from 'hast-util-from-html'
import { check } from '../core.ts'

// A rule's results on a page written as HTML, each element as the line it starts on, as ESLint's
// rule tests give a problem's line. A page is written a block to a line, the first on the opening
// backtick's line, so line 1 is the page's first.
export function checkHtml(rule, html) {
	return check(fromHtml(html, { fragment: true }), [rule]).map(({ message, nodes }) => ({
		message,
		lines: nodes.map((element) => element.position.start.line),
	}))
}
