import { check, readStyle } from '../core.ts'

// A rule's results on a block's own style, each node as the text it covers, as written.
export function checkCss(rule, style) {
	return check(readStyle(style), [rule]).map(({ message, nodes }) => ({
		message,
		parts: nodes.map((node) => style.slice(node.loc.start.offset, node.loc.end.offset)),
	}))
}
