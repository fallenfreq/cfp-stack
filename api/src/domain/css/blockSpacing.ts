import { GAP_LAYOUT_SELECTOR, STEP_ASIDE_LAYOUT_SELECTOR } from './slLayout.js'

// Space between blocks in a TipTap document: the editor and published pages. The sizes are
// the theme's spacing steps. A default, so it sits in the lowest layer: any theme or
// component rule that spaces a block wins. The .tiptap in each selector (0-1-0) beats the
// reset's own margin: 0 on p, h1, ul… (0-0-1).
//   Spacing belongs to flow containers: things that hold blocks one after another, like
//     running text — the document, a node view's content box, a plain div block, a quote, a
//     list item, a task item's content (li[data-checked] > div: the li itself is a layout),
//     a table cell. Each block but the last gets space below it.
//   A container that wears a layout class isn't a flow container (its gap spaces its
//     children) — the document included (a drag preview is .tiptap.sl-stack) — nor is a
//     layout's content box that steps aside for it (nodeViews.ts). Inside sl-inset the
//     content box stays, as the inset's one item, and spaces its blocks like any other.
//   ProseMirror's gap cursor is a widget, not a block: it's skipped, and a block followed
//     only by it still counts as last.

const BLOCK =
	':where(:not(:last-child, :has(+ .ProseMirror-widget:last-child), .ProseMirror-widget))'
const FLOW_CONTAINER =
	':where([data-node-view-content], [data-container], blockquote, li, li[data-checked] > div, td, th)'
	+ `:where(:not(${GAP_LAYOUT_SELECTOR}, :is(${STEP_ASIDE_LAYOUT_SELECTOR}) > [data-node-view-content]))`

export const BLOCK_SPACING = `@layer reset {
	.tiptap:where(:not(${GAP_LAYOUT_SELECTOR})) > ${BLOCK},
	.tiptap ${FLOW_CONTAINER} > ${BLOCK} { margin-bottom: var(--sf-spacing-md); }
	/* List items sit closer than blocks. */
	.tiptap :where(li) { margin-bottom: var(--sf-spacing-xs); }
}
`
