import { type CssNode, lexer, walk } from '@eslint/css-tree'

// Whether a declaration's value is one of its own, which the prefer-theme rules point out, rather
// than one left to the theme or the text around it: it holds no variable (which may be the
// theme's), and isn't one of CSS's words for every property (`inherit`), as CSSTree lists them.
export function isOwnValue(value: CssNode): boolean {
	if (value.type === 'Value' && value.children.size === 1) {
		const only = value.children.first
		if (only?.type === 'Identifier' && lexer.cssWideKeywords.includes(only.name.toLowerCase()))
			return false
	}
	let variable = false
	walk(value, (node) => {
		if (node.type === 'Function' && node.name.toLowerCase() === 'var') variable = true
	})
	return !variable
}
