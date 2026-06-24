import { type DrizzleD1Database } from 'drizzle-orm/d1'

// Loose DB type — domain functions don't care about the relational
// schema parameter Drizzle is parametrised with; they use the query
// builder methods that work regardless.
export type Db = DrizzleD1Database<Record<string, unknown>>

// sf-class kinds. `bundle`/`variant`/`state` live in the sf cascade
// layers. `layout` is for sl-* primitives (outside the sf layer order;
// not currently used in class_rules but allowed for future).
export type ClassKind = 'bundle' | 'variant' | 'context' | 'state' | 'layout'

export const CLASS_KINDS: readonly ClassKind[] = [
	'bundle',
	'variant',
	'context',
	'state',
	'layout',
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

// Selector composition order within a compound selector. Cosmetic
// (CSS specificity ignores class order inside an intersection) but
// keeps generated output deterministic.
export const KIND_SORT_ORDER: Record<ClassKind, number> = {
	bundle: 0,
	variant: 1,
	context: 2,
	state: 3,
	layout: 4,
}

// A rule's @layer derives from the highest-kind class involved.
// State outranks variant outranks bundle — matches the spec's cascade.
export type Layer = 'sf-bundle' | 'sf-variant' | 'sf-context' | 'sf-state' | 'sl-layout'

export const KIND_TO_LAYER: Record<ClassKind, Layer> = {
	bundle: 'sf-bundle',
	variant: 'sf-variant',
	context: 'sf-context',
	state: 'sf-state',
	layout: 'sl-layout',
}
