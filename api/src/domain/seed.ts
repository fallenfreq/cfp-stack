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
	{ name: '--sf-spacing-xs', value: '0.5rem', kind: 'length' },
	{ name: '--sf-spacing-sm', value: '0.75rem', kind: 'length' },
	{ name: '--sf-spacing-md', value: '1.25rem', kind: 'length' },
	{ name: '--sf-spacing-lg', value: '2rem', kind: 'length' },
	{ name: '--sf-spacing-xl', value: '3rem', kind: 'length' },

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

	// Loudness bundles — attention hierarchy among sibling content blocks; theme decides expression
	{
		name: 'sf-loudness-1',
		kind: 'bundle',
		description: 'Highest attention — most visual weight',
	},
	{ name: 'sf-loudness-2', kind: 'bundle', description: 'Moderate attention — default weight' },
	{ name: 'sf-loudness-3', kind: 'bundle', description: 'Lowest attention — de-emphasised' },

	// Size bundles — form factor; theme decides padding and radius per step
	{ name: 'sf-size-xs', kind: 'bundle', description: 'Pill, badge, icon button' },
	{ name: 'sf-size-sm', kind: 'bundle', description: 'Compact — small button, tag' },
	{ name: 'sf-size-md', kind: 'bundle', description: 'Standard form factor' },
	{ name: 'sf-size-lg', kind: 'bundle', description: 'Large — featured tile' },
	{ name: 'sf-size-xl', kind: 'bundle', description: 'Hero scale' },

	// Variants
	{
		name: 'sf-variant-featured',
		kind: 'variant',
		description: 'Prominent, calls for attention',
	},
	{ name: 'sf-variant-subtle', kind: 'variant', description: 'Deemphasised, secondary' },
	{ name: 'sf-variant-danger', kind: 'variant', description: 'Destructive or warning' },

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
	{ name: 'sf-on-disabled', kind: 'state', pseudo: null, description: 'Disabled state modifier' },

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

	// Layout primitives
	{ name: 'sl-stack', kind: 'layout', description: 'Vertical flex stack' },
	{ name: 'sl-cluster', kind: 'layout', description: 'Horizontal flex wrap' },
	{ name: 'sl-columns', kind: 'layout', description: 'Equal or custom-ratio grid columns' },
	{ name: 'sl-split', kind: 'layout', description: 'Fixed + flexible two-column split' },
	{ name: 'sl-center', kind: 'layout', description: 'Centered max-width block' },
	{ name: 'sl-grid', kind: 'layout', description: 'Auto-responsive grid' },

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
]

// ─── Rules (root theme defaults) ─────────────────────────────────────────
// Themes shift values through tokens; rules give classes their default
// property set. Compound rules (e.g., per-bundle variant specialisation)
// can be added per-theme without touching these.

type RuleSpec = ClassOnlyRuleInput | ElementRuleInput

const ROOT_RULES: RuleSpec[] = [
	// Depth bundles — background + elevation cues
	// depth-0: canvas, no elevation
	{ classNames: ['sf-depth-0'], cssProperty: 'background', value: 'rgb(var(--sf-surface-0))' },

	// depth-1: cards, wells — background + shadow + radius
	// Border is intentionally absent at the default level; flat themes add one by overriding
	// box-shadow to none and adding border: 1px solid rgb(var(--sf-border_color)) instead.
	{ classNames: ['sf-depth-1'], cssProperty: 'background', value: 'rgb(var(--sf-surface-1))' },
	{
		classNames: ['sf-depth-1'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-md) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{ classNames: ['sf-depth-1'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },

	// depth-2: dropdowns, popovers — stronger shadow
	{ classNames: ['sf-depth-2'], cssProperty: 'background', value: 'rgb(var(--sf-surface-2))' },
	{
		classNames: ['sf-depth-2'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-lg) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{ classNames: ['sf-depth-2'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },

	// depth-3: modals — strongest shadow
	{ classNames: ['sf-depth-3'], cssProperty: 'background', value: 'rgb(var(--sf-surface-3))' },
	{
		classNames: ['sf-depth-3'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-xl) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{ classNames: ['sf-depth-3'], cssProperty: 'border-radius', value: 'var(--sf-radius-3)' },

	// Rank × depth-1 compounds — express attention difference through elevation cues.
	// loudness-2 is the default depth-1 treatment (shadow-md, no border); no rule needed.
	{
		classNames: ['sf-depth-1', 'sf-loudness-1'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-lg) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{
		classNames: ['sf-depth-1', 'sf-loudness-1'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-border_color))',
	},
	{ classNames: ['sf-depth-1', 'sf-loudness-3'], cssProperty: 'box-shadow', value: 'none' },
	{
		classNames: ['sf-depth-1', 'sf-loudness-3'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-border_color))',
	},

	// Depth-1 × variant-featured — tinted card; overrides the bare featured solid-primary
	// background in sf-variant layer via higher specificity (compound beats bare rule).
	{
		classNames: ['sf-depth-1', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / var(--sf-alpha-2))',
	},
	{
		classNames: ['sf-depth-1', 'sf-variant-featured'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-primary) / var(--sf-alpha-5))',
	},
	{ classNames: ['sf-depth-1', 'sf-variant-featured'], cssProperty: 'box-shadow', value: 'none' },
	{ classNames: ['sf-depth-1', 'sf-variant-featured'], cssProperty: 'color', value: 'inherit' },

	// Size bundles — sets --sf-padding (inheritable, read by layout primitives) + border-radius
	{ classNames: ['sf-size-xs'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-xs)' },
	{ classNames: ['sf-size-xs'], cssProperty: 'border-radius', value: 'var(--sf-radius-3)' },
	{ classNames: ['sf-size-sm'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-sm)' },
	{ classNames: ['sf-size-sm'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	{ classNames: ['sf-size-md'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-md)' },
	{ classNames: ['sf-size-md'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	{ classNames: ['sf-size-lg'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-lg)' },
	{ classNames: ['sf-size-lg'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	{ classNames: ['sf-size-xl'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-xl)' },
	{ classNames: ['sf-size-xl'], cssProperty: 'border-radius', value: 'var(--sf-radius-3)' },

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
		value: 'var(--sf-padding, var(--sf-spacing-md))',
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

	// Viewport-edge context — zero the corners that touch the boundary; theme may override per-corner.
	{ classNames: ['sf-is-edge-top'], cssProperty: 'border-top-left-radius', value: '0' },
	{ classNames: ['sf-is-edge-top'], cssProperty: 'border-top-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-right'], cssProperty: 'border-top-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-right'], cssProperty: 'border-bottom-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-bottom'], cssProperty: 'border-bottom-right-radius', value: '0' },
	{ classNames: ['sf-is-edge-bottom'], cssProperty: 'border-bottom-left-radius', value: '0' },
	{ classNames: ['sf-is-edge-left'], cssProperty: 'border-top-left-radius', value: '0' },
	{ classNames: ['sf-is-edge-left'], cssProperty: 'border-bottom-left-radius', value: '0' },

	// Variants — minimal property set; themes can extend per-bundle compound rules
	{
		classNames: ['sf-variant-featured'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary))',
	},
	{
		classNames: ['sf-variant-featured'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},
	{
		classNames: ['sf-variant-subtle'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary) / var(--sf-alpha-6))',
	},
	{
		classNames: ['sf-variant-danger'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-danger))',
	},
	{
		classNames: ['sf-variant-danger'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_inverted))',
	},
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
	if (r.elementSelector) return createClassRule(db, { themeId, ...r })
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
