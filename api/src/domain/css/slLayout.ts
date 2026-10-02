import { PLACEMENT_CLASSES } from '@somefreq-app/shared/placementClasses'
import { throughNodeViews } from './nodeViewSelectors.js'

// What each sl- class does: how it moves, flows and aligns what's inside it. Arrangement is
// the maintainer's to decide, not a theme's, so it's written here rather than as rules; the
// class names stay in the DB vocabulary. A theme's rules on sl- classes set looks only (the
// hidden scrollbar, a scroll frame's arrows) and shape layout through the tokens read here
// (spacing steps, page margin and width). Emitted after the DB rules of sl-layout, so at
// equal specificity the arrangement here beats the root theme's rules. A non-root theme's
// rules are scoped (@scope), and scope beats order, so nothing here stops one setting
// layout; holding themes to looks is the validator's job (not built). Within this block,
// two layouts on one element are settled by name order (the order the DB emitted them in);
// modifiers come after them.
//   sl-row — joins the parent grid's columns (subgrid). Gaps follow the parent's. Only
//     changes where cells are drawn; reading and tab order stay the source order. On a
//     block a component renders, the wrapper and the component both join, so the
//     component's items reach the parent's columns.
//   sl-inset — a stack whose side margins are grid tracks, so a child can opt into them
//     (sl-bleed) instead of pulling itself out with a negative margin. The margin is
//     --sfx-inset-margin: inherited from the inset it sits in, else the page margin. A plain
//     box only reads it, so it never picks up stray padding. The content column stops at
//     --sfx-inset-width, which an inset sets on itself (the page width; a card's is its full
//     width) and passes down the same way; each margin is the larger of the set margin and
//     half the leftover width, so the column centres. sl-bleed only means something inside
//     an sl-inset, so its rules are in slCombined.ts.
//   A document in an inset — its blocks are the inset's items, though TipTap puts two boxes
//     between: the box it mounts the document in, and the document. The mount box spans the
//     inset's edges and the document pads itself to the line (the same sum, its % reading the
//     mount box), so the blocks sit on the line. The document isn't a grid: it stays a width
//     container (hide/show and collapse measure it, a size container can't take its parent's
//     columns) and its blocks keep their own flow. So a block bleeds by pulling out of the
//     padding instead of spanning a track (slCombined.ts). The mount box, marked page-content,
//     has to be the inset's own item. Outside an inset, a document has no margins of its own.
//   Chrome box as inset — the box's own padding (a theme decision) becomes the margins, for
//     it and everything inside, so a card looks unchanged and its children can bleed to its
//     edges. Relies on the theme contract that chrome padding goes through --sf-padding, which
//     these boxes set on themselves. The page width limit is the page's, not a box's: a box's
//     column is its full width (100%). A new padding-owning class needs its own entry here.
//   sl-cover — fills at least 100dvh with content centred both axes, spaced by its gap like
//     the other layouts that hold blocks. --sl-cover-min sets another floor: compact (20rem),
//     viewport (100vh), or fill-parent (100% — needs a parent chain with defined heights).
//   sl-aspect-* — presets; bare sl-aspect has no rule (the author sets --sl-aspect inline).
//   sl-scroll-* — scroll areas. A swipe that reaches the end stops there instead of carrying
//     on to the page (which can fire the browser's back gesture).
//   sl-scroll-frame — positions overlays on a scroll area's edges; the scroll area fills it
//     and can still shrink (minmax(0, …)).
//   sl-pin-* — sticky to one edge of the nearest scroll area. It's the box the parent places
//     that sticks (forPlacement): on a block a component renders, its wrapper.
//   sl-align-x-* / sl-align-y-* — x is sideways and y is up and down, on every layout. After
//     the layouts, so they beat a layout's own alignment (sl-cover's place-items,
//     sl-split/sl-cluster's align-items). A grid aligns with justify-items (x) and align-items
//     (y); a stack's sideways axis is align-items and its up-down axis justify-content; a
//     cluster's sideways axis is justify-content. Aligned sideways, a layout's items take
//     their content's width instead of the full width.
//   sl-inset-line — content starts on the line of the inset it sits in (same sum as sl-inset;
//     padding's % reads the parent's width, which matches when the element fills it). Outside
//     any inset there's no width to follow (100%), so just the page margin. After sl-inset so
//     it beats sl-inset's own padding, and in the layout layer so it beats chrome padding on
//     the same element; top/bottom padding stays. Pinned edges win: the
//     sl-scroll-*:has(.sl-pin-*) rules in slCombined.ts (0-2-0) beat this (0-1-0).

// Layouts that space what's inside them with a gap (sl-row takes its parent grid's). The one
// list other fixed CSS reads to tell a layout from a box of running text: block spacing
// leaves a layout's items to its gap (blockSpacing.ts), and a layout's content box steps
// aside so the blocks inside are its own items (nodeViews.ts). A new layout that spaces its
// items belongs here.
export const GAP_LAYOUTS = [
	'sl-stack',
	'sl-cluster',
	'sl-columns',
	'sl-row',
	'sl-split',
	'sl-grid',
	'sl-inset',
	'sl-cover',
] as const
export const GAP_LAYOUT_SELECTOR = GAP_LAYOUTS.map((name) => `.${name}`).join(', ')

// Fixed CSS with a child or sibling step goes through the node-view helper
// (nodeViewSelectors.ts), so it also reaches blocks a component renders. forPlacement is for
// where an item sits (it styles the box the parent places); forLooks is for everything else
// (it styles the element wearing the classes). Every theme rule goes through forLooks
// (generateCss.ts).
const NODE_VIEW_OPTIONS = {
	placementClasses: PLACEMENT_CLASSES,
	stepAside: GAP_LAYOUT_SELECTOR,
}
export const forLooks = (selector: string): string => throughNodeViews(selector, NODE_VIEW_OPTIONS)
export const forPlacement = (selector: string): string =>
	throughNodeViews(selector, { ...NODE_VIEW_OPTIONS, subject: 'placed' })

// The margin before an inset's line: the set margin, or half the width left over past the
// column's limit if that's more. One sum for an inset's tracks, sl-inset-line's padding and a
// document's padding, so they share one line. An inset sets its own width; elsewhere, no
// width set means no limit (100%).
const LINE_MARGIN =
	'max(var(--sfx-inset-margin, var(--sf-spacing_page)), (100% - var(--sfx-inset-width, 100%)) / 2)'

// A document that's an inset's item: TipTap's mount box, which whatever shows a page marks
// page-content (PageContent.vue, TiptapEditor.vue), as the inset's own item, and the document in
// it. Its top-level blocks are the inset's items (slCombined.ts, the collapse layer).
export const INSET_DOCUMENT_MOUNT = '.sl-inset > .page-content'
export const INSET_DOCUMENT = `${INSET_DOCUMENT_MOUNT} > .tiptap.ProseMirror`

// Anything that collapses by its container's width, and anything that swaps (hides or shows)
// by it.
export const COLLAPSE_CLASS_SELECTOR = '[class*="sl-collapse-"]'
export const SWAP_CLASS_SELECTOR = '[class*="sl-hide-below-"], [class*="sl-show-below-"]'

// Everything in a document whose width comes from its content, because a box around it sizes
// what's inside to fit: a table cell, a cluster's items, a cover's centred items, a layout
// aligned sideways, and the first column of a split with no column widths set (its default
// is auto; the editor's Split block always sets them). A width container takes no width from
// its content, so one in here would be 0 wide. Nothing in here becomes one; what it holds
// measures the next box out (the collapse layer, nodeViews.ts). Documents only: app screens
// put popovers and menus inside rows, where what's inside an element isn't laid out by it.
const AUTO_SPLIT_COLUMN = forPlacement('.sl-split:not([style*="--sl-template"]) > :first-child')
export const SIZED_BY_CONTENT_SELECTOR = [
	'.tiptap.ProseMirror :is(td, th, .sl-cluster, .sl-cover, .sl-align-x-start, .sl-align-x-center, .sl-align-x-end) *',
	`.tiptap.ProseMirror ${AUTO_SPLIT_COLUMN}`,
	`.tiptap.ProseMirror ${AUTO_SPLIT_COLUMN} *`,
].join(', ')

// Layouts that become a width container when they hold a collapsing element, or (outside
// documents) a swapping one (the collapse layer).
export const COLLAPSE_HOST_SELECTOR = [
	'sl-stack',
	'sl-cluster',
	'sl-columns',
	'sl-split',
	'sl-center',
	'sl-inset',
	'sl-grid',
]
	.map((name) => `.${name}`)
	.join(', ')

export const SL_LAYOUT = `@layer sl-layout {
	.sl-aspect-1-1 { aspect-ratio: 1; }
	.sl-aspect-16-9 { aspect-ratio: 16/9; }
	.sl-aspect-4-3 { aspect-ratio: 4/3; }
	.sl-aspect-9-16 { aspect-ratio: 9/16; }
	.sl-center { max-width: var(--sl-measure, 65ch); margin-inline: auto; padding-inline: var(--sf-padding); }
	.sl-cluster { display: flex; flex-wrap: wrap; gap: var(--sf-gap, var(--sf-spacing-md)); align-items: center; }
	.sl-columns { display: grid; grid-template-columns: var(--sl-cols, repeat(auto-fit, minmax(0, 1fr))); gap: var(--sf-gap, var(--sf-spacing-md)); }
	.sl-cover { display: grid; place-items: center; min-height: var(--sl-cover-min, 100dvh); gap: var(--sf-gap, var(--sf-spacing-md)); }
	.sl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--sl-min, 250px), 1fr)); gap: var(--sf-gap, var(--sf-spacing-md)); }
	.sl-inset {
		display: grid;
		--sfx-inset-width: var(--sf-width_page);
		grid-template-columns: [full-start] ${LINE_MARGIN} [content-start] minmax(0, 1fr) [content-end] ${LINE_MARGIN} [full-end];
		padding-inline: 0;
		row-gap: var(--sf-gap, var(--sf-spacing-md));
		align-content: start;
	}
	${forPlacement('.sl-inset > *')} { grid-column: content; }
	${INSET_DOCUMENT_MOUNT} { grid-column: full; }
	${INSET_DOCUMENT} { padding-inline: ${LINE_MARGIN}; }
	:is(.sf-depth-1, .sf-depth-2, .sf-depth-3).sl-inset { --sfx-inset-margin: var(--sf-padding, 0px); --sfx-inset-width: 100%; }
	${forPlacement('.sl-pin-bottom')} { position: sticky; bottom: 0; z-index: 1; }
	${forPlacement('.sl-pin-left')} { position: sticky; left: 0; z-index: 1; }
	${forPlacement('.sl-pin-right')} { position: sticky; right: 0; z-index: 1; }
	${forPlacement('.sl-pin-top')} { position: sticky; top: 0; z-index: 1; }
	.sl-row { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; }
	.sl-scroll-frame { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); }
	.sl-scroll-x { overflow-x: auto; overscroll-behavior-x: contain; }
	.sl-scroll-y { overflow-y: auto; }
	.sl-split { display: grid; grid-template-columns: var(--sl-template, auto 1fr); gap: var(--sf-gap, var(--sf-spacing-md)); align-items: start; }
	.sl-stack { display: flex; flex-direction: column; gap: var(--sf-gap, var(--sf-spacing-md)); }
	.sl-align-x-center { justify-items: center; }
	.sl-align-x-end { justify-items: end; }
	.sl-align-x-start { justify-items: start; }
	.sl-align-y-center { align-items: center; }
	.sl-align-y-end { align-items: end; }
	.sl-align-y-start { align-items: start; }
	.sl-stack:is(.sl-align-y-start, .sl-align-y-center, .sl-align-y-end) { align-items: stretch; }
	.sl-stack.sl-align-y-center { justify-content: center; }
	.sl-stack.sl-align-y-end { justify-content: end; }
	.sl-stack.sl-align-y-start { justify-content: start; }
	.sl-stack.sl-align-x-center { align-items: center; }
	.sl-stack.sl-align-x-end { align-items: end; }
	.sl-stack.sl-align-x-start { align-items: start; }
	.sl-cluster.sl-align-x-center { justify-content: center; }
	.sl-cluster.sl-align-x-end { justify-content: end; }
	.sl-cluster.sl-align-x-start { justify-content: start; }
	.sl-inset-line { padding-inline: ${LINE_MARGIN}; }
}
`
