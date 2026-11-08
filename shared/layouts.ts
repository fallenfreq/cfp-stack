// The sl- layout classes as lists, read as they are by the stylesheet's code (api/src/domain/) and
// the validator, so each is written once. A new layout goes on each list it belongs to.

// Layouts that space what's inside them with a gap (sl-row takes its parent grid's). The one
// list the fixed CSS reads to tell a layout from a box of running text: block spacing leaves a
// layout's items to its gap (blockSpacing.ts), and a layout's content box steps aside so the
// blocks inside are its own items (nodeViews.ts).
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

// What arranges what's inside a box, so a box takes one (client/src/assets/sf-system.md, "One
// arrangement per box"): the gap layouts, and the scroll frame, which wraps one scroll area and
// spaces nothing.
export const ARRANGEMENTS = [...GAP_LAYOUTS, 'sl-scroll-frame'] as const

// What each class that collapses a layout by its container's width starts with (sl-collapse-sm).
export const COLLAPSE_PREFIX = 'sl-collapse-'

// Layouts that become a width container when they hold a collapsing element, or (outside
// documents) a swapping one (the collapse layer), so what's inside measures the nearest.
export const COLLAPSE_HOSTS = [
	'sl-stack',
	'sl-cluster',
	'sl-columns',
	'sl-split',
	'sl-center',
	'sl-inset',
	'sl-grid',
] as const

// Layouts that set their items side by side in columns, which collapsing puts in one. A layout
// that collapses straight in one of their columns measures the whole layout, not its column.
export const COLUMN_LAYOUTS = ['sl-columns', 'sl-split', 'sl-grid'] as const

// Every layout a collapse class stacks: those, and a cluster, whose row becomes a column. On
// anything else the class does nothing.
export const COLLAPSING_LAYOUTS = [...COLUMN_LAYOUTS, 'sl-cluster'] as const
