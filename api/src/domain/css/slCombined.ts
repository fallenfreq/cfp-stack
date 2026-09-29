// What sl- classes mean together is the maintainer's to decide, not a theme's, so it's
// written here rather than as rules (a rule allows one layout class). Emitted after the
// DB rules of sl-layout; each selector here already outranks what it competes with.
//   Scrolling cluster — stays on one line, and its items keep their natural width:
//     scrolling replaces both wrapping and squeezing (a squeezed item wraps its own text).
//   Bleed — a child wearing sl-bleed spans its sl-inset parent's margins. An inset that
//     bleeds has the parent's edges, so the parent's line carries on through it (a
//     coloured band keeps the page line and width limit, not its own padding). Written from the parent
//     (0-3-0) so it only applies where the bleed takes effect and beats the chrome × inset
//     compounds (0-2-0).
//   Pinned edges — an edge that holds a pinned element has no padding: pinned means flush
//     to that edge; padding there leaves a strip where content scrolls past beside it.
//     Other edges keep their padding. Nested caveat: sf-system.md.

export const SL_COMBINED = `@layer sl-layout {
	.sl-cluster.sl-scroll-x { flex-wrap: nowrap; }
	.sl-cluster.sl-scroll-x > * { flex-shrink: 0; }
	.sl-inset > .sl-bleed { grid-column: full; }
	.sl-inset > .sl-bleed.sl-inset { --sfx-inset-margin: inherit; --sfx-inset-width: inherit; }
	.sl-scroll-x:has(.sl-pin-left) { padding-left: 0; }
	.sl-scroll-x:has(.sl-pin-right) { padding-right: 0; }
	.sl-scroll-y:has(.sl-pin-top) { padding-top: 0; }
	.sl-scroll-y:has(.sl-pin-bottom) { padding-bottom: 0; }
}
`
