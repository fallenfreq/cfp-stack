import { forLooks, forPlacement, INSET_DOCUMENT, INSET_DOCUMENT_MOUNT } from './slLayout.js'

// What sl- classes mean together is the maintainer's to decide, not a theme's, so it's
// written here rather than as rules (a rule allows one layout class). Emitted after the
// DB rules of sl-layout; each selector here already outranks what it competes with.
//   Scrolling cluster — stays on one line, and its items keep their natural width:
//     scrolling replaces both wrapping and squeezing (a squeezed item wraps its own text).
//   Bleed — a child wearing sl-bleed spans its sl-inset parent's margins. An inset that
//     bleeds has the parent's edges, so the parent's line carries on through it (a
//     coloured band keeps the page line and width limit, not its own padding). Written from the parent
//     (0-3-0) so it only applies where the bleed takes effect and beats the chrome × inset
//     compounds (0-2-0). The column goes on the box the inset places; the inherited edges
//     go on the element that is the inner inset (forPlacement / forLooks, slLayout.ts).
//   Bleed in a document — a document in an inset is padded to the line, not a grid
//     (slLayout.ts), so a top-level block that bleeds pulls out of that padding: it takes
//     the mount box's width (--sfx-bleed-width, measured as a length, so a chrome inset's
//     100% resolves) and centres on the document by negative margins. A minimum width, so it
//     beats a width the block sets itself (an image's width: 100%). The mount box is a width
//     container (sf-bleed-area) for that measure, and a layout that bleeds collapses by it
//     (the collapse layer); a block that bleeds measures for what's inside it. A band carries the line on as above; a bar's own padding
//     (sl-inset-line) reads the document, not the bleed, so it's set from the bleed's width.
//     A component block's wrapper wears sl-bleed, so it's what pulls out; its root fills it,
//     so sl-inset-line on the root needs nothing more. Weights match the inset's rules, and
//     the bar's comes before the pinned edges, so pinning still wins.
//   Pinned edges — an edge that holds a pinned element has no padding: pinned means flush
//     to that edge; padding there leaves a strip where content scrolls past beside it.
//     Other edges keep their padding. Nested caveat: sf-system.md.

// A top-level block that bleeds out of a document in an inset: a plain block, or a component
// block's wrapper. Weighs one class, as sl-bleed does; the collapse layer reads it too.
export const BLEEDS_FROM_DOCUMENT = `:where(${INSET_DOCUMENT}) > .sl-bleed`

export const SL_COMBINED = `@property --sfx-bleed-width {
	syntax: '<length>';
	inherits: true;
	initial-value: 0px;
}

@layer sl-layout {
	.sl-cluster.sl-scroll-x { flex-wrap: nowrap; }
	${forPlacement('.sl-cluster.sl-scroll-x > *')} { flex-shrink: 0; }
	${forPlacement('.sl-inset > .sl-bleed')} { grid-column: full; }
	${forLooks('.sl-inset > .sl-bleed.sl-inset')} { --sfx-inset-margin: inherit; --sfx-inset-width: inherit; }
	${INSET_DOCUMENT_MOUNT} { container: sf-bleed-area / inline-size; }
	${INSET_DOCUMENT} { --sfx-bleed-width: 100cqi; }
	${BLEEDS_FROM_DOCUMENT} { margin-inline: calc((100% - var(--sfx-bleed-width)) / 2); min-width: var(--sfx-bleed-width); }
	${BLEEDS_FROM_DOCUMENT}.sl-inset,
	:where(${INSET_DOCUMENT} > [data-node-view-wrapper]) > .sl-bleed.sl-inset { --sfx-inset-margin: inherit; --sfx-inset-width: inherit; }
	${BLEEDS_FROM_DOCUMENT}.sl-inset-line { padding-inline: calc((var(--sfx-bleed-width) - 100%) / 2); }
	.sl-scroll-x:has(.sl-pin-left) { padding-left: 0; }
	.sl-scroll-x:has(.sl-pin-right) { padding-right: 0; }
	.sl-scroll-y:has(.sl-pin-top) { padding-top: 0; }
	.sl-scroll-y:has(.sl-pin-bottom) { padding-bottom: 0; }
}
`
