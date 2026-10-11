import {
	DOCUMENT_CONTAINER,
	GAP_LAYOUT_SELECTOR,
	NOT_A_BLOCK,
	type WidthBand,
	shownAlways,
	shownIn,
} from './slLayout.js'

// Space between blocks in a TipTap document: the editor and published pages. The sizes are
// the theme's spacing steps. A default, so it sits in the lowest layer: a component rule that
// sets a block's space above it wins. Space under a block merges with the next block's space
// above (the larger shows), so it can widen the gap but not narrow it. The .tiptap in each
// selector (0-1-0) beats the reset's own margin: 0 on p, h1, ul… (0-0-1).
//   Spacing belongs to flow containers: things that hold blocks one after another, like
//     running text — the document, a node view's content box, a plain div block, a quote, a
//     list item, a task item's content (li[data-checked] > div: the li itself is a layout),
//     a table cell. Each block that comes after a shown block gets space above it.
//   A container that wears a layout class isn't a flow container (its gap spaces its
//     children) — the document included (a drag preview is .tiptap.sl-stack) — nor is a
//     layout's content box, which steps aside for it (nodeViews.ts).
//   A block hidden at this width keeps its place in the page, so "after a shown block" is
//     written once for blocks shown at every width and once per width band (slLayout.ts,
//     widthBands). The space goes above a block rather than below: below would mean each block
//     looking ahead for a shown one after it, which would make adding a block several times
//     slower on long pages.

const FLOW_CONTAINER =
	':where([data-node-view-content], [data-container], blockquote, li, li[data-checked] > div, td, th)'
	+ `:where(:not(${GAP_LAYOUT_SELECTOR}, :is(${GAP_LAYOUT_SELECTOR}) > [data-node-view-content]))`

export function blockSpacing(bands: readonly WidthBand[]): string {
	const spaced = (shown: string, at: string) => {
		const block = `:where(${shown}) ~ :where(:not(${NOT_A_BLOCK}))`
		return `${at}.tiptap:where(:not(${GAP_LAYOUT_SELECTOR})) > ${block},
${at}.tiptap ${FLOW_CONTAINER} > ${block} { margin-top: var(--sf-spacing-md); }\n`
	}
	const inBands = bands.map(
		(band) =>
			`\t@container ${DOCUMENT_CONTAINER} ${band.condition} {\n${spaced(shownIn(band), '\t\t')}\t}\n`,
	)
	return `@layer reset {
${spaced(shownAlways(bands), '\t')}${inBands.join('')}\t/* List items sit closer than blocks. */
	.tiptap :where(li) { margin-bottom: var(--sf-spacing-xs); }
}
`
}
