// sf-class kinds. `bundle`/`variant`/`state` live in the sf cascade
// layers. `layout` is for sl-* classes (the sl-layout layer, after the sf
// layers). sl- arrangement is fixed CSS (css/slLayout.ts, and css/slCombined.ts for
// what classes mean together), since it's the maintainer's; a rule holds at most one.
// `element` names a UI category HTML forgot (chip, badge, tag) — the class
// itself sets nothing; the theme decorates it the same way it decorates a
// bare `<button>` or `<nav>`. Rules emit to sf-element (below sf-bundle)
// alongside bare element rules, so bundles/variants/states layered on top
// override predictably.
export type ClassKind = 'bundle' | 'variant' | 'context' | 'state' | 'layout' | 'element'

export const CLASS_KINDS: readonly ClassKind[] = [
	'bundle',
	'variant',
	'context',
	'state',
	'layout',
	'element',
] as const

// Token kinds — drive editor introspection (what control to show for
// each token type) and generator emission rules.
export type TokenKind = 'color-triplet' | 'length' | 'number' | 'text' | 'shadow-shape'

export const TOKEN_KINDS: readonly TokenKind[] = [
	'color-triplet',
	'length',
	'number',
	'text',
	'shadow-shape',
] as const

// Kind order, element first. Classes in a selector follow it, which keeps the output
// deterministic (class order doesn't change specificity), and a rule goes in its last
// kind's layer (ruleLayerFor in generateCss.ts).
export const KIND_SORT_ORDER: Record<ClassKind, number> = {
	element: 0,
	bundle: 1,
	variant: 2,
	context: 3,
	state: 4,
	layout: 5,
}

// A rule's @layer derives from the highest-kind class involved.
// State outranks variant outranks bundle — matches the spec's cascade.
// sf-element sits below sf-bundle so element markers act as baselines that
// bundles/variants/states override — the class analog of how HTML element
// rules are a floor that classes stack on top of.
export type Layer =
	| 'sf-element'
	| 'sf-bundle'
	| 'sf-variant'
	| 'sf-context'
	| 'sf-state'
	| 'sl-layout'

export const KIND_TO_LAYER: Record<ClassKind, Layer> = {
	element: 'sf-element',
	bundle: 'sf-bundle',
	variant: 'sf-variant',
	context: 'sf-context',
	state: 'sf-state',
	layout: 'sl-layout',
}
