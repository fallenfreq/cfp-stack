// What a doc's sections are named by: its headings and the bold leads of its paragraphs and list
// items, as they read (no code marks or links), each also without a closing parenthetical.
export function sectionNames(markdown) {
	const names = new Set()
	let fenced = false
	for (const line of markdown.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
		if (fenced) continue
		const match =
			line.match(/^#{1,6}\s+(.+?)[\s#]*$/)
			?? line.match(/^\s*(?:(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)?\*\*([^*]+?)[.:]?\*\*/)
		if (!match) continue
		const name = match[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*]/g, '')
		names.add(name)
		names.add(name.replace(/\s*\([^)]*\)$/, ''))
	}
	return names
}
