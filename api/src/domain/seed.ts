import { eq } from 'drizzle-orm'
import { classVocabulary, themes } from '../schemas/theme.js'
import { users } from '../schemas/user.js'
import {
	type ClassOnlyRuleInput,
	type ElementRuleInput,
	addVocabularyEntry,
	createClassRule,
} from './classRules.js'
import { setCollapseThreshold } from './collapseThresholds.js'
import { SEED_VERSION } from './seedVersion.js'
import { createTheme } from './themes.js'
import { setToken } from './themeTokens.js'
import { type ClassKind, type Db, type TokenKind } from './types.js'

// ─── Fixture identities ──────────────────────────────────────────────────
// Brand user owns all default themes. Themes use stable UUIDs so the seed
// is reproducible across environments.

const BRAND_USER_EMAIL = 'michael@somefreq.com'
const BRAND_USER_NAME = 'somefreq'

const ROOT_ID = '01000000-0000-7000-8000-000000000000'
const DARK_ID = '01000000-0000-7000-8000-000000000001'
const PINK_ID = '01000000-0000-7000-8000-000000000002'

// ─── Token data ──────────────────────────────────────────────────────────

interface TokenSpec {
	name: string
	value: string
	kind: TokenKind
}

const ROOT_TOKENS: TokenSpec[] = [
	// Text sizes
	{ name: '--sf-text-xs', value: '0.75rem', kind: 'length' },
	{ name: '--sf-text-sm', value: '0.875rem', kind: 'length' },
	{ name: '--sf-text-base', value: '1rem', kind: 'length' },
	{ name: '--sf-text-lg', value: '1.125rem', kind: 'length' },
	{ name: '--sf-text-xl', value: '1.25rem', kind: 'length' },
	{ name: '--sf-text-2xl', value: '1.5rem', kind: 'length' },
	{ name: '--sf-text-3xl', value: '1.875rem', kind: 'length' },
	{ name: '--sf-text-4xl', value: '2.25rem', kind: 'length' },
	{ name: '--sf-text-5xl', value: '3rem', kind: 'length' },
	{ name: '--sf-text-6xl', value: '3.75rem', kind: 'length' },
	{ name: '--sf-text-7xl', value: '4.5rem', kind: 'length' },
	{ name: '--sf-text-8xl', value: '6rem', kind: 'length' },
	{ name: '--sf-text-9xl', value: '8rem', kind: 'length' },

	// Spacing
	{ name: '--sf-spacing-none', value: '0px', kind: 'length' },
	{ name: '--sf-spacing-2xs', value: '0.25rem', kind: 'length' },
	{ name: '--sf-spacing-xs', value: '0.5rem', kind: 'length' },
	{ name: '--sf-spacing-sm', value: '0.75rem', kind: 'length' },
	{ name: '--sf-spacing-md', value: '1rem', kind: 'length' },
	{ name: '--sf-spacing-lg', value: '1.5rem', kind: 'length' },
	{ name: '--sf-spacing-xl', value: '2.5rem', kind: 'length' },

	// Leading
	{ name: '--sf-leading-none', value: '1', kind: 'number' },
	{ name: '--sf-leading-tight', value: '1.25', kind: 'number' },
	{ name: '--sf-leading-snug', value: '1.375', kind: 'number' },
	{ name: '--sf-leading-normal', value: '1.5', kind: 'number' },
	{ name: '--sf-leading-relaxed', value: '1.625', kind: 'number' },
	{ name: '--sf-leading-loose', value: '2', kind: 'number' },

	// Tracking
	{ name: '--sf-tracking-tight', value: '-0.025em', kind: 'length' },
	{ name: '--sf-tracking-normal', value: '0em', kind: 'length' },
	{ name: '--sf-tracking-wide', value: '0.025em', kind: 'length' },

	// Shadow shapes (paired with --sf-shadow colour at use site)
	{ name: '--sf-shadow-sm', value: '0 1px 4px', kind: 'shadow-shape' },
	{ name: '--sf-shadow-md', value: '0 2px 8px', kind: 'shadow-shape' },
	{ name: '--sf-shadow-lg', value: '0 4px 16px', kind: 'shadow-shape' },
	{ name: '--sf-shadow-xl', value: '0 8px 24px', kind: 'shadow-shape' },

	// Shadow opacity (theme-character knob)
	{ name: '--sf-shadow-opacity', value: '0.12', kind: 'number' },

	// Primary palette
	{ name: '--sf-primary-1', value: '209 250 229', kind: 'color-triplet' },
	{ name: '--sf-primary-2', value: '167 243 208', kind: 'color-triplet' },
	{ name: '--sf-primary-3', value: '110 231 183', kind: 'color-triplet' },
	{ name: '--sf-primary-4', value: '52 211 153', kind: 'color-triplet' },
	{ name: '--sf-primary-5', value: '16 185 129', kind: 'color-triplet' },
	{ name: '--sf-primary-6', value: '5 150 105', kind: 'color-triplet' },
	{ name: '--sf-primary-7', value: '4 120 87', kind: 'color-triplet' },
	{ name: '--sf-primary-8', value: '6 95 70', kind: 'color-triplet' },
	{ name: '--sf-primary-9', value: '4 78 56', kind: 'color-triplet' },

	// Surface palette (surface-0 = canvas)
	{ name: '--sf-surface-0', value: '255 255 255', kind: 'color-triplet' },
	{ name: '--sf-surface-1', value: '244 244 245', kind: 'color-triplet' },
	{ name: '--sf-surface-2', value: '228 228 231', kind: 'color-triplet' },
	{ name: '--sf-surface-3', value: '212 212 216', kind: 'color-triplet' },
	{ name: '--sf-surface-4', value: '161 161 170', kind: 'color-triplet' },
	{ name: '--sf-surface-5', value: '113 113 122', kind: 'color-triplet' },
	{ name: '--sf-surface-6', value: '82 82 91', kind: 'color-triplet' },
	{ name: '--sf-surface-7', value: '63 63 70', kind: 'color-triplet' },
	{ name: '--sf-surface-8', value: '39 39 42', kind: 'color-triplet' },
	{ name: '--sf-surface-9', value: '24 24 27', kind: 'color-triplet' },

	// Alpha (theme-controlled values)
	{ name: '--sf-alpha-1', value: '0.1', kind: 'number' },
	{ name: '--sf-alpha-2', value: '0.2', kind: 'number' },
	{ name: '--sf-alpha-3', value: '0.3', kind: 'number' },
	{ name: '--sf-alpha-4', value: '0.4', kind: 'number' },
	{ name: '--sf-alpha-5', value: '0.5', kind: 'number' },
	{ name: '--sf-alpha-6', value: '0.6', kind: 'number' },
	{ name: '--sf-alpha-7', value: '0.7', kind: 'number' },
	{ name: '--sf-alpha-8', value: '0.8', kind: 'number' },
	{ name: '--sf-alpha-9', value: '0.9', kind: 'number' },

	// Font weight
	{ name: '--sf-weight-1', value: '400', kind: 'number' },
	{ name: '--sf-weight-2', value: '500', kind: 'number' },
	{ name: '--sf-weight-3', value: '600', kind: 'number' },
	{ name: '--sf-weight-4', value: '700', kind: 'number' },

	// Radius
	{ name: '--sf-radius-0', value: '0px', kind: 'length' },
	{ name: '--sf-radius-1', value: '4px', kind: 'length' },
	{ name: '--sf-radius-2', value: '8px', kind: 'length' },
	{ name: '--sf-radius-3', value: '16px', kind: 'length' },

	// Stroke — border/outline widths (1 = regular borders, 2 = focus/selection, 3 = emphasis)
	{ name: '--sf-stroke-1', value: '1px', kind: 'length' },
	{ name: '--sf-stroke-2', value: '2px', kind: 'length' },
	{ name: '--sf-stroke-3', value: '4px', kind: 'length' },

	// Font families (slot 3 reserved)
	{
		name: '--sf-font-1',
		value: '"Source Sans Pro", Inter, system-ui, sans-serif',
		kind: 'text',
	},
	{ name: '--sf-font-2', value: '"Lora", Georgia, serif', kind: 'text' },
	{
		name: '--sf-font-mono',
		value: '"Source Code Pro", "Fira Code", monospace',
		kind: 'text',
	},

	// Semantic tokens
	{ name: '--sf-fg_primary', value: '38 40 36', kind: 'color-triplet' },
	{ name: '--sf-fg_inverted', value: '255 255 255', kind: 'color-triplet' },
	{ name: '--sf-primary', value: 'var(--sf-primary-5)', kind: 'color-triplet' },
	{ name: '--sf-border_color', value: '222 229 242', kind: 'color-triplet' },
	{ name: '--sf-shadow', value: '0 0 0', kind: 'color-triplet' },
	{ name: '--sf-danger', value: '239 68 68', kind: 'color-triplet' },
	{ name: '--sf-warning', value: '245 158 11', kind: 'color-triplet' },
	{ name: '--sf-success', value: '34 197 94', kind: 'color-triplet' },
]

const DARK_TOKEN_OVERRIDES: TokenSpec[] = [
	{ name: '--sf-fg_primary', value: '241 241 241', kind: 'color-triplet' },
	{ name: '--sf-fg_inverted', value: '11 18 26', kind: 'color-triplet' },
	{ name: '--sf-border_color', value: '61 76 88', kind: 'color-triplet' },
	{ name: '--sf-primary', value: 'var(--sf-primary-4)', kind: 'color-triplet' },
	// Surface palette — dark mode inverts the scale: 0 is the darkest canvas, higher = more elevated
	{ name: '--sf-surface-0', value: '5 10 16', kind: 'color-triplet' },
	{ name: '--sf-surface-1', value: '31 38 47', kind: 'color-triplet' },
	{ name: '--sf-surface-2', value: '42 52 63', kind: 'color-triplet' },
	{ name: '--sf-surface-3', value: '55 66 78', kind: 'color-triplet' },
	{ name: '--sf-surface-4', value: '72 84 98', kind: 'color-triplet' },
	{ name: '--sf-surface-5', value: '93 107 122', kind: 'color-triplet' },
	{ name: '--sf-surface-6', value: '118 133 148', kind: 'color-triplet' },
	{ name: '--sf-surface-7', value: '148 163 177', kind: 'color-triplet' },
	{ name: '--sf-surface-8', value: '183 195 206', kind: 'color-triplet' },
	{ name: '--sf-surface-9', value: '218 226 234', kind: 'color-triplet' },
]

const PINK_TOKEN_OVERRIDES: TokenSpec[] = [
	// Primary palette
	{ name: '--sf-primary-1', value: '255 204 230', kind: 'color-triplet' },
	{ name: '--sf-primary-2', value: '255 179 218', kind: 'color-triplet' },
	{ name: '--sf-primary-3', value: '255 153 204', kind: 'color-triplet' },
	{ name: '--sf-primary-4', value: '255 128 191', kind: 'color-triplet' },
	{ name: '--sf-primary-5', value: '255 102 178', kind: 'color-triplet' },
	{ name: '--sf-primary-6', value: '255 77 166', kind: 'color-triplet' },
	{ name: '--sf-primary-7', value: '255 51 153', kind: 'color-triplet' },
	{ name: '--sf-primary-8', value: '255 26 140', kind: 'color-triplet' },
	{ name: '--sf-primary-9', value: '255 0 128', kind: 'color-triplet' },

	// Surface palette
	{ name: '--sf-surface-0', value: '255 240 245', kind: 'color-triplet' },
	{ name: '--sf-surface-1', value: '255 220 235', kind: 'color-triplet' },
	{ name: '--sf-surface-2', value: '255 210 230', kind: 'color-triplet' },
	{ name: '--sf-surface-3', value: '255 200 225', kind: 'color-triplet' },
	{ name: '--sf-surface-4', value: '255 180 215', kind: 'color-triplet' },
	{ name: '--sf-surface-5', value: '255 160 205', kind: 'color-triplet' },
	{ name: '--sf-surface-6', value: '255 140 195', kind: 'color-triplet' },
	{ name: '--sf-surface-7', value: '255 120 185', kind: 'color-triplet' },
	{ name: '--sf-surface-8', value: '255 100 175', kind: 'color-triplet' },
	{ name: '--sf-surface-9', value: '255 80 165', kind: 'color-triplet' },

	// Semantic
	{ name: '--sf-fg_primary', value: '102 0 51', kind: 'color-triplet' },
	{ name: '--sf-fg_inverted', value: '255 230 240', kind: 'color-triplet' },
]

// ─── Vocabulary ──────────────────────────────────────────────────────────

interface VocabSpec {
	name: string
	kind: ClassKind
	pseudo?: string | null
	description?: string
}

const VOCABULARY: VocabSpec[] = [
	// Depth bundles
	{ name: 'sf-depth-0', kind: 'bundle', description: 'Canvas / page — bottommost surface' },
	{ name: 'sf-depth-1', kind: 'bundle', description: 'One level above canvas — cards, wells' },
	{ name: 'sf-depth-2', kind: 'bundle', description: 'Further raised — dropdowns, popovers' },
	{ name: 'sf-depth-3', kind: 'bundle', description: 'Topmost — modals' },

	// Heading bundles
	{ name: 'sf-heading-1', kind: 'bundle', description: 'Most prominent heading' },
	{ name: 'sf-heading-2', kind: 'bundle', description: 'Secondary heading' },
	{ name: 'sf-heading-3', kind: 'bundle', description: 'Tertiary heading' },

	// Loudness bundles — attention hierarchy; higher number = more attention. Theme decides
	// expression (scale, padding, type weight, contrast, or combination). loudness-2 is the
	// implied default when no loudness class is present.
	{
		name: 'sf-loudness-1',
		kind: 'bundle',
		description: 'Lowest attention — de-emphasised, supporting content',
	},
	{ name: 'sf-loudness-2', kind: 'bundle', description: 'Moderate attention — default weight' },
	{
		name: 'sf-loudness-3',
		kind: 'bundle',
		description: 'Highest attention — most visual weight',
	},

	// Size bundles — form-factor scale. Theme picks which properties express each step;
	// this theme spends size on --sf-padding. Shape stays out — border-radius comes from
	// the element's own rule (bare <button>) or an explicit sf-radius-* utility.
	{ name: 'sf-size-2xs', kind: 'bundle', description: 'Very tight — breadcrumb, dense chip' },
	{ name: 'sf-size-xs', kind: 'bundle', description: 'Compact — icon button, small tag' },
	{ name: 'sf-size-sm', kind: 'bundle', description: 'Small — small button' },
	{ name: 'sf-size-md', kind: 'bundle', description: 'Standard density' },
	{ name: 'sf-size-lg', kind: 'bundle', description: 'Large — featured tile' },
	{ name: 'sf-size-xl', kind: 'bundle', description: 'Hero scale' },

	// Element markers — class analog of a bare HTML element rule. The class itself
	// sets nothing; the theme decorates it the same way it decorates <button> or <nav>.
	// Emits to sf-element layer (below sf-bundle) so bundles/variants/states layered
	// on top override predictably — the same baseline behaviour HTML elements get for free.
	{
		name: 'sf',
		kind: 'element',
		description:
			'System membership marker — scopes bare element baseline rules to opted-in elements only',
	},
	{
		name: 'sf-chip',
		kind: 'element',
		description:
			'Compact discrete-unit chip — tag, filter, selection, status. Wear alongside sf on the underlying element; element-specific chip overrides (radius, border) live in compound rules like button.sf-chip.',
	},
	{
		name: 'sf-icon',
		kind: 'element',
		description:
			'Content is a single icon. Scales with context font-size (1em); no line-height bleed. Theme can override size or add colour treatment.',
	},
	{
		name: 'sf-single-line',
		kind: 'element',
		description:
			'Content is a single line of text. Normalises line-height to 1 so tight padding is not inflated by leading.',
	},
	{
		name: 'sf-drag-handle',
		kind: 'element',
		description:
			'Drag affordance — dim at rest, accents to primary on hover and while dragging. Wears sf-depth-* and sf-is-overlay; theme decides chrome via compounds.',
	},
	{
		name: 'sf-swatch',
		kind: 'element',
		description:
			'Content is a small colour-surface tile — palette chip, native colour input, preview. Theme decides border, radius, padding; consumers set width/height.',
	},
	{
		name: 'sf-field',
		kind: 'element',
		description:
			'Editable form-control chrome shared by input, select, textarea — border, radius, font, padding-bridge, focus contract. Wear alongside sf on form elements that want field chrome (checkbox/radio/range wear sf alone for accent-color only). Element-specific additions (chevron on select) via compound rules like select.sf-field.',
	},
	{
		name: 'sf-scrim',
		kind: 'element',
		description:
			'Modal backdrop — semi-transparent full-viewport overlay that darkens and blurs the underlying content. Chrome only (background + backdrop-filter); consumer owns positioning (fixed, inset:0, z-index, centering).',
	},
	{
		name: 'sf-content-frame',
		kind: 'element',
		description:
			'Frame around focusable content that itself is not focusable — third-party editor wrappers (CodeMirror, TipTap), contenteditable containers, iframe hosts. Border + radius + :focus-within primary-border response. Consumer keeps layout/overflow/transition scoped.',
	},

	// Variants
	{
		name: 'sf-variant-featured',
		kind: 'variant',
		description: 'Prominent, calls for attention',
	},
	{ name: 'sf-variant-danger', kind: 'variant', description: 'Destructive intent' },
	{
		name: 'sf-variant-warning',
		kind: 'variant',
		description: 'Cautionary intent — needs attention, not destructive',
	},
	{
		name: 'sf-variant-success',
		kind: 'variant',
		description: 'Positive outcome — confirmation, completion, approval',
	},
	// alt-1 = alternative visual presentation of the same class combination; no semantic intent
	// beyond "look distinct from the default rendering". The theme compounds against whatever
	// other classes are present (depth, size, loudness) to decide the treatment.
	// Numbered from the start so alt-2 etc. can be added without breaking existing content.
	{
		name: 'sf-variant-alt-1',
		kind: 'variant',
		description: 'Alternative visual form — distinct rendering of the same class combination',
	},

	// State classes — vocabulary only; rules are compound (depth/variant × state) added per-theme
	{
		name: 'sf-on-hover',
		kind: 'state',
		pseudo: ':hover',
		description: 'Hover interaction modifier',
	},
	{
		name: 'sf-on-focus',
		kind: 'state',
		pseudo: ':focus-visible',
		description: 'Keyboard-focus interaction modifier',
	},
	{
		name: 'sf-on-active',
		kind: 'state',
		pseudo: ':active',
		description: 'Active/pressed interaction modifier',
	},
	{
		name: 'sf-on-disabled',
		kind: 'state',
		pseudo: ':disabled',
		description: 'Disabled state modifier',
	},
	{
		name: 'sf-on-selected',
		kind: 'state',
		description: 'Persistent chosen/selected state (author/JS-toggled, no pseudo)',
	},
	{
		name: 'sf-on-current',
		kind: 'state',
		description:
			'This option is currently on/active — the one that will fire on Enter or the mark currently applied',
	},
	{
		name: 'sf-on-ancestor',
		kind: 'state',
		description: 'On the path to sf-on-current but not it (nav parent, breadcrumb non-leaf)',
	},
	{
		name: 'sf-on-dragging',
		kind: 'state',
		description: 'Element is actively being dragged (JS-toggled, no CSS pseudo)',
	},

	// Context — JS-detected or author-declared conditions; sits above variant, below state
	{
		name: 'sf-is-edge-top',
		kind: 'context',
		description: 'Element is flush with the top viewport edge',
	},
	{
		name: 'sf-is-edge-right',
		kind: 'context',
		description: 'Element is flush with the right viewport edge',
	},
	{
		name: 'sf-is-edge-bottom',
		kind: 'context',
		description: 'Element is flush with the bottom viewport edge',
	},
	{
		name: 'sf-is-edge-left',
		kind: 'context',
		description: 'Element is flush with the left viewport edge',
	},
	{
		name: 'sf-is-overflow-top',
		kind: 'context',
		description: 'Content is clipped at the top edge (JS-toggled)',
	},
	{
		name: 'sf-is-overflow-right',
		kind: 'context',
		description: 'Content is clipped at the right edge (JS-toggled)',
	},
	{
		name: 'sf-is-overflow-bottom',
		kind: 'context',
		description: 'Content is clipped at the bottom edge (JS-toggled)',
	},
	{
		name: 'sf-is-overflow-left',
		kind: 'context',
		description: 'Content is clipped at the left edge (JS-toggled)',
	},
	{
		name: 'sf-is-overlay',
		kind: 'context',
		description:
			'Element is physically positioned over other content — author-declared; theme decides treatment (translucency, blur, etc.)',
	},
	{
		name: 'sf-is-sticky',
		kind: 'context',
		description:
			'Element is currently in its sticky/pinned position — JS-toggled; theme decides edge treatment (border, shadow, etc.)',
	},
	{
		name: 'sf-is-contained',
		kind: 'context',
		description:
			'Element sits inside a container that already provides visual boundary — author-declared; theme decides how to soften (default: drop own chrome)',
	},
	{
		name: 'sf-flush',
		kind: 'context',
		description:
			'Container holds content edge-to-edge — opt-out of chrome-class padding default. Wear alongside sf-depth-*.',
	},
	{
		name: 'sf-is-disabled',
		kind: 'context',
		description:
			'Author-declared disabled appearance — visually muted but remains interactive. For actually-disabled form controls, use sf-on-disabled with the disabled attribute instead.',
	},

	// Boundary / divide — content separation signal; theme decides the full treatment.
	// Bundle kind because themes may compose multi-property expressions (border + padding +
	// margin adjustment). Default rules below are single-property; the layer still allows
	// richer compositions via compound rules or per-theme overrides.
	{ name: 'sf-boundary-top', kind: 'bundle', description: 'Content boundary on top edge' },
	{ name: 'sf-boundary-bottom', kind: 'bundle', description: 'Content boundary on bottom edge' },
	{ name: 'sf-boundary-left', kind: 'bundle', description: 'Content boundary on left edge' },
	{ name: 'sf-boundary-right', kind: 'bundle', description: 'Content boundary on right edge' },
	{
		name: 'sf-boundary-x',
		kind: 'bundle',
		description: 'Content boundary on left and right edges',
	},
	{
		name: 'sf-boundary-y',
		kind: 'bundle',
		description: 'Content boundary on top and bottom edges',
	},
	{ name: 'sf-boundary', kind: 'bundle', description: 'Content boundary on all edges' },
	{
		name: 'sf-divide-x',
		kind: 'bundle',
		description: 'Visual separation between horizontally arranged children',
	},
	{
		name: 'sf-divide-y',
		kind: 'bundle',
		description: 'Visual separation between vertically arranged children',
	},

	// Layout primitives
	{ name: 'sl-stack', kind: 'layout', description: 'Vertical flex stack' },
	{ name: 'sl-cluster', kind: 'layout', description: 'Horizontal flex wrap' },
	{ name: 'sl-columns', kind: 'layout', description: 'Equal or custom-ratio grid columns' },
	{ name: 'sl-split', kind: 'layout', description: 'Fixed + flexible two-column split' },
	{ name: 'sl-center', kind: 'layout', description: 'Centered max-width block' },
	{ name: 'sl-grid', kind: 'layout', description: 'Auto-responsive grid' },
	{
		name: 'sl-aspect',
		kind: 'layout',
		description: 'Aspect-ratio box; set --sl-aspect on the element (developer escape hatch)',
	},
	{ name: 'sl-aspect-16-9', kind: 'layout', description: 'Aspect ratio 16:9 (widescreen)' },
	{ name: 'sl-aspect-4-3', kind: 'layout', description: 'Aspect ratio 4:3 (classic)' },
	{ name: 'sl-aspect-1-1', kind: 'layout', description: 'Aspect ratio 1:1 (square)' },
	{ name: 'sl-aspect-9-16', kind: 'layout', description: 'Aspect ratio 9:16 (portrait)' },

	// Collapse modifiers — vocabulary only; CSS is generated from breakpoint token values (no var() in @container)
	{
		name: 'sl-collapse-xs',
		kind: 'layout',
		description: 'Collapse to single column below xs breakpoint',
	},
	{
		name: 'sl-collapse-sm',
		kind: 'layout',
		description: 'Collapse to single column below sm breakpoint',
	},
	{
		name: 'sl-collapse-md',
		kind: 'layout',
		description: 'Collapse to single column below md breakpoint',
	},

	// Object-fit modifiers — vocabulary only; CSS uses child selectors that the
	// class_rules schema cannot express, so rules live as a static block in generateCss.ts.
	{
		name: 'sl-object-cover',
		kind: 'layout',
		description: 'Image fills the aspect box, cropped to cover',
	},
	{
		name: 'sl-object-contain',
		kind: 'layout',
		description: 'Image scaled to fit within the aspect box',
	},
	{
		name: 'sl-object-fill',
		kind: 'layout',
		description: 'Image stretched to fill the aspect box exactly',
	},
	{
		name: 'sl-object-none',
		kind: 'layout',
		description: 'Image at natural size, no object-fit applied',
	},
]

// ─── Rules (root theme defaults) ─────────────────────────────────────────
// Themes shift values through tokens; rules give classes their default
// property set. Compound rules (e.g., per-bundle variant specialisation)
// can be added per-theme without touching these.

type RuleSpec = ClassOnlyRuleInput | ElementRuleInput

const ROOT_RULES: RuleSpec[] = [
	// Depth bundles — background + elevation cues.
	// --sfx-surface-color is set alongside background so sf-is-overlay can add alpha without
	// needing to know which surface token the depth chose.
	// depth-0: canvas, no elevation
	{
		classNames: ['sf-depth-0'],
		cssProperty: '--sfx-surface-color',
		value: 'var(--sf-surface-0)',
	},
	{ classNames: ['sf-depth-0'], cssProperty: 'background', value: 'rgb(var(--sf-surface-0))' },

	// depth-1: cards, wells — background + shadow + radius
	// Border is intentionally absent at the default level; flat themes add one by overriding
	// box-shadow to none and adding border: 1px solid rgb(var(--sf-border_color)) instead.
	{
		classNames: ['sf-depth-1'],
		cssProperty: '--sfx-surface-color',
		value: 'var(--sf-surface-1)',
	},
	{ classNames: ['sf-depth-1'], cssProperty: '--sfx-depth-radius', value: 'var(--sf-radius-2)' },
	{ classNames: ['sf-depth-1'], cssProperty: 'background', value: 'rgb(var(--sf-surface-1))' },
	{
		classNames: ['sf-depth-1'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-md) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{ classNames: ['sf-depth-1'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	// Chrome classes both set --sf-padding (card-scale default) AND consume it. sf-size-*
	// worn on the same element overrides via cascade — same layer, same specificity, sf-size
	// wins by source order (its selector "sf-size-*" sorts after chrome-class selectors like
	// "sf-depth-*", "button.sf", "sf-field" in the generator's alphabetic emit). This
	// dependency on alphabetic ordering is fragile long-term — see [[project-seed-rule-order]].
	// Tight consumers (tooltips, drag handles, floating toolbars) opt in via sf-size-2xs /
	// sf-size-xs. Flush-content containers opt out via sf-flush. Node-view-wrapper reset
	// zeros --sf-padding to fence inheritance across primitive boundaries; a chrome class
	// on the wrapper itself wins by cascade layer. Follow-up: [[project-sl-padding]].
	{
		classNames: ['sf-depth-1'],
		cssProperty: '--sf-padding',
		value: 'var(--sf-spacing-md)',
	},
	{ classNames: ['sf-depth-1'], cssProperty: 'padding', value: 'var(--sf-padding)' },

	// depth-2: dropdowns, popovers — stronger shadow
	{
		classNames: ['sf-depth-2'],
		cssProperty: '--sfx-surface-color',
		value: 'var(--sf-surface-2)',
	},
	{ classNames: ['sf-depth-2'], cssProperty: '--sfx-depth-radius', value: 'var(--sf-radius-2)' },
	{ classNames: ['sf-depth-2'], cssProperty: 'background', value: 'rgb(var(--sf-surface-2))' },
	{
		classNames: ['sf-depth-2'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-lg) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{ classNames: ['sf-depth-2'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	{
		classNames: ['sf-depth-2'],
		cssProperty: '--sf-padding',
		value: 'var(--sf-spacing-md)',
	},
	{ classNames: ['sf-depth-2'], cssProperty: 'padding', value: 'var(--sf-padding)' },

	// depth-3: modals — strongest shadow
	{
		classNames: ['sf-depth-3'],
		cssProperty: '--sfx-surface-color',
		value: 'var(--sf-surface-3)',
	},
	{ classNames: ['sf-depth-3'], cssProperty: '--sfx-depth-radius', value: 'var(--sf-radius-3)' },
	{ classNames: ['sf-depth-3'], cssProperty: 'background', value: 'rgb(var(--sf-surface-3))' },
	{
		classNames: ['sf-depth-3'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-xl) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{ classNames: ['sf-depth-3'], cssProperty: 'border-radius', value: 'var(--sf-radius-3)' },
	{
		classNames: ['sf-depth-3'],
		cssProperty: '--sf-padding',
		value: 'var(--sf-spacing-md)',
	},
	{ classNames: ['sf-depth-3'], cssProperty: 'padding', value: 'var(--sf-padding)' },

	// Loudness bare rules — apply at any depth; compounds below refine per-surface behaviour.
	// loudness-1: muted foreground (low-attention text/element). Border cleared so text-only
	// tier has no visible chrome. Pairs with sf-on-hover for dim-at-rest, full-on-hover pattern.
	{
		classNames: ['sf-loudness-1'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary) / var(--sf-alpha-6))',
	},
	{ classNames: ['sf-loudness-1'], cssProperty: 'border-color', value: 'transparent' },

	// loudness-3 solid fill is button-only — see button.sf.sf-loudness-3 compound in the
	// element baseline section. For depth-1 surfaces, loudness-3 means stronger shadow + border
	// (handled by sf-depth-1 × sf-loudness-3 compounds below).

	// Loudness × depth-1 compounds — loudness-2 is the default (shadow-md, no border); no rule needed.
	{
		classNames: ['sf-depth-1', 'sf-loudness-3'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-lg) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{
		classNames: ['sf-depth-1', 'sf-loudness-3'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{ classNames: ['sf-depth-1', 'sf-loudness-1'], cssProperty: 'box-shadow', value: 'none' },
	{
		classNames: ['sf-depth-1', 'sf-loudness-1'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-border_color))',
	},

	// sf-depth-1 × sf-variant-alt-1 — flat with border; visually distinct from the default
	// elevated card without carrying a semantic attention claim.
	{ classNames: ['sf-depth-1', 'sf-variant-alt-1'], cssProperty: 'box-shadow', value: 'none' },
	{
		classNames: ['sf-depth-1', 'sf-variant-alt-1'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-border_color))',
	},

	// Size bundles — this theme spends size on --sf-padding (inheritable, read by layout
	// primitives). Another theme could just as validly express size via border weight or
	// gap. Shape stays out of size — border-radius comes from the element's own rule (bare
	// <button>, <input>) or an explicit sf-radius-* utility, so a compact breadcrumb button
	// stays square while a pill icon-button opts in via sf-radius-3.
	{ classNames: ['sf-size-2xs'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-2xs)' },
	{ classNames: ['sf-size-xs'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-xs)' },
	{ classNames: ['sf-size-sm'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-sm)' },
	{ classNames: ['sf-size-md'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-md)' },
	{ classNames: ['sf-size-lg'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-lg)' },
	{ classNames: ['sf-size-xl'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-xl)' },

	// Heading — font-size + line-height
	{ classNames: ['sf-heading-1'], cssProperty: 'font-size', value: 'var(--sf-text-4xl)' },
	{
		classNames: ['sf-heading-1'],
		cssProperty: 'line-height',
		value: 'var(--sf-leading-tight)',
	},
	{ classNames: ['sf-heading-2'], cssProperty: 'font-size', value: 'var(--sf-text-2xl)' },
	{ classNames: ['sf-heading-2'], cssProperty: 'line-height', value: 'var(--sf-leading-snug)' },
	{ classNames: ['sf-heading-3'], cssProperty: 'font-size', value: 'var(--sf-text-xl)' },
	{ classNames: ['sf-heading-3'], cssProperty: 'line-height', value: 'var(--sf-leading-snug)' },

	// sl-stack
	{ classNames: ['sl-stack'], cssProperty: 'display', value: 'flex' },
	{ classNames: ['sl-stack'], cssProperty: 'flex-direction', value: 'column' },
	{ classNames: ['sl-stack'], cssProperty: 'gap', value: 'var(--sf-gap, var(--sf-spacing-md))' },
	{ classNames: ['sl-stack'], cssProperty: 'container-type', value: 'inline-size' },

	// sl-cluster
	{ classNames: ['sl-cluster'], cssProperty: 'display', value: 'flex' },
	{ classNames: ['sl-cluster'], cssProperty: 'flex-wrap', value: 'wrap' },
	{
		classNames: ['sl-cluster'],
		cssProperty: 'gap',
		value: 'var(--sf-gap, var(--sf-spacing-md))',
	},
	{ classNames: ['sl-cluster'], cssProperty: 'align-items', value: 'center' },
	{ classNames: ['sl-cluster'], cssProperty: 'container-type', value: 'inline-size' },

	// sl-columns
	{ classNames: ['sl-columns'], cssProperty: 'display', value: 'grid' },
	{
		classNames: ['sl-columns'],
		cssProperty: 'grid-template-columns',
		value: 'var(--sl-cols, repeat(auto-fit, minmax(0, 1fr)))',
	},
	{
		classNames: ['sl-columns'],
		cssProperty: 'gap',
		value: 'var(--sf-gap, var(--sf-spacing-md))',
	},
	{ classNames: ['sl-columns'], cssProperty: 'container-type', value: 'inline-size' },

	// sl-split
	{ classNames: ['sl-split'], cssProperty: 'display', value: 'grid' },
	{
		classNames: ['sl-split'],
		cssProperty: 'grid-template-columns',
		value: 'var(--sl-template, auto 1fr)',
	},
	{ classNames: ['sl-split'], cssProperty: 'gap', value: 'var(--sf-gap, var(--sf-spacing-md))' },
	{ classNames: ['sl-split'], cssProperty: 'align-items', value: 'start' },
	{ classNames: ['sl-split'], cssProperty: 'container-type', value: 'inline-size' },

	// sl-center
	{ classNames: ['sl-center'], cssProperty: 'max-width', value: 'var(--sl-measure, 65ch)' },
	{ classNames: ['sl-center'], cssProperty: 'margin-inline', value: 'auto' },
	{
		classNames: ['sl-center'],
		cssProperty: 'padding-inline',
		value: 'var(--sf-padding)',
	},
	{ classNames: ['sl-center'], cssProperty: 'container-type', value: 'inline-size' },

	// sl-grid
	{ classNames: ['sl-grid'], cssProperty: 'display', value: 'grid' },
	{
		classNames: ['sl-grid'],
		cssProperty: 'grid-template-columns',
		value: 'repeat(auto-fit, minmax(var(--sl-min, 250px), 1fr))',
	},
	{ classNames: ['sl-grid'], cssProperty: 'gap', value: 'var(--sf-gap, var(--sf-spacing-md))' },
	{ classNames: ['sl-grid'], cssProperty: 'container-type', value: 'inline-size' },

	// sl-aspect presets (bare sl-aspect is developer escape hatch — no rule; author sets --sl-aspect inline)
	{ classNames: ['sl-aspect-16-9'], cssProperty: 'aspect-ratio', value: '16/9' },
	{ classNames: ['sl-aspect-4-3'], cssProperty: 'aspect-ratio', value: '4/3' },
	{ classNames: ['sl-aspect-1-1'], cssProperty: 'aspect-ratio', value: '1' },
	{ classNames: ['sl-aspect-9-16'], cssProperty: 'aspect-ratio', value: '9/16' },

	// Overflow context — mask-image applied to the scrolling element.
	// Arrows are component-level; ::before/::after rules can be added per-theme via the DB.
	// Same-axis compound rules handle both-edges case at higher specificity.
	{
		classNames: ['sf-is-overflow-left'],
		cssProperty: 'mask-image',
		value: 'linear-gradient(to right, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-right'],
		cssProperty: 'mask-image',
		value: 'linear-gradient(to left, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-left', 'sf-is-overflow-right'],
		cssProperty: 'mask-image',
		value: 'linear-gradient(to right, transparent, black 60px, black calc(100% - 60px), transparent)',
	},
	{
		classNames: ['sf-is-overflow-top'],
		cssProperty: 'mask-image',
		value: 'linear-gradient(to bottom, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		cssProperty: 'mask-image',
		value: 'linear-gradient(to top, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-top', 'sf-is-overflow-bottom'],
		cssProperty: 'mask-image',
		value: 'linear-gradient(to bottom, transparent, black 60px, black calc(100% - 60px), transparent)',
	},

	// Overlay context — reads --sfx-surface-color (bridge variable set by each depth bundle) so one
	// bare rule works at any depth without duplicating colour knowledge. Theme can compound
	// (e.g. sf-depth-3.sf-is-overlay) to override for specific depths where different treatment is needed.
	{
		classNames: ['sf-is-overlay'],
		cssProperty: 'background',
		value: 'rgb(var(--sfx-surface-color, var(--sf-surface-0)) / var(--sf-alpha-9))',
	},

	// Sticky context — clear the all-sides elevation shadow the depth bundle adds; edge treatment
	// (border-bottom, directional shadow) is theme territory — a bare border is the fallback so sticky
	// bars have a visible boundary without bleeding elevation into the page.
	{ classNames: ['sf-is-sticky'], cssProperty: 'box-shadow', value: 'none' },
	{
		classNames: ['sf-is-sticky'],
		cssProperty: 'border-bottom',
		value: '1px solid rgb(var(--sf-border_color))',
	},

	// Contained context — element sits inside a container that already delineates it.
	// Default treatment: drop own chrome (background, border). Theme is free to override
	// with a subtler treatment (reduced padding, muted colour, etc.). Element-agnostic — fires
	// on any tag that would otherwise draw its own container.
	{ classNames: ['sf-is-contained'], cssProperty: 'background', value: 'none' },
	{ classNames: ['sf-is-contained'], cssProperty: 'border-color', value: 'transparent' },
	// sf-is-contained × sf-is-overlay — contained takes priority over overlay's tinted
	// surface background. Both are single-class context rules; the compound wins by specificity.
	// Without this, the generator's alphabetical emission order lets sf-is-overlay overwrite
	// sf-is-contained's background: none at equal specificity.
	{ classNames: ['sf-is-contained', 'sf-is-overlay'], cssProperty: 'background', value: 'none' },
	// sf-is-contained × sf-boundary-right — contained element that still marks a directional
	// boundary (e.g. a toolbar slot handle with a right separator). sf-is-contained zeros
	// border-color; this compound restores the right side at higher specificity (2 vs 1 class).
	{
		classNames: ['sf-is-contained', 'sf-boundary-right'],
		cssProperty: 'border-right-color',
		value: 'rgb(var(--sf-border_color))',
	},

	// Flush context — opts out of chrome-class padding default. sf-context layer beats
	// sf-bundle's `padding: var(--sf-padding)` on sf-depth-*. --sf-padding also zeroed so
	// descendants that inherit it (sl-center, LayoutCard inner) don't see a stale value.
	{ classNames: ['sf-flush'], cssProperty: '--sf-padding', value: '0' },
	{ classNames: ['sf-flush'], cssProperty: 'padding', value: '0' },

	// Viewport-edge context — zero the corners that touch the boundary (specificity 0-1-0).
	// Three-side panel patterns restore the open-side corners via compound rules (0-3-0)
	// that read --sfx-depth-radius so they don't need to know which depth the element carries.
	{ classNames: ['sf-is-edge-top'], cssProperty: 'border-top-left-radius', value: '0' },
	{ classNames: ['sf-is-edge-top'], cssProperty: 'border-top-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-right'], cssProperty: 'border-top-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-right'], cssProperty: 'border-bottom-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-bottom'], cssProperty: 'border-bottom-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-bottom'], cssProperty: 'border-bottom-left-radius', value: '0' },
	{ classNames: ['sf-is-edge-left'], cssProperty: 'border-top-left-radius', value: '0' },
	{ classNames: ['sf-is-edge-left'], cssProperty: 'border-bottom-left-radius', value: '0' },
	// Right panel (flush top+right+bottom): all four corners touch an edge, but the left
	// corners are the "opening" side — restore them from the depth bundle's bridge variable.
	{
		classNames: ['sf-is-edge-top', 'sf-is-edge-right', 'sf-is-edge-bottom'],
		cssProperty: 'border-top-left-radius',
		value: 'var(--sfx-depth-radius, 0)',
	},
	{
		classNames: ['sf-is-edge-top', 'sf-is-edge-right', 'sf-is-edge-bottom'],
		cssProperty: 'border-bottom-left-radius',
		value: 'var(--sfx-depth-radius, 0)',
	},
	// Left panel (flush top+left+bottom): mirror — restore right corners.
	{
		classNames: ['sf-is-edge-top', 'sf-is-edge-left', 'sf-is-edge-bottom'],
		cssProperty: 'border-top-right-radius',
		value: 'var(--sfx-depth-radius, 0)',
	},
	{
		classNames: ['sf-is-edge-top', 'sf-is-edge-left', 'sf-is-edge-bottom'],
		cssProperty: 'border-bottom-right-radius',
		value: 'var(--sfx-depth-radius, 0)',
	},

	// Variants — semantic colour only (text tint). Fill weight comes from loudness × variant
	// compounds below. Bare variant with no loudness class = coloured text, no fill.
	{ classNames: ['sf-variant-featured'], cssProperty: 'color', value: 'rgb(var(--sf-primary))' },
	{ classNames: ['sf-variant-danger'], cssProperty: 'color', value: 'rgb(var(--sf-danger))' },
	{ classNames: ['sf-variant-warning'], cssProperty: 'color', value: 'rgb(var(--sf-warning))' },
	{ classNames: ['sf-variant-success'], cssProperty: 'color', value: 'rgb(var(--sf-success))' },

	// Loudness-1 × variant: dim the colour (muted text, no fill).
	{
		classNames: ['sf-loudness-1', 'sf-variant-featured'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-primary) / var(--sf-alpha-6))',
	},
	{
		classNames: ['sf-loudness-1', 'sf-variant-danger'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-danger) / var(--sf-alpha-6))',
	},
	{
		classNames: ['sf-loudness-1', 'sf-variant-warning'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-warning) / var(--sf-alpha-6))',
	},
	{
		classNames: ['sf-loudness-1', 'sf-variant-success'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-success) / var(--sf-alpha-6))',
	},

	// Loudness-2 × variant: outlined — featured gets tinted fill + coloured border;
	// danger/warning/success get a coloured border (text colour inherited from bare variant rule).
	{
		classNames: ['sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / var(--sf-alpha-2))',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-primary) / var(--sf-alpha-5))',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'box-shadow',
		value: 'none',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'color',
		value: 'inherit',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-danger'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-danger) / var(--sf-alpha-5))',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-warning'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-warning) / var(--sf-alpha-5))',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-success'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-success) / var(--sf-alpha-5))',
	},

	// Loudness-3 × variant: solid fill + inverted text.
	{
		classNames: ['sf-loudness-3', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary))',
	},
	{
		classNames: ['sf-loudness-3', 'sf-variant-featured'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},
	{
		classNames: ['sf-loudness-3', 'sf-variant-danger'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-danger))',
	},
	{
		classNames: ['sf-loudness-3', 'sf-variant-danger'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},
	{
		classNames: ['sf-loudness-3', 'sf-variant-warning'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-warning))',
	},
	{
		classNames: ['sf-loudness-3', 'sf-variant-warning'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},
	{
		classNames: ['sf-loudness-3', 'sf-variant-success'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-success))',
	},
	{
		classNames: ['sf-loudness-3', 'sf-variant-success'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},

	// Boundary — content separation signal; one rule per edge + shorthand composites.
	// Theme decides the full treatment; default is a 1px themed border.
	// sf-divide-* targets children via the pseudo field (> * + *).
	{
		classNames: ['sf-boundary-top'],
		cssProperty: 'border-top',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary-bottom'],
		cssProperty: 'border-bottom',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary-left'],
		cssProperty: 'border-left',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary-right'],
		cssProperty: 'border-right',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary-x'],
		cssProperty: 'border-left',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary-x'],
		cssProperty: 'border-right',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary-y'],
		cssProperty: 'border-top',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary-y'],
		cssProperty: 'border-bottom',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-boundary'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-divide-y'],
		pseudo: ' > * + *',
		cssProperty: 'border-top',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-divide-x'],
		pseudo: ' > * + *',
		cssProperty: 'border-left',
		value: '1px solid rgb(var(--sf-border_color))',
	},

	// Hover state — bare rules restore full-opacity foreground and add a subtle fill.
	// Compounds (e.g. sf-on-hover × sf-variant-featured) override per variant where needed.
	{ classNames: ['sf-on-hover'], cssProperty: 'color', value: 'rgb(var(--sf-fg_primary))' },
	{
		classNames: ['sf-on-hover'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-fg_primary) / var(--sf-alpha-1))',
	},
	// Hover × danger — override generic on-hover; keep danger colour; tinted danger fill.
	{
		classNames: ['sf-on-hover', 'sf-variant-danger'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-danger))',
	},
	{
		classNames: ['sf-on-hover', 'sf-variant-danger'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-danger) / var(--sf-alpha-1))',
	},

	// Hover × loudness-3 — darken the solid fill rather than overlaying fg_primary tint.
	// Three-class compounds (0-3-0) beat two-class hover × variant (0-2-0) in sf-state layer.
	{
		classNames: ['sf-on-hover', 'sf-loudness-3'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-fg_primary) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-featured'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-danger'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-danger) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-danger'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},

	// Hover × drag-handle — icon accents to primary; border stays themed (subtle hover signal).
	// Bare sf-on-hover rule already provides the fg_primary/alpha-1 background tint.
	{
		classNames: ['sf-drag-handle', 'sf-on-hover'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-primary))',
	},

	// Dragging state — primary accent throughout; tinted fill signals actively engaged.
	{
		classNames: ['sf-drag-handle', 'sf-on-dragging'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-primary))',
	},
	{
		classNames: ['sf-drag-handle', 'sf-on-dragging'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-primary))',
	},
	{
		classNames: ['sf-drag-handle', 'sf-on-dragging'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / var(--sf-alpha-1))',
	},
	// Dragging × contained — suppress the full-border primary; only right separator shows.
	{
		classNames: ['sf-drag-handle', 'sf-is-contained', 'sf-on-dragging'],
		cssProperty: 'border-color',
		value: 'transparent',
	},
	{
		classNames: ['sf-drag-handle', 'sf-is-contained', 'sf-on-dragging'],
		cssProperty: 'border-right-color',
		value: 'rgb(var(--sf-border_color))',
	},

	// Focus state — bordered inputs pick up a primary border on keyboard/click focus.
	// Vocabulary pseudo is :focus-visible; UAs treat form controls as always focus-visible.
	{
		classNames: ['sf-on-focus'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-primary))',
	},

	// Disabled state — dim + not-allowed cursor for interactive controls.
	// Vocabulary pseudo is :disabled so the class only fires on form elements
	// in their native disabled state (matches how sf-on-hover fires on :hover).
	{ classNames: ['sf-on-disabled'], cssProperty: 'opacity', value: '0.4' },
	{ classNames: ['sf-on-disabled'], cssProperty: 'cursor', value: 'not-allowed' },

	// Author-declared disabled appearance — class alone fires, no pseudo. Element remains
	// interactive (no cursor change). Use for muted-but-clickable elements at any loudness tier.
	{ classNames: ['sf-is-disabled'], cssProperty: 'opacity', value: '0.4' },

	// Selected state — bare rule gives the card/block-scale default: a thicker, softer
	// outline suitable for large content surfaces (editor node selection, section outlines).
	// Compounds with sf-size-2xs / sf-size-xs give the chip-scale chip pattern (thinner, saturated,
	// offset) — palette swatches, picker chips. No pseudo: persistent stateful class.
	{
		classNames: ['sf-on-selected'],
		cssProperty: 'outline',
		value: 'var(--sf-stroke-3) solid rgba(var(--sf-primary) / var(--sf-alpha-2))',
	},
	{
		classNames: ['sf-size-2xs', 'sf-on-selected'],
		cssProperty: 'outline',
		value: 'var(--sf-stroke-2) solid rgb(var(--sf-primary))',
	},
	{
		classNames: ['sf-size-2xs', 'sf-on-selected'],
		cssProperty: 'outline-offset',
		value: 'var(--sf-stroke-1)',
	},
	{
		classNames: ['sf-size-xs', 'sf-on-selected'],
		cssProperty: 'outline',
		value: 'var(--sf-stroke-2) solid rgb(var(--sf-primary))',
	},
	{
		classNames: ['sf-size-xs', 'sf-on-selected'],
		cssProperty: 'outline-offset',
		value: 'var(--sf-stroke-1)',
	},

	// Current state — tinted-primary fill (toolbar toggles, breadcrumb leaf, keyboard-highlighted menu item).
	// Reads as "this option is on right now" — distinct from sf-on-selected's outline chip.
	{
		classNames: ['sf-on-current'],
		cssProperty: 'background',
		value: 'rgba(var(--sf-primary) / var(--sf-alpha-1))',
	},
	{
		classNames: ['sf-on-current'],
		cssProperty: 'border-color',
		value: 'rgba(var(--sf-primary) / var(--sf-alpha-4))',
	},
	{ classNames: ['sf-on-current'], cssProperty: 'color', value: 'rgb(var(--sf-primary))' },

	// Hover × current — intensify the primary tint on the currently-selected item.
	// Without this compound, sf-on-current's bare rules would mask sf-on-hover's fg_primary
	// tint via source order, leaving current items unresponsive to pointer. Overriding only
	// background keeps color: primary and border-color: primary/alpha-4 from bare
	// sf-on-current — "current" identity is preserved while hover reads as intensification.
	{
		classNames: ['sf-on-hover', 'sf-on-current'],
		cssProperty: 'background',
		value: 'rgba(var(--sf-primary) / var(--sf-alpha-2))',
	},

	// Ancestor state — muted primary text, no fill. Reads as "on the trail to current".
	// Nav sidebars, breadcrumb non-leaf segments.
	{
		classNames: ['sf-on-ancestor'],
		cssProperty: 'color',
		value: 'rgba(var(--sf-primary) / var(--sf-alpha-7))',
	},

	// ─── Content-type markers ─────────────────────────────────────────────────
	// sf-icon: line-height:1 removes bleed so padding drives vertical spacing.
	// font-size inherits from context (no explicit rule); theme sets font-size on sf-icon
	// if a specific scale is wanted.
	{ classNames: ['sf-icon'], cssProperty: 'line-height', value: '1' },

	// sf-single-line: removes the half-leading that inflates apparent vertical spacing
	// when padding is tight. Applied to any element whose content is definitionally one
	// line — breadcrumb segments, inline labels, count chips.
	{ classNames: ['sf-single-line'], cssProperty: 'line-height', value: '1' },

	// sf-drag-handle: dim icon at rest; border marks its floating extent. Hover/drag state
	// compounds below in sf-state layer override the active treatment.
	{
		classNames: ['sf-drag-handle'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary) / var(--sf-alpha-4))',
	},
	{
		classNames: ['sf-drag-handle'],
		cssProperty: 'border',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-border_color))',
	},
	// sf-drag-handle × sf-is-contained — sits in toolbar slot; drop shadow and radius.
	// sf-is-contained already zeros border-color; sf-boundary-right restores the separator.
	{ classNames: ['sf-drag-handle', 'sf-is-contained'], cssProperty: 'box-shadow', value: 'none' },
	{ classNames: ['sf-drag-handle', 'sf-is-contained'], cssProperty: 'border-radius', value: '0' },

	// ─── Button element ───────────────────────────────────────────────────────
	// Baseline scoped to button.sf (sf membership marker) — Vuestic and other third-party
	// buttons are unaffected. Emits to sf-element (below sf-bundle) so bundles/variants/
	// states layered on top win predictably. Border establishes a visible ghost baseline;
	// sf-is-contained clears it (sf-context > sf-element); sf-loudness-1 also clears it.
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-2)',
	},
	// Card-scale default; sf-size-* on the same button overrides via source order.
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: '--sf-padding',
		value: 'var(--sf-spacing-md)',
	},
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: 'padding',
		value: 'var(--sf-padding)',
	},
	{ elementSelector: 'button', classNames: ['sf'], cssProperty: 'font', value: 'inherit' },
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-border_color) / var(--sf-alpha-4))',
	},
	{
		elementSelector: 'button',
		classNames: ['sf', 'sf-is-overlay'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-3)',
	},
	// Loudness-3 solid fill — button-only. Non-button elements (cards) get loudness-3 prominence
	// via sf-depth-1 × sf-loudness-3 shadow/border compounds; they keep their surface background.
	{
		elementSelector: 'button',
		classNames: ['sf', 'sf-loudness-3'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-fg_primary))',
	},
	{
		elementSelector: 'button',
		classNames: ['sf', 'sf-loudness-3'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},

	// ─── Input element ────────────────────────────────────────────────────────
	// input.sf carries only input-specific chrome. Shared editable-form-control baseline
	// (border, radius, padding-bridge, font, focus) lives on sf-field — text/select/textarea
	// wear `sf sf-field` together to opt in. accent-color stays on input.sf because it
	// applies to checkbox/radio/range which want the tint without full field chrome.
	{
		elementSelector: 'input',
		classNames: ['sf'],
		cssProperty: 'accent-color',
		value: 'rgb(var(--sf-primary))',
	},

	// ─── sf-chip ──────────────────────────────────────────────────────────────
	// Consumer wears `sf sf-chip` on the underlying element (button, span, etc.). Bare rule
	// carries the universal chip trait (tight leading). Chip-shape overrides are compound
	// rules scoped to the host element — button.sf-chip beats button.sf in the same
	// sf-element layer via source order (sf-chip seeded later), overriding button.sf's
	// r-2 / alpha-4 border with the chip's r-3 / alpha-3 without duplicating font, padding,
	// background, focus which button.sf already provides.
	{ classNames: ['sf-chip'], cssProperty: 'line-height', value: '1' },
	{
		elementSelector: 'button',
		classNames: ['sf-chip'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-3)',
	},
	{
		elementSelector: 'button',
		classNames: ['sf-chip'],
		cssProperty: 'border',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-border_color) / var(--sf-alpha-3))',
	},

	// ─── sf-swatch ────────────────────────────────────────────────────────────
	// Colour-surface tile — chrome only. Consumers set width/height (component metric).
	// Padding: 0 is root theme's default; a padded-frame theme overrides + adds background-clip.
	{ classNames: ['sf-swatch'], cssProperty: 'padding', value: '0' },
	{
		classNames: ['sf-swatch'],
		cssProperty: 'border',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-border_color) / var(--sf-alpha-2))',
	},
	{ classNames: ['sf-swatch'], cssProperty: 'border-radius', value: 'var(--sf-radius-1)' },

	// Swatch hover — outline ring keeps the swatch's own colour intact (bare sf-on-hover
	// bg tint would be masked by the inline background-color anyway; ring gives real feedback).
	{
		classNames: ['sf-swatch', 'sf-on-hover'],
		cssProperty: 'outline',
		value: 'var(--sf-stroke-2) solid rgb(var(--sf-primary) / var(--sf-alpha-4))',
	},
	{
		classNames: ['sf-swatch', 'sf-on-hover'],
		cssProperty: 'outline-offset',
		value: 'var(--sf-stroke-1)',
	},

	// ─── sf-scrim ─────────────────────────────────────────────────────────────
	// Modal backdrop. Black tint darkens regardless of theme; alpha via token.
	// backdrop-filter blur value is scrim-specific chrome — if blur becomes multi-use
	// across the vocabulary, introduce a --sf-blur-* scale.
	{
		classNames: ['sf-scrim'],
		cssProperty: 'background',
		value: 'rgb(0 0 0 / var(--sf-alpha-5))',
	},
	{ classNames: ['sf-scrim'], cssProperty: 'backdrop-filter', value: 'blur(8px)' },

	// ─── sf-content-frame ─────────────────────────────────────────────────────
	// Frame around focusable content (CodeMirror, TipTap, contenteditable, iframe).
	// The frame itself isn't focusable; :focus-within surfaces descendant focus as a
	// primary-tinted border. Consumer keeps layout / overflow / transition scoped.
	{
		classNames: ['sf-content-frame'],
		cssProperty: 'border',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-content-frame'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-1)',
	},
	{
		classNames: ['sf-content-frame'],
		pseudo: ':focus-within',
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-primary))',
	},

	// ─── sf-field ─────────────────────────────────────────────────────────────
	// Shared editable-form-control chrome. Consumers on <input>, <select>, <textarea>
	// wear this alongside sf-size-* for padding scale. Element-specific extras
	// (select chevron etc.) live in compound rules below in the same layer.
	{ classNames: ['sf-field'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	{ classNames: ['sf-field'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-md)' },
	{ classNames: ['sf-field'], cssProperty: 'padding', value: 'var(--sf-padding)' },
	{ classNames: ['sf-field'], cssProperty: 'font', value: 'inherit' },
	{
		classNames: ['sf-field'],
		cssProperty: 'border',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-field'],
		pseudo: ':focus-visible',
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary))',
	},
	{
		classNames: ['sf-field'],
		pseudo: ':focus-visible',
		cssProperty: 'background-color',
		value: 'rgba(var(--sf-fg_primary) / var(--sf-alpha-1))',
	},
	// Placeholder — muted foreground tint so hint text reads as inactive.
	{
		classNames: ['sf-field'],
		pseudo: '::placeholder',
		cssProperty: 'color',
		value: 'rgba(var(--sf-fg_primary) / var(--sf-alpha-5))',
	},

	// select.sf-field — chevron indicator + right-padding to clear it. Element-scoped
	// so only selects get these; sits in sf-bundle (via sf-field kind), higher
	// specificity than bare .sf-field so padding-right wins its longhand cascade.
	// currentColor via two crossed linear-gradients — URL-referenced SVGs don't inherit
	// currentColor cross-browser, and a hard-coded hex would fight themes. `appearance: none`
	// is in the reset layer (structural browser-strip, not theme concern).
	{
		elementSelector: 'select',
		classNames: ['sf-field'],
		cssProperty: 'background-image',
		value: 'linear-gradient(135deg, transparent 50%, currentColor 50%), linear-gradient(45deg, currentColor 50%, transparent 50%)',
	},
	{
		elementSelector: 'select',
		classNames: ['sf-field'],
		cssProperty: 'background-position',
		value: 'calc(100% - 13px) 50%, calc(100% - 8px) 50%',
	},
	{
		elementSelector: 'select',
		classNames: ['sf-field'],
		cssProperty: 'background-size',
		value: '5px 5px',
	},
	{
		elementSelector: 'select',
		classNames: ['sf-field'],
		cssProperty: 'background-repeat',
		value: 'no-repeat',
	},
	{
		elementSelector: 'select',
		classNames: ['sf-field'],
		cssProperty: 'padding-right',
		value: 'calc(var(--sf-padding) + var(--sf-spacing-md))',
	},

	// ─── Horizontal rule ──────────────────────────────────────────────────────
	// Baseline scoped to hr.sf so editor content and third-party <hr> keep UA styling
	// unless they opt in. Normalizes UA inset border and clears UA margin so external
	// spacing is entirely the parent layout's decision (sl-stack + sf-gap-*).
	{ elementSelector: 'hr', classNames: ['sf'], cssProperty: 'height', value: '0' },
	{ elementSelector: 'hr', classNames: ['sf'], cssProperty: 'border', value: '0' },
	{
		elementSelector: 'hr',
		classNames: ['sf'],
		cssProperty: 'border-top',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-border_color))',
	},
	{ elementSelector: 'hr', classNames: ['sf'], cssProperty: 'margin', value: '0' },

	// ─── Table elements ───────────────────────────────────────────────────────
	// Theme-wide defaults for data tables. border-collapse:separate + border-spacing:0 is
	// required so that box-shadow works on sticky <td> cells (collapse merges cell paint layers
	// which clips overflow; separate gives each cell its own box).
	// depth controls surface colour and corners; sf-is-overflow-left drives the sticky-column
	// shadow; border-bottom on tr:last-child td removes the orphan bottom edge.
	{ elementSelector: 'table', cssProperty: 'border-collapse', value: 'separate' },
	{ elementSelector: 'table', cssProperty: 'border-spacing', value: '0' },
	{
		elementSelector: 'td',
		cssProperty: 'border-bottom',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{ elementSelector: 'td', cssProperty: 'vertical-align', value: 'middle' },
	{
		elementSelector: 'td',
		cssProperty: 'padding',
		value: 'var(--sf-spacing-xs) var(--sf-spacing-sm)',
	},
	{
		elementSelector: 'tr',
		pseudo: ':last-child td',
		cssProperty: 'border-bottom',
		value: 'none',
	},
	{
		elementSelector: 'th',
		cssProperty: 'border-bottom',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{ elementSelector: 'th', cssProperty: 'text-align', value: 'left' },
	{ elementSelector: 'th', cssProperty: 'vertical-align', value: 'middle' },
	{ elementSelector: 'th', cssProperty: 'font-weight', value: '600' },
	{
		elementSelector: 'th',
		cssProperty: 'padding',
		value: 'var(--sf-spacing-xs) var(--sf-spacing-sm)',
	},

	// depth-1 × th — compact admin/data-table header treatment.
	// Specificity 0-1-1 beats bare th (0-0-1); content tables outside a depth surface are unaffected.
	{
		classNames: ['sf-depth-1'],
		pseudo: ' th',
		cssProperty: 'font-size',
		value: 'var(--sf-text-xs)',
	},
	{
		classNames: ['sf-depth-1'],
		pseudo: ' th',
		cssProperty: 'text-transform',
		value: 'uppercase',
	},
	{
		classNames: ['sf-depth-1'],
		pseudo: ' th',
		cssProperty: 'letter-spacing',
		value: 'var(--sf-tracking-wide)',
	},
	{
		classNames: ['sf-depth-1'],
		pseudo: ' th',
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary) / var(--sf-alpha-5))',
	},
	{ classNames: ['sf-depth-1'], pseudo: ' th', cssProperty: 'user-select', value: 'none' },
	{ classNames: ['sf-depth-1'], pseudo: ' th', cssProperty: 'white-space', value: 'nowrap' },
]

// ─── Collapse thresholds ─────────────────────────────────────────────────
// System config — not theme data. Seeded idempotently (upsert); not wiped
// by wipeDesignSystem so user edits survive a theme reseed.

const COLLAPSE_THRESHOLDS = [
	{ name: 'xs', value: '380px' },
	{ name: 'sm', value: '640px' },
	{ name: 'md', value: '768px' },
] as const

function applyRule(db: Db, themeId: string, r: RuleSpec) {
	return createClassRule(db, { themeId, ...r })
}

// ─── Orchestrator ────────────────────────────────────────────────────────

async function ensureBrandUser(db: Db): Promise<number> {
	const existing = await db
		.select({ userId: users.userId })
		.from(users)
		.where(eq(users.email, BRAND_USER_EMAIL))
		.get()
	if (existing) return existing.userId
	const created = await db
		.insert(users)
		.values({ name: BRAND_USER_NAME, email: BRAND_USER_EMAIL })
		.returning({ userId: users.userId })
		.get()
	return created.userId
}

async function wipeDesignSystem(db: Db): Promise<void> {
	// Themes cascade: theme_tokens, class_rules → class_rule_classes, user_theme_aliases
	await db.delete(themes)
	// Vocabulary stands alone after rules are gone (no junction rows reference it)
	await db.delete(classVocabulary)
}

export async function seed(db: Db) {
	const brandUserId = await ensureBrandUser(db)

	await wipeDesignSystem(db)

	await createTheme(db, {
		id: ROOT_ID,
		name: 'Root',
		isRoot: true,
		version: SEED_VERSION,
		createdBy: brandUserId,
	})
	await createTheme(db, {
		id: DARK_ID,
		name: 'Dark',
		activationClass: 'theme-dark',
		createdBy: brandUserId,
	})
	await createTheme(db, {
		id: PINK_ID,
		name: 'Pink',
		activationClass: 'theme-pink',
		createdBy: brandUserId,
	})

	let tokensSet = 0
	for (const t of ROOT_TOKENS) {
		await setToken(db, { themeId: ROOT_ID, ...t })
		tokensSet++
	}
	for (const t of DARK_TOKEN_OVERRIDES) {
		await setToken(db, { themeId: DARK_ID, ...t })
		tokensSet++
	}
	for (const t of PINK_TOKEN_OVERRIDES) {
		await setToken(db, { themeId: PINK_ID, ...t })
		tokensSet++
	}

	for (const v of VOCABULARY) {
		await addVocabularyEntry(db, v)
	}

	let rulesCreated = 0
	for (const r of ROOT_RULES) {
		await applyRule(db, ROOT_ID, r)
		rulesCreated++
	}

	for (const t of COLLAPSE_THRESHOLDS) {
		await setCollapseThreshold(db, t.name, t.value)
	}

	return {
		brandUserId,
		themesCreated: 3,
		tokensSet,
		vocabularyEntries: VOCABULARY.length,
		rulesCreated,
		collapseStepsSeeded: COLLAPSE_THRESHOLDS.length,
	}
}
