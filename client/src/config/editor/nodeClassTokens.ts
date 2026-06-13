import { BREAKPOINT_OPTIONS, RADIUS_OPTIONS, SPACING_OPTIONS } from '@/config/editor/layoutTokens'

export interface ClassTokenSpec {
	key: string
	prefix: string
	options: readonly string[]
	default: string | null
}

export const nodeClassTokens: Record<string, ClassTokenSpec[]> = {
	LayoutCard: [
		{ key: 'radius', prefix: 'sf-radius-', options: RADIUS_OPTIONS, default: null },
		{ key: 'padding', prefix: 'sf-padding-', options: SPACING_OPTIONS, default: null },
	],
	LayoutSection: [
		{ key: 'gap', prefix: 'sf-gap-', options: SPACING_OPTIONS, default: null },
		{ key: 'padding', prefix: 'sf-padding-', options: SPACING_OPTIONS, default: null },
	],
	LayoutColumns: [
		{ key: 'gap', prefix: 'sf-gap-', options: SPACING_OPTIONS, default: null },
		{ key: 'collapse', prefix: 'sf-collapse-', options: BREAKPOINT_OPTIONS, default: null },
	],
	LayoutCenter: [
		{ key: 'gap', prefix: 'sf-gap-', options: SPACING_OPTIONS, default: null },
		{ key: 'padding', prefix: 'sf-padding-', options: SPACING_OPTIONS, default: null },
	],
	LayoutSplit: [
		{ key: 'gap', prefix: 'sf-gap-', options: SPACING_OPTIONS, default: null },
		{ key: 'collapse', prefix: 'sf-collapse-', options: BREAKPOINT_OPTIONS, default: null },
	],
	image: [
		{ key: 'radius', prefix: 'sf-radius-', options: RADIUS_OPTIONS, default: null },
	],
}
