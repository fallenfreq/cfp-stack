import type { Db } from '../db.js'
import { classVocabulary, themes } from '../schemas/theme.js'
import {
	type ClassOnlyRuleInput,
	type ElementRuleInput,
	addVocabularyEntry,
	createClassRuleTrusted,
} from './classRules.js'
import { setCollapseThreshold } from './collapseThresholds.js'
import { SEED_VERSION } from './seedVersion.js'
import { createTheme } from './themes.js'
import { setToken } from './themeTokens.js'
import { type ClassKind, type TokenKind } from './types.js'

// ─── Fixture identities ──────────────────────────────────────────────────
// Themes use stable UUIDs so the seed is reproducible across environments.

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
	// Page margin — room between the screen's side edges and content. A theme decision, read
	// by sl-inset / sl-inset-line so everything spanning the screen shares one line. The app
	// also puts it above the header and between the header, the page and the footer. Must be a
	// length (clamp()/vw fine), not a percentage: tracks and padding resolve % differently.
	{ name: '--sf-spacing_page', value: 'var(--sf-spacing-lg)', kind: 'length' },
	// Page width — the widest the page's content column gets. Past it the column centres and
	// the margins grow; bands (sl-bleed) still reach the screen edges. A theme decision; a
	// very large length turns the limit off.
	{ name: '--sf-width_page', value: '80rem', kind: 'length' },

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

	// Primary palette: soft lilac. The brand's fill is step 4 and its ink step 6 (sf-system.md,
	// "Fill and ink").
	{ name: '--sf-primary-1', value: '242 234 255', kind: 'color-triplet' },
	{ name: '--sf-primary-2', value: '230 215 255', kind: 'color-triplet' },
	{ name: '--sf-primary-3', value: '217 191 255', kind: 'color-triplet' },
	{ name: '--sf-primary-4', value: '200 165 255', kind: 'color-triplet' },
	{ name: '--sf-primary-5', value: '178 143 232', kind: 'color-triplet' },
	{ name: '--sf-primary-6', value: '156 122 208', kind: 'color-triplet' },
	{ name: '--sf-primary-7', value: '130 97 177', kind: 'color-triplet' },
	{ name: '--sf-primary-8', value: '105 77 145', kind: 'color-triplet' },
	{ name: '--sf-primary-9', value: '84 60 117', kind: 'color-triplet' },

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

	// Alpha (theme-controlled values) — used for channel tinting (colour, border, shadow).
	// Ordinal scale: consumers reference step number (1st, 2nd, ...); theme picks values.
	{ name: '--sf-alpha-1', value: '0.1', kind: 'number' },
	{ name: '--sf-alpha-2', value: '0.2', kind: 'number' },
	{ name: '--sf-alpha-3', value: '0.3', kind: 'number' },
	{ name: '--sf-alpha-4', value: '0.4', kind: 'number' },
	{ name: '--sf-alpha-5', value: '0.5', kind: 'number' },
	{ name: '--sf-alpha-6', value: '0.6', kind: 'number' },
	{ name: '--sf-alpha-7', value: '0.7', kind: 'number' },
	{ name: '--sf-alpha-8', value: '0.8', kind: 'number' },
	{ name: '--sf-alpha-9', value: '0.9', kind: 'number' },

	// Opacity (theme-controlled values) — used for element-wide opacity. Design-tuned
	// non-linear tiers: the first step is a ghost/watermark, then subtle, muted, half,
	// strong, near-solid, almost-full. Spacing tightens at both ends because designers
	// pick clusters of useful opacities rather than uniform linear steps. Independent of
	// --sf-alpha-* so themes can tune the two concerns separately.
	{ name: '--sf-opacity-1', value: '0.05', kind: 'number' },
	{ name: '--sf-opacity-2', value: '0.15', kind: 'number' },
	{ name: '--sf-opacity-3', value: '0.3', kind: 'number' },
	{ name: '--sf-opacity-4', value: '0.5', kind: 'number' },
	{ name: '--sf-opacity-5', value: '0.7', kind: 'number' },
	{ name: '--sf-opacity-6', value: '0.85', kind: 'number' },
	{ name: '--sf-opacity-7', value: '0.95', kind: 'number' },

	// Font weight
	{ name: '--sf-weight-1', value: '400', kind: 'number' },
	{ name: '--sf-weight-2', value: '500', kind: 'number' },
	{ name: '--sf-weight-3', value: '600', kind: 'number' },
	{ name: '--sf-weight-4', value: '700', kind: 'number' },

	// Radius
	{ name: '--sf-radius-0', value: '0px', kind: 'length' },
	{ name: '--sf-radius-full', value: '9999px', kind: 'length' },
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
	{ name: '--sf-primary', value: 'var(--sf-primary-4)', kind: 'color-triplet' },
	{ name: '--sf-border_color', value: '222 229 242', kind: 'color-triplet' },
	{ name: '--sf-shadow', value: '0 0 0', kind: 'color-triplet' },
	// Colour roles. Each has a fill, which paints a surface (a loud button, a tint), and an ink,
	// which draws a line or mark on the page and reaches 3:1 on its background (sf-system.md,
	// "Fill and ink"). An ink that equals its fill points at it, so it follows a theme's fill.
	{ name: '--sf-primary_ink', value: 'var(--sf-primary-6)', kind: 'color-triplet' },
	{ name: '--sf-danger', value: '200 16 58', kind: 'color-triplet' },
	{ name: '--sf-danger_ink', value: 'var(--sf-danger)', kind: 'color-triplet' },
	{ name: '--sf-warning', value: '245 158 11', kind: 'color-triplet' },
	{ name: '--sf-warning_ink', value: '214 110 0', kind: 'color-triplet' },
	{ name: '--sf-success', value: '34 197 94', kind: 'color-triplet' },
	{ name: '--sf-success_ink', value: '8 160 72', kind: 'color-triplet' },
	{ name: '--sf-info', value: '37 99 235', kind: 'color-triplet' },
	{ name: '--sf-info_ink', value: 'var(--sf-info)', kind: 'color-triplet' },
	// Text on a solid fill of each colour role; set to whatever reads on that fill.
	{ name: '--sf-fg_on_primary', value: '38 40 36', kind: 'color-triplet' },
	{ name: '--sf-fg_on_danger', value: '255 255 255', kind: 'color-triplet' },
	{ name: '--sf-fg_on_warning', value: '38 40 36', kind: 'color-triplet' },
	{ name: '--sf-fg_on_success', value: '38 40 36', kind: 'color-triplet' },
	{ name: '--sf-fg_on_info', value: '255 255 255', kind: 'color-triplet' },
]

const DARK_TOKEN_OVERRIDES: TokenSpec[] = [
	{ name: '--sf-fg_primary', value: '241 241 241', kind: 'color-triplet' },
	{ name: '--sf-fg_inverted', value: '11 18 26', kind: 'color-triplet' },
	{ name: '--sf-border_color', value: '61 76 88', kind: 'color-triplet' },
	// The fills reach 3:1 on the dark page, so most inks are their fills here.
	{ name: '--sf-primary_ink', value: 'var(--sf-primary)', kind: 'color-triplet' },
	{ name: '--sf-danger_ink', value: '239 68 68', kind: 'color-triplet' },
	{ name: '--sf-warning_ink', value: 'var(--sf-warning)', kind: 'color-triplet' },
	{ name: '--sf-success_ink', value: 'var(--sf-success)', kind: 'color-triplet' },
	{ name: '--sf-info_ink', value: '59 130 246', kind: 'color-triplet' },
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
	{ name: '--sf-fg_on_primary', value: '255 230 240', kind: 'color-triplet' },
]

// ─── Vocabulary ──────────────────────────────────────────────────────────

interface VocabSpec {
	name: string
	kind: ClassKind
	pseudo?: string | null
	description?: string
	// Tie-break within a layer: higher wins over equal-specificity classes. Set it on
	// modifiers so they beat what they modify, whatever the names. Default 0.
	cascadeOrder?: number
}

// Modifiers that must win ties against the classes they modify.
const MODIFIER_ORDER = 10

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
	{
		name: 'sf-size-2xs',
		kind: 'bundle',
		cascadeOrder: MODIFIER_ORDER,
		description: 'Very tight — breadcrumb, dense chip',
	},
	{
		name: 'sf-size-xs',
		kind: 'bundle',
		cascadeOrder: MODIFIER_ORDER,
		description: 'Compact — icon button, small tag',
	},
	{
		name: 'sf-size-sm',
		kind: 'bundle',
		cascadeOrder: MODIFIER_ORDER,
		description: 'Small — small button',
	},
	{
		name: 'sf-size-md',
		kind: 'bundle',
		cascadeOrder: MODIFIER_ORDER,
		description: 'Standard density',
	},
	{
		name: 'sf-size-lg',
		kind: 'bundle',
		cascadeOrder: MODIFIER_ORDER,
		description: 'Large — featured tile',
	},
	{ name: 'sf-size-xl', kind: 'bundle', cascadeOrder: MODIFIER_ORDER, description: 'Hero scale' },

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
		cascadeOrder: MODIFIER_ORDER,
		description:
			'A compact unit standing for an input, attribute or action — an entered item, a filter, a choice, a suggestion. Any element: static on a <span>, or with sf on a <button> or <a> (compounds like button.sf-chip keep the chip shape). Wear with sf-single-line; for a category, state or count use sf-tag, sf-status, sf-counter.',
	},
	{
		name: 'sf-switch',
		kind: 'element',
		description:
			'On/off switch track. Wear alongside sf on a <button role="switch">; button.sf is the floor, the switch adds its shape. sf-on-current marks it on.',
	},
	{
		name: 'sf-thumb',
		kind: 'element',
		description:
			'The knob that moves along a track (a switch knob, a custom slider handle). May hold an icon. sf-on-current marks its track as on.',
	},
	{
		name: 'sf-toast',
		kind: 'element',
		description:
			'A short message that pops up over the page and goes away by itself (a toast). Worn with sf-depth-*, sf-is-overlay, a loudness and a variant for its kind; the hook themes style toasts by. Its own default: bold text, since a toast is glanced at.',
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
		name: 'sf-text-block',
		kind: 'element',
		description:
			'Non-semantic wrapper holds text — declares text-holder intent on <span>/<div> containers (tooltip, label, badge). Semantic text elements (<p>, <blockquote>, <li>) do not need this.',
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
			'Content is a small colour-surface tile — palette chip, preview. Theme decides border, radius, padding; consumers set width/height.',
	},
	{
		name: 'sf-tag',
		kind: 'element',
		description:
			'A short label naming a category the item belongs to. Read-only; wear with sf-single-line and a size.',
	},
	{
		name: 'sf-status',
		kind: 'element',
		description:
			'A short label saying what state something is in (verified, draft, failed). Read-only; wear with sf-single-line and a size.',
	},
	{
		name: 'sf-counter',
		kind: 'element',
		description:
			'A short label holding a count (3 unread, +2 more). Read-only; wear with sf-single-line and a size.',
	},
	{
		name: 'sf-badge',
		kind: 'element',
		description:
			"A mark saying there is something to look at, with nothing in it, in the line where it's written. Over a box, it wears sl-over, the align words for its corner, and sf-is-overlay. Its shape, size and colour are the theme's; a count is a counter (sf-counter).",
	},
	{
		name: 'sf-avatar',
		kind: 'element',
		description:
			'User / entity identity indicator — solid-fill compact element holding initials, photo, or icon. Theme decides shape (round by default), default colours, layout. Wear alongside sf-variant-* for the colour role; consumers set width/height.',
	},
	{
		name: 'sf-field',
		kind: 'element',
		description:
			'Editable form-control chrome shared by input, select, textarea — border, radius, font, padding-bridge. Wear alongside sf on form elements that want field chrome (checkbox/radio/range wear sf alone for accent-color only). Element-specific additions (chevron on select) via compound rules like select.sf-field.',
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
	{
		name: 'sf-variant-primary',
		kind: 'variant',
		description:
			"Primary colour role — the theme's brand colour, at any loudness (solid, tinted, text). Not a promotion claim; that's featured.",
	},
	{
		name: 'sf-variant-danger',
		kind: 'variant',
		description: 'Danger role — destructive intent, error state, or reporting a problem/threat',
	},
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
	{
		name: 'sf-variant-info',
		kind: 'variant',
		description:
			'Info role — something to know that is neither good nor bad news: a hint, a tip, a status',
	},
	// alt-1 = peer differentiation. The semantic is "distinguish from a sibling without
	// asserting hierarchy or role" — zebra rows, alternating category cards, tab-vs-tab
	// separation. Content with an established semantic (danger, success, featured, or an
	// HTML element like <small>) should use the appropriate role, not alt.
	// Numbered from the start so alt-2 etc. can be added without breaking existing content.
	{
		name: 'sf-variant-alt-1',
		kind: 'variant',
		description:
			'Peer differentiation — visually distinguish this element from a sibling without asserting hierarchy',
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
		// Pressing happens while hovering: the press must win the tie.
		cascadeOrder: MODIFIER_ORDER,
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
		description:
			'The chosen option of a set: it sets a value — a colour swatch, a font size, a tab. Not things gathered to act on (sf-on-targeted). Author/JS-toggled, no pseudo.',
	},
	{
		name: 'sf-on-targeted',
		kind: 'state',
		description:
			"Picked out as a whole to be acted on: the next action applies to it — ticked rows, files, shapes, the editor's selected blocks. Not a cursor or highlighted text inside it. Author/JS-toggled, no pseudo.",
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
			'Element is physically positioned over other content — author-declared; theme decides treatment (translucency, blur, etc.). Worn by a box placed over another with sl-over too.',
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
			'Element sits inside a container that already provides visual boundary — author-declared; theme decides how to soften (default: drop own chrome, keep a fill)',
	},
	{
		name: 'sf-is-nested',
		kind: 'context',
		description:
			'Group sits inside another group (nav group, tree level, reply thread) — author-declared at every level; the look must add up per level',
	},
	{
		name: 'sf-flush',
		kind: 'context',
		description:
			'Container holds content edge-to-edge — opt-out of chrome-class padding default. Wear alongside sf-depth-*.',
	},
	{
		name: 'sf-is-loading',
		kind: 'context',
		description:
			'Element is in a loading / pending state — e.g. a button whose action is running. A busy button stays enabled so it keeps focus. Theme decides the look (default: busy cursor, dimmed like disabled).',
	},
	{
		name: 'sf-is-error',
		kind: 'context',
		description:
			'Element or field is in a validation / error state. Theme decides the look (default: a dashed line in the danger colour round it). Pair with aria-invalid on fields.',
	},
	{
		name: 'sf-is-warning',
		kind: 'context',
		description:
			'Element or field needs a look but is not in error — e.g. a weak password, or a block the editor suggests changing. Theme decides the look (default: a dotted line in the warning colour round it).',
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

	// Layout — vocabulary only; what each class arranges is fixed CSS (css/slLayout.ts)
	{ name: 'sl-stack', kind: 'layout', description: 'Vertical flex stack' },
	{ name: 'sl-cluster', kind: 'layout', description: 'Horizontal flex wrap' },
	{ name: 'sl-columns', kind: 'layout', description: 'Equal or custom-ratio grid columns' },
	{ name: 'sl-split', kind: 'layout', description: 'Fixed + flexible two-column split' },
	{ name: 'sl-center', kind: 'layout', description: 'Centered max-width block' },
	{
		name: 'sl-inset',
		kind: 'layout',
		description:
			'Vertical stack whose children sit inside side margins. The margins match the inset it sits in, or the page margin (--sf-spacing_page); past the page width (--sf-width_page) the content column centres and the margins grow. On a chrome box (sf-depth-*) they are its own padding. A child wearing sl-bleed spans the margins too.',
	},
	{
		name: 'sl-bleed',
		kind: 'layout',
		description:
			'Reaches the edges of its sl-inset parent, spanning the side margins. Does nothing outside an sl-inset.',
	},
	{
		name: 'sl-inset-line',
		kind: 'layout',
		description:
			'Content starts on the inset line: side padding equals the margin of the inset it sits in, or the page margin outside any inset. Use on something whose box spans the full width (a bleeding child, a screen-wide bar or scroll area), with no padded box in between.',
	},
	{
		name: 'sl-cover',
		kind: 'layout',
		description:
			'Fills at least 100dvh with content centred. Override via --sl-cover-min (e.g. 100% when parent chain has defined heights, or a fixed size like 20rem). Compose with sl-align-y-* / sl-align-x-* for non-centre alignment.',
	},
	{
		name: 'sl-align-y-start',
		kind: 'layout',
		description:
			"Puts content at the top of the layout (the start of the block axis). Works on any layout; on a stack it shows only when the stack is taller than its content. On sl-over, the box sits at the top of the box it's in.",
	},
	{
		name: 'sl-align-y-center',
		kind: 'layout',
		description:
			"Centres content up and down (the block axis). Works on any layout; on a stack it shows only when the stack is taller than its content. On sl-over, the box sits halfway down the box it's in.",
	},
	{
		name: 'sl-align-y-end',
		kind: 'layout',
		description:
			"Puts content at the bottom of the layout (the end of the block axis). Works on any layout; on a stack it shows only when the stack is taller than its content. On sl-over, the box sits at the foot of the box it's in.",
	},
	{
		name: 'sl-align-x-start',
		kind: 'layout',
		description:
			"Puts content at the left (the start of the inline axis). Works on any layout; each item takes its content’s width instead of the full width. On sl-over, the box sits at the start side of the box it's in.",
	},
	{
		name: 'sl-align-x-center',
		kind: 'layout',
		description:
			"Centres content sideways (the inline axis). Works on any layout; each item takes its content’s width instead of the full width. On sl-over, the box sits in the middle of the box it's in, sideways.",
	},
	{
		name: 'sl-align-x-end',
		kind: 'layout',
		description:
			"Puts content at the right (the end of the inline axis). Works on any layout; each item takes its content’s width instead of the full width. On sl-over, the box sits at the end side of the box it's in.",
	},
	{
		name: 'sl-over',
		kind: 'layout',
		description:
			"Sits over the box it's in, out of the flow. sl-align-x-* and sl-align-y-* say where; a side with no word is filled (alone, it covers the box). On a layout they line up its contents the same way. Wear sf-is-overlay too.",
	},
	{
		name: 'sl-row',
		kind: 'layout',
		description:
			"A child of a grid layout (sl-split, sl-columns, sl-grid) that spans every column and places its own children on the parent's columns, so separate rows line up. Children fill the columns in order; extras wrap onto a new line within the row.",
	},
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

	// Collapse and show/hide modifiers — vocabulary only; CSS is generated from the collapse
	// thresholds (no var() in @container)
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
	{
		name: 'sl-hide-below-xs',
		kind: 'layout',
		description: 'Hidden when its container is at or below the xs width',
	},
	{
		name: 'sl-hide-below-sm',
		kind: 'layout',
		description: 'Hidden when its container is at or below the sm width',
	},
	{
		name: 'sl-hide-below-md',
		kind: 'layout',
		description: 'Hidden when its container is at or below the md width',
	},
	{
		name: 'sl-show-below-xs',
		kind: 'layout',
		description: 'Shown only when its container is at or below the xs width',
	},
	{
		name: 'sl-show-below-sm',
		kind: 'layout',
		description: 'Shown only when its container is at or below the sm width',
	},
	{
		name: 'sl-show-below-md',
		kind: 'layout',
		description: 'Shown only when its container is at or below the md width',
	},

	// Object-fit modifiers — vocabulary only; CSS uses child selectors that the
	// class_rules schema cannot express, so rules live as fixed CSS (css/slObject.ts).
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

	// Scroll areas + pinned elements. Structure only — the theme decides how hidden
	// content is shown (sf-is-overflow-* on the scroll area) and how a pinned element
	// looks while content passes under it (sl-pin-* inside sf-is-overflow-*).
	{
		name: 'sl-scroll-x',
		kind: 'layout',
		description:
			'Horizontal scroll area. Pair with the overflow composable for sf-is-overflow-*.',
	},
	{
		name: 'sl-scroll-y',
		kind: 'layout',
		description:
			'Vertical scroll area. Pair with the overflow composable for sf-is-overflow-*.',
	},
	{
		name: 'sl-scroll-frame',
		kind: 'layout',
		description:
			"Box around one scroll area, whose edges can carry overlays outside the clip: the theme's indicators of hidden content, or the component's own edge controls. The scroll area fills it. Optional.",
	},
	{
		name: 'sl-pin-top',
		kind: 'layout',
		description: 'Stays at the top edge of its scroll area while content scrolls under it',
	},
	{
		name: 'sl-pin-right',
		kind: 'layout',
		description: 'Stays at the right edge of its scroll area while content scrolls under it',
	},
	{
		name: 'sl-pin-bottom',
		kind: 'layout',
		description: 'Stays at the bottom edge of its scroll area while content scrolls under it',
	},
	{
		name: 'sl-pin-left',
		kind: 'layout',
		description: 'Stays at the left edge of its scroll area while content scrolls under it',
	},
]

// ─── Rules (root theme defaults) ─────────────────────────────────────────
// Themes shift values through tokens; rules give classes their default
// property set. Compound rules (e.g., per-bundle variant specialisation)
// can be added per-theme without touching these.

type RuleSpec = ClassOnlyRuleInput | ElementRuleInput

// The line round an element (sf-system.md, "Line parts"): each class that means something about it
// passes its part, and each draws the same line from all the parts there, so whichever rule wins
// draws them all. Parts left unset give a thin, solid line in the brand ink lying over the
// element's 1px edge, which stays as it is (a swatch passes a gap, so the line doesn't meet its
// colour). With keyboard focus the line takes the place of the focus outline, so it draws the
// ring itself, just outside the line.
const LINE_WIDTH = 'var(--sfx-line-width, var(--sf-stroke-2))'
const LINE_GAP = 'var(--sfx-line-gap, calc(0px - var(--sf-stroke-1)))'
const drawsLine = (classNames: [string, ...string[]]): RuleSpec[] => [
	{
		classNames,
		cssProperty: 'outline',
		value: `${LINE_WIDTH} var(--sfx-line-style, solid) rgb(var(--sfx-line-color, var(--sf-primary_ink)) / var(--sfx-line-alpha, 1))`,
	},
	{ classNames, cssProperty: 'outline-offset', value: LINE_GAP },
	// The ring just outside the line. A shadow can't leave a hole, so under the line it takes the
	// surface the element sits on: a dashed or faint line's gaps look as they do unfocused.
	{
		classNames,
		pseudo: ':focus-visible',
		cssProperty: 'box-shadow',
		value: `0 0 0 calc(${LINE_GAP} + ${LINE_WIDTH}) rgb(var(--sfx-surface-color, var(--sf-surface-0))), 0 0 0 calc(${LINE_GAP} + ${LINE_WIDTH} + var(--sf-stroke-2)) rgb(var(--sf-fg_primary) / var(--sfx-ring-alpha, 1))`,
	},
]

// A box's own fill (sf-system.md, "Fill parts"): the class that gives it passes the part and
// draws from it. Surfaces and contexts draw from the part first, so a context never changes a
// fill, and whichever rule wins draws the same one. A theme changes a fill by setting its part.
type RuleSelector =
	| Omit<ClassOnlyRuleInput, 'cssProperty' | 'value'>
	| Omit<ElementRuleInput, 'cssProperty' | 'value'>
const fill = (selector: RuleSelector, color: string): RuleSpec[] => [
	{ ...selector, cssProperty: '--sfx-fill-color', value: color },
	{ ...selector, cssProperty: 'background', value: 'var(--sfx-fill-color)' },
]
// A tint's coloured border goes with its fill: a contained tint keeps it.
const fillBorder = (selector: RuleSelector, color: string): RuleSpec[] => [
	{ ...selector, cssProperty: '--sfx-fill-border-color', value: color },
	{ ...selector, cssProperty: 'border', value: '1px solid var(--sfx-fill-border-color)' },
]
/** A surface's background, or the box's fill when it has one. */
const underFill = (background: string) => `var(--sfx-fill-color, ${background})`

// A box's words (sf-system.md, "Text parts"): a colour or a fill passes what its words are and
// draws them at the strength passed (quiet's, or full under the pointer), so a quiet colour needs
// no rule of its own, and picked and current read the words instead of one rule per colour.
const words = (selector: RuleSelector, color: string): RuleSpec[] => [
	{ ...selector, cssProperty: '--sfx-text-color', value: color },
	{
		...selector,
		cssProperty: 'color',
		value: 'rgb(from var(--sfx-text-color) r g b / var(--sfx-text-alpha, 1))',
	},
]
/** A colour's words on the page: the colour mixed half with the text colour, its chroma doubled. */
const colourWords = (role: string) =>
	`oklch(from color-mix(in oklab, rgb(var(--sf-${role})) 50%, rgb(var(--sf-fg_primary))) l calc(c * 2) h)`
const BRAND_WORDS = colourWords('primary')

// Layout primitives become query containers only when something inside them collapses.
// A container ignores its own content when sizing its width, so an unconditional
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
	{
		classNames: ['sf-depth-0'],
		cssProperty: 'background',
		value: underFill('rgb(var(--sf-surface-0))'),
	},
	{
		classNames: ['sf-depth-0'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary))',
	},

	// depth-1: cards, wells — background + shadow + radius
	// Border is intentionally absent at the default level; flat themes add one by overriding
	// box-shadow to none and adding border: 1px solid rgb(var(--sf-border_color)) instead.
	{
		classNames: ['sf-depth-1'],
		cssProperty: '--sfx-surface-color',
		value: 'var(--sf-surface-1)',
	},
	{ classNames: ['sf-depth-1'], cssProperty: '--sfx-depth-radius', value: 'var(--sf-radius-2)' },
	{
		classNames: ['sf-depth-1'],
		cssProperty: 'background',
		value: underFill('rgb(var(--sf-surface-1))'),
	},
	{
		classNames: ['sf-depth-1'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary))',
	},
	{
		classNames: ['sf-depth-1'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-md) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{
		classNames: ['sf-depth-1'],
		cssProperty: '--sfx-depth-shadow',
		value: 'var(--sf-shadow-md) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{ classNames: ['sf-depth-1'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	// Chrome classes both set --sf-padding (card-scale default) AND consume it. sf-size-*
	// worn on the same element overrides via cascade — same layer, same specificity, sf-size
	// wins through its cascadeOrder (MODIFIER_ORDER), which emits it after sf-depth-*.
	// Tight consumers (tooltips, drag handles, floating toolbars) opt in via sf-size-2xs /
	// sf-size-xs. Flush-content containers opt out via sf-flush. --sf-padding is not
	// inherited (reset.ts), so a box's padding never reaches what's inside it.
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
	{
		classNames: ['sf-depth-2'],
		cssProperty: 'background',
		value: underFill('rgb(var(--sf-surface-2))'),
	},
	{
		classNames: ['sf-depth-2'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary))',
	},
	{
		classNames: ['sf-depth-2'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-lg) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{
		classNames: ['sf-depth-2'],
		cssProperty: '--sfx-depth-shadow',
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
	{ classNames: ['sf-depth-3'], cssProperty: '--sfx-depth-radius', value: 'var(--sf-radius-2)' },
	{
		classNames: ['sf-depth-3'],
		cssProperty: 'background',
		value: underFill('rgb(var(--sf-surface-3))'),
	},
	{
		classNames: ['sf-depth-3'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-fg_primary))',
	},
	{
		classNames: ['sf-depth-3'],
		cssProperty: 'box-shadow',
		value: 'var(--sf-shadow-xl) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	{
		classNames: ['sf-depth-3'],
		cssProperty: '--sfx-depth-shadow',
		value: 'var(--sf-shadow-xl) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity)))',
	},
	// Matches sf-depth-1/2 — chip-scale radius belongs to sf-chip, not depth.
	{ classNames: ['sf-depth-3'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	{
		classNames: ['sf-depth-3'],
		cssProperty: '--sf-padding',
		value: 'var(--sf-spacing-md)',
	},
	{ classNames: ['sf-depth-3'], cssProperty: 'padding', value: 'var(--sf-padding)' },

	// Loudness bare rules — apply at any depth; compounds below refine per-surface behaviour.
	// loudness-1: muted foreground (low-attention text/element). It passes its strength, which a
	// colour's words read too. Border cleared so text-only tier has no visible chrome. Pairs with
	// sf-on-hover, which passes full strength, for dim-at-rest, full-on-hover pattern.
	{ classNames: ['sf-loudness-1'], cssProperty: '--sfx-text-alpha', value: 'var(--sf-alpha-6)' },
	{
		classNames: ['sf-loudness-1'],
		cssProperty: 'color',
		value: 'rgb(from currentColor r g b / var(--sfx-text-alpha))',
	},
	{ classNames: ['sf-loudness-1'], cssProperty: 'border-color', value: 'transparent' },
	// A quiet icon sits a step below quiet text, in any colour: a glyph carries more ink than a
	// line of text in the same colour.
	{
		classNames: ['sf-icon', 'sf-loudness-1'],
		cssProperty: '--sfx-text-alpha',
		value: 'var(--sf-alpha-4)',
	},

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

	// Size bundles — this theme spends size on --sf-padding (read by the element that wears
	// the size; not inherited). Another theme could just as validly express size via border weight or
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

	// sl-scroll-x hides its scrollbar — the default theme's choice (compact rows, tables);
	// sl-scroll-y keeps native scrollbars. What each sl- class arranges is fixed CSS
	// (css/slLayout.ts); a theme's rules on sl- classes set looks only.
	{ classNames: ['sl-scroll-x'], cssProperty: 'scrollbar-width', value: 'none' },
	{
		classNames: ['sl-scroll-x'],
		pseudo: '::-webkit-scrollbar',
		cssProperty: 'display',
		value: 'none',
	},

	// Overflow context — mask-image applied to the scrolling element. How hidden content is
	// shown is the theme's; a control that scrolls is the component's.
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

	// Edges that hold a pinned element drop their fade — the fade would cover the pinned
	// element, and the pinned element shows the hidden content itself (rules below).
	// Caveat: :has() also sees pinned elements inside nested scroll areas — see sf-system.md.
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ':has(.sl-pin-right)',
		cssProperty: 'mask-image',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ':has(.sl-pin-left)',
		cssProperty: 'mask-image',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-left', 'sf-is-overflow-right'],
		pseudo: ':has(.sl-pin-right)',
		cssProperty: 'mask-image',
		value: 'linear-gradient(to right, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-left', 'sf-is-overflow-right'],
		pseudo: ':has(.sl-pin-left)',
		cssProperty: 'mask-image',
		value: 'linear-gradient(to left, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-left', 'sf-is-overflow-right'],
		pseudo: ':has(.sl-pin-left):has(.sl-pin-right)',
		cssProperty: 'mask-image',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ':has(.sl-pin-bottom)',
		cssProperty: 'mask-image',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ':has(.sl-pin-top)',
		cssProperty: 'mask-image',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-top', 'sf-is-overflow-bottom'],
		pseudo: ':has(.sl-pin-bottom)',
		cssProperty: 'mask-image',
		value: 'linear-gradient(to bottom, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-top', 'sf-is-overflow-bottom'],
		pseudo: ':has(.sl-pin-top)',
		cssProperty: 'mask-image',
		value: 'linear-gradient(to top, transparent, black 60px)',
	},
	{
		classNames: ['sf-is-overflow-top', 'sf-is-overflow-bottom'],
		pseudo: ':has(.sl-pin-top):has(.sl-pin-bottom)',
		cssProperty: 'mask-image',
		value: 'none',
	},

	// Content passing under a pinned element — the pinned element turns opaque (nearest
	// depth surface via the --sfx-surface-color bridge) and a shadow strip sits just outside
	// it, exactly its height/width. Strips of adjacent pinned cells meet edge to edge, so a
	// pinned column reads as one continuous shadow (a per-cell box-shadow blurs past each
	// cell and doubles up at every row line). Same nested-scroll-area caveat as above.
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right',
		cssProperty: 'background',
		value: underFill('rgb(var(--sfx-surface-color, var(--sf-surface-0)))'),
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'content',
		value: "''",
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'position',
		value: 'absolute',
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'right',
		value: '100%',
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'top',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'bottom',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'width',
		value: '12px',
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'pointer-events',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-right'],
		pseudo: ' .sl-pin-right::after',
		cssProperty: 'box-shadow',
		value: 'inset -10px 0 8px -8px rgb(var(--sf-shadow) / var(--sf-shadow-opacity))',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left',
		cssProperty: 'background',
		value: underFill('rgb(var(--sfx-surface-color, var(--sf-surface-0)))'),
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'content',
		value: "''",
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'position',
		value: 'absolute',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'left',
		value: '100%',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'top',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'bottom',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'width',
		value: '12px',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'pointer-events',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-left'],
		pseudo: ' .sl-pin-left::after',
		cssProperty: 'box-shadow',
		value: 'inset 10px 0 8px -8px rgb(var(--sf-shadow) / var(--sf-shadow-opacity))',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top',
		cssProperty: 'background',
		value: underFill('rgb(var(--sfx-surface-color, var(--sf-surface-0)))'),
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'content',
		value: "''",
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'position',
		value: 'absolute',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'top',
		value: '100%',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'left',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'right',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'height',
		value: '12px',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'pointer-events',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-top'],
		pseudo: ' .sl-pin-top::after',
		cssProperty: 'box-shadow',
		value: 'inset 0 10px 8px -8px rgb(var(--sf-shadow) / var(--sf-shadow-opacity))',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom',
		cssProperty: 'background',
		value: underFill('rgb(var(--sfx-surface-color, var(--sf-surface-0)))'),
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'content',
		value: "''",
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'position',
		value: 'absolute',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'bottom',
		value: '100%',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'left',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'right',
		value: '0',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'height',
		value: '12px',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'pointer-events',
		value: 'none',
	},
	{
		classNames: ['sf-is-overflow-bottom'],
		pseudo: ' .sl-pin-bottom::after',
		cssProperty: 'box-shadow',
		value: 'inset 0 -10px 8px -8px rgb(var(--sf-shadow) / var(--sf-shadow-opacity))',
	},

	// Framed scroll area with hidden content on a side — an arrow on that edge, drawn on the
	// frame so the fade (a mask on the scroll area) doesn't hide it. Horizontal only until a
	// framed sl-scroll-y exists. Edges holding a pinned element drop the arrow, as they drop
	// the fade. These are looks, but a rule's only class sets its layer, so they sit in
	// sl-layout; nothing else styles a frame's own ::before/::after. The shown/dropped rules
	// name the scroll area in full so they outrank the hidden base (0-3-1 / 0-4-1 over 0-2-1).
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'content',
		value: "''",
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'position',
		value: 'absolute',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'top',
		value: '50%',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'transform',
		value: 'translateY(-50%)',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'left',
		value: 'var(--sf-spacing-xs)',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'width',
		value: '0',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'height',
		value: '0',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'border-top',
		value: '4px solid transparent',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'border-bottom',
		value: '4px solid transparent',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'border-right',
		value: '5px solid rgb(var(--sf-fg_primary) / var(--sf-alpha-5))',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'pointer-events',
		value: 'none',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'opacity',
		value: '0',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'transition',
		value: 'opacity 0.15s ease',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::before',
		cssProperty: 'z-index',
		value: '1',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'content',
		value: "''",
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'position',
		value: 'absolute',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'top',
		value: '50%',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'transform',
		value: 'translateY(-50%)',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'right',
		value: 'var(--sf-spacing-xs)',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'width',
		value: '0',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'height',
		value: '0',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'border-top',
		value: '4px solid transparent',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'border-bottom',
		value: '4px solid transparent',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'border-left',
		value: '5px solid rgb(var(--sf-fg_primary) / var(--sf-alpha-5))',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'pointer-events',
		value: 'none',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'opacity',
		value: '0',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'transition',
		value: 'opacity 0.15s ease',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x)::after',
		cssProperty: 'z-index',
		value: '1',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x.sf-is-overflow-left)::before',
		cssProperty: 'opacity',
		value: '1',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x.sf-is-overflow-right)::after',
		cssProperty: 'opacity',
		value: '1',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x.sf-is-overflow-left .sl-pin-left)::before',
		cssProperty: 'opacity',
		value: '0',
	},
	{
		classNames: ['sl-scroll-frame'],
		pseudo: ':has(> .sl-scroll-x.sf-is-overflow-right .sl-pin-right)::after',
		cssProperty: 'opacity',
		value: '0',
	},

	// Overlay context — reads --sfx-surface-color (bridge variable set by each depth bundle) so one
	// bare rule works at any depth without duplicating colour knowledge. Theme can compound
	// (e.g. sf-depth-3.sf-is-overlay) to override for specific depths where different treatment is needed.
	// A context changes a box's surface, never its fill (sf-system.md, "Fill parts").
	{
		classNames: ['sf-is-overlay'],
		cssProperty: 'background',
		value: underFill('rgb(var(--sfx-surface-color, var(--sf-surface-0)) / var(--sf-alpha-9))'),
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
	// Default treatment: drop own chrome (surface, border), never a fill or a tint's border
	// (sf-system.md, "Fill parts"). Theme is free to override
	// with a subtler treatment (reduced padding, muted colour, etc.). Element-agnostic — fires
	// on any tag that would otherwise draw its own container.
	// sf-is-nested — repeated at each level, so the look adds up by itself: a guide line on
	// the start edge, level with the parent's edge, and the content a step off the line.
	// Deeper levels draw their own line a step in. Never a depth step.
	{
		classNames: ['sf-is-nested'],
		cssProperty: 'border-inline-start',
		value: 'var(--sf-stroke-2) solid rgb(var(--sf-border_color))',
	},
	{
		classNames: ['sf-is-nested'],
		cssProperty: 'padding-inline-start',
		value: 'var(--sf-spacing-xs)',
	},
	{ classNames: ['sf-is-contained'], cssProperty: 'background', value: underFill('none') },
	{
		classNames: ['sf-is-contained'],
		cssProperty: 'border-color',
		value: 'var(--sfx-fill-border-color, transparent)',
	},
	// A contained field with a focus look, typed in: drawn as a field in full, its surface, edge
	// and full words, quiet or not, with no ring (sf-system.md, "A contained field shows focus as
	// a field"). A state rule, so hover doesn't take its place while typing.
	...(
		[
			['background', underFill('rgb(var(--sf-surface-0))')],
			[
				'border-color',
				'var(--sfx-fill-border-color, rgb(var(--sf-fg_primary) / var(--sf-alpha-6)))',
			],
			['--sfx-text-alpha', '1'],
			['--sfx-ring-alpha', '0'],
		] as const
	).map(
		([cssProperty, value]): RuleSpec => ({
			classNames: ['sf-field', 'sf-is-contained', 'sf-on-focus'],
			cssProperty,
			value,
		}),
	),
	{ classNames: ['sf-is-loading'], cssProperty: 'cursor', value: 'progress' },
	// A busy button stays focusable (so it isn't disabled); it dims like a disabled one.
	{ classNames: ['sf-is-loading'], cssProperty: 'opacity', value: '0.4' },
	// An error or warning shows with the line alone, fields too: dashed for an error, dotted for a
	// warning, so it doesn't rest on colour alone. The element's own edge stays as it is.
	{ classNames: ['sf-is-error'], cssProperty: '--sfx-line-color', value: 'var(--sf-danger_ink)' },
	{ classNames: ['sf-is-error'], cssProperty: '--sfx-line-style', value: 'dashed' },
	...drawsLine(['sf-is-error']),
	{
		classNames: ['sf-is-warning'],
		cssProperty: '--sfx-line-color',
		value: 'var(--sf-warning_ink)',
	},
	{ classNames: ['sf-is-warning'], cssProperty: '--sfx-line-style', value: 'dotted' },
	...drawsLine(['sf-is-warning']),
	// sf-is-contained × sf-is-overlay — contained wins over the overlay's see-through surface
	// (alphabetical emission order would let sf-is-overlay win at equal specificity).
	{
		classNames: ['sf-is-contained', 'sf-is-overlay'],
		cssProperty: 'background',
		value: underFill('none'),
	},
	// sf-is-overlay × sf-loudness-2 × sf-variant-* — a floating tint gets its depth's shadow back
	// (a tinted box in a card is flat; a floating one isn't). It keeps its fill as any box does.
	...(['featured', 'primary', 'danger', 'warning', 'success', 'info'] as const).map(
		(variant): RuleSpec => ({
			classNames: ['sf-is-overlay', 'sf-loudness-2', `sf-variant-${variant}`],
			cssProperty: 'box-shadow',
			value: 'var(--sfx-depth-shadow, none)',
		}),
	),
	// sf-is-contained × sf-boundary-right — contained element that still marks a directional
	// boundary (e.g. a toolbar slot handle with a right separator). sf-is-contained zeros
	// border-color; this compound restores the right side at higher specificity (2 vs 1 class).
	{
		classNames: ['sf-is-contained', 'sf-boundary-right'],
		cssProperty: 'border-right-color',
		value: 'rgb(var(--sf-border_color))',
	},

	// Flush context — opts out of chrome-class padding default. sf-context layer beats
	// sf-bundle's `padding: var(--sf-padding)` on sf-depth-*. --sf-padding also zeroed, since
	// a chrome box that's also an sl-inset takes its margins from it (css/slLayout.ts).
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

	// Variants — semantic colour only: each passes its words, read at quiet's strength when quiet
	// (muted, no fill). Fill weight comes from loudness × variant compounds below. Bare variant
	// with no loudness class = coloured text, no fill.
	...(['featured', 'primary', 'danger', 'warning', 'success', 'info'] as const).flatMap(
		(variant) =>
			words(
				{ classNames: [`sf-variant-${variant}`] },
				variant === 'featured' ? BRAND_WORDS : colourWords(variant),
			),
	),

	// Loudness-2 × variant: tinted fill + coloured border, no shadow. Featured keeps the
	// surrounding text colour; danger/warning/success keep their variant colour.
	...fill(
		{ classNames: ['sf-loudness-2', 'sf-variant-featured'] },
		'color-mix(in oklab, rgb(var(--sf-primary)) 15%, rgb(var(--sf-surface-0)))',
	),
	...fill(
		{ classNames: ['sf-loudness-2', 'sf-variant-primary'] },
		'color-mix(in oklab, rgb(var(--sf-primary)) 15%, rgb(var(--sf-surface-0)))',
	),
	...fillBorder(
		{ classNames: ['sf-loudness-2', 'sf-variant-featured'] },
		'color-mix(in oklab, rgb(var(--sf-primary)) 70%, rgb(var(--sf-surface-0)))',
	),
	...fillBorder(
		{ classNames: ['sf-loudness-2', 'sf-variant-primary'] },
		'color-mix(in oklab, rgb(var(--sf-primary)) 70%, rgb(var(--sf-surface-0)))',
	),
	{
		classNames: ['sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'box-shadow',
		value: 'none',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-primary'],
		cssProperty: 'box-shadow',
		value: 'none',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'color',
		value: 'inherit',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-primary'],
		cssProperty: 'color',
		value: 'inherit',
	},
	...fill(
		{ classNames: ['sf-loudness-2', 'sf-variant-danger'] },
		'color-mix(in oklab, rgb(var(--sf-danger)) 15%, rgb(var(--sf-surface-0)))',
	),
	...fillBorder(
		{ classNames: ['sf-loudness-2', 'sf-variant-danger'] },
		'color-mix(in oklab, rgb(var(--sf-danger)) 70%, rgb(var(--sf-surface-0)))',
	),
	{
		classNames: ['sf-loudness-2', 'sf-variant-danger'],
		cssProperty: 'box-shadow',
		value: 'none',
	},
	...fill(
		{ classNames: ['sf-loudness-2', 'sf-variant-warning'] },
		'color-mix(in oklab, rgb(var(--sf-warning)) 15%, rgb(var(--sf-surface-0)))',
	),
	...fillBorder(
		{ classNames: ['sf-loudness-2', 'sf-variant-warning'] },
		'color-mix(in oklab, rgb(var(--sf-warning)) 70%, rgb(var(--sf-surface-0)))',
	),
	{
		classNames: ['sf-loudness-2', 'sf-variant-warning'],
		cssProperty: 'box-shadow',
		value: 'none',
	},
	...fill(
		{ classNames: ['sf-loudness-2', 'sf-variant-success'] },
		'color-mix(in oklab, rgb(var(--sf-success)) 15%, rgb(var(--sf-surface-0)))',
	),
	...fill(
		{ classNames: ['sf-loudness-2', 'sf-variant-info'] },
		'color-mix(in oklab, rgb(var(--sf-info)) 15%, rgb(var(--sf-surface-0)))',
	),
	...fillBorder(
		{ classNames: ['sf-loudness-2', 'sf-variant-success'] },
		'color-mix(in oklab, rgb(var(--sf-success)) 70%, rgb(var(--sf-surface-0)))',
	),
	...fillBorder(
		{ classNames: ['sf-loudness-2', 'sf-variant-info'] },
		'color-mix(in oklab, rgb(var(--sf-info)) 70%, rgb(var(--sf-surface-0)))',
	),
	{
		classNames: ['sf-loudness-2', 'sf-variant-success'],
		cssProperty: 'box-shadow',
		value: 'none',
	},
	{
		classNames: ['sf-loudness-2', 'sf-variant-info'],
		cssProperty: 'box-shadow',
		value: 'none',
	},

	// Loudness-3 × variant: solid fill + that colour's fg_on_* words, in bold.
	...(
		[
			['featured', 'primary'],
			['primary', 'primary'],
			['danger', 'danger'],
			['warning', 'warning'],
			['success', 'success'],
			['info', 'info'],
		] as const
	).flatMap(([variant, role]): RuleSpec[] => {
		const loud: RuleSelector = { classNames: ['sf-loudness-3', `sf-variant-${variant}`] }
		return [
			...fill(loud, `rgb(var(--sf-${role}))`),
			...words(loud, `rgb(var(--sf-fg_on_${role}))`),
			{ ...loud, cssProperty: 'font-weight', value: 'var(--sf-weight-3)' },
		]
	}),

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

	// Hover state — the words at full strength (undoing quiet), in their own colour, and a subtle
	// fill in it, so a coloured thing gets a tint in its colour. It passes the strength rather
	// than setting the words, as resetting them took every colour's away (sf-system.md, "Text
	// parts").
	{ classNames: ['sf-on-hover'], cssProperty: '--sfx-text-alpha', value: '1' },
	{
		classNames: ['sf-on-hover'],
		cssProperty: 'background',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-1))',
	},

	// A control that is busy and also natively disabled (hand-written markup; SfButton never
	// disables while busy) keeps the busy cursor rather than "not allowed".
	{ classNames: ['sf-on-disabled', 'sf-is-loading'], cssProperty: 'cursor', value: 'progress' },

	// Hover × loudness-2 — one step past the resting tint, so the hover still shows.
	{
		classNames: ['sf-on-hover', 'sf-loudness-2'],
		cssProperty: 'background',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-2))',
	},

	// Pressed — one step past hover. sf-on-active wins ties with sf-on-hover (cascadeOrder),
	// so each compound here beats its hover twin while the pointer is down.
	{
		classNames: ['sf-on-active'],
		cssProperty: 'background',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-2))',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-2'],
		cssProperty: 'background',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-3))',
	},
	// Hover and press on a loudness-2 fill: a stronger shade of its own colour.
	{
		classNames: ['sf-on-hover', 'sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-primary)) 25%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-2', 'sf-variant-primary'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-primary)) 25%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-2', 'sf-variant-danger'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-danger)) 25%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-2', 'sf-variant-warning'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-warning)) 25%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-2', 'sf-variant-success'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-success)) 25%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-2', 'sf-variant-info'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-info)) 25%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-2', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-primary)) 35%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-2', 'sf-variant-primary'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-primary)) 35%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-2', 'sf-variant-danger'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-danger)) 35%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-2', 'sf-variant-warning'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-warning)) 35%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-2', 'sf-variant-success'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-success)) 35%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-2', 'sf-variant-info'],
		cssProperty: 'background',
		value: 'color-mix(in oklab, rgb(var(--sf-info)) 35%, rgb(var(--sf-surface-0)))',
	},
	{
		classNames: ['sf-on-active', 'sf-on-current'],
		cssProperty: 'background',
		value: underFill('rgb(from currentColor r g b / var(--sf-alpha-3))'),
	},

	// Hover × loudness-3 — darken the solid fill rather than overlaying fg_primary tint.
	// Three-class compounds (0-3-0) beat two-class hover × variant (0-2-0) in sf-state layer.
	// Under the pointer a loud thing is dark, so its words are its fill's, or light where it has
	// no fill of its own (an author's loud link).
	{
		classNames: ['sf-on-hover', 'sf-loudness-3'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-fg_primary) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3'],
		cssProperty: 'color',
		value: 'var(--sfx-text-color, rgb(var(--sf-fg_inverted)))',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-warning'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-warning) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-success'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-success) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-info'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-info) / 0.85)',
	},
	// Pressing a solid fill goes a step further than hover; the fill stays solid enough
	// for its text.
	{
		classNames: ['sf-on-active', 'sf-loudness-3'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-fg_primary) / 0.7)',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-3', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / 0.7)',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-3', 'sf-variant-primary'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / 0.7)',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-3', 'sf-variant-danger'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-danger) / 0.7)',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-3', 'sf-variant-warning'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-warning) / 0.7)',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-3', 'sf-variant-success'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-success) / 0.7)',
	},
	{
		classNames: ['sf-on-active', 'sf-loudness-3', 'sf-variant-info'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-info) / 0.7)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-featured'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-primary'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary) / 0.85)',
	},
	{
		classNames: ['sf-on-hover', 'sf-loudness-3', 'sf-variant-danger'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-danger) / 0.85)',
	},

	// Hover × drag-handle — icon takes the brand ink; border stays themed (subtle hover signal).
	// Bare sf-on-hover rule already provides the fg_primary/alpha-1 background tint.
	{
		classNames: ['sf-drag-handle', 'sf-on-hover'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-primary_ink))',
	},

	// Dragging state — primary accent throughout; tinted fill signals actively engaged.
	{
		classNames: ['sf-drag-handle', 'sf-on-dragging'],
		cssProperty: 'color',
		value: 'rgb(var(--sf-primary_ink))',
	},
	{
		classNames: ['sf-drag-handle', 'sf-on-dragging'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-primary_ink))',
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

	// Disabled state — dim + not-allowed cursor for interactive controls.
	// Vocabulary pseudo is :disabled so the class only fires on form elements
	// in their native disabled state (matches how sf-on-hover fires on :hover).
	{ classNames: ['sf-on-disabled'], cssProperty: 'opacity', value: '0.4' },
	{ classNames: ['sf-on-disabled'], cssProperty: 'cursor', value: 'not-allowed' },

	// Author-declared disabled appearance — class alone fires, no pseudo. Element remains
	// interactive (no cursor change). Use for muted-but-clickable elements at any loudness tier.
	{ classNames: ['sf-is-disabled'], cssProperty: 'opacity', value: '0.4' },

	// Picked draws the line; targeted makes it wide and faint, in whatever colour it has. Each says
	// one thing, so every combination with the others (an error, picked) shows.
	...drawsLine(['sf-on-selected']),
	// Picked words: the element's own (a colour's, or a fill's on a loud box), else the brand's.
	{
		classNames: ['sf-on-selected'],
		cssProperty: 'color',
		value: `var(--sfx-text-color, ${BRAND_WORDS})`,
	},
	{
		classNames: ['sf-on-targeted'],
		cssProperty: '--sfx-line-width',
		value: 'var(--sf-stroke-3)',
	},
	{
		classNames: ['sf-on-targeted'],
		cssProperty: '--sfx-line-alpha',
		value: 'var(--sf-alpha-5)',
	},
	...drawsLine(['sf-on-targeted']),

	// Current state — tinted fill (toolbar toggles, breadcrumb leaf, keyboard-highlighted menu item).
	// Reads as "this option is on right now" — distinct from sf-on-selected's outline chip.
	// The words are the element's own, else the brand's, as picked's; the tint and edge are drawn
	// from them, so a colour keeps its role while on. Being on never takes a fill away, as a
	// context never does: a loud or tinted box keeps its fill and its words.
	{
		classNames: ['sf-on-current'],
		cssProperty: 'background',
		value: underFill('rgb(from currentColor r g b / var(--sf-alpha-1))'),
	},
	{
		classNames: ['sf-on-current'],
		cssProperty: 'border-color',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-4))',
	},
	{
		classNames: ['sf-on-current'],
		cssProperty: 'color',
		value: `var(--sfx-text-color, ${BRAND_WORDS})`,
	},

	// Hover × current — intensify the current tint on the currently-selected item. It says the
	// words again: hover × loudness-3 is as strong and sorts before it in the stylesheet, and on
	// its own would give a loud link with no fill light words on this tint.
	{
		classNames: ['sf-on-hover', 'sf-on-current'],
		cssProperty: 'background',
		value: underFill('rgb(from currentColor r g b / var(--sf-alpha-2))'),
	},
	{
		classNames: ['sf-on-hover', 'sf-on-current'],
		cssProperty: 'color',
		value: `var(--sfx-text-color, ${BRAND_WORDS})`,
	},

	// Ancestor state: the brand's words, no fill. Reads as "on the trail to current"; the
	// current item has the same words in a tinted box, other items the text colour. Full
	// strength, as faded lilac can't be read (1.53:1 on the light header).
	// Nav sidebars, breadcrumb non-leaf segments.
	{
		classNames: ['sf-on-ancestor'],
		cssProperty: 'color',
		value: BRAND_WORDS,
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

	// sf-text-block: compact leading for non-semantic text wrappers (tooltip, label,
	// badge). Works for 1..N lines — tight enough that padding isn't dominated by
	// half-leading at small sizes, loose enough that wrapped text stays readable.
	// Theme can compound with sf-text-* / sf-size-* to tune pairs.
	{ classNames: ['sf-text-block'], cssProperty: 'line-height', value: 'var(--sf-leading-tight)' },

	// sf-text-block × small sizes: bump inline padding one tier past block padding
	// to compensate for the built-in em-box air above/below glyphs. At small
	// padding, that air makes vertical visual space larger than horizontal —
	// extra inline padding restores symmetry. At sm+ sizes padding is large
	// enough that glyph air is invisible; no compound needed.
	{
		classNames: ['sf-text-block', 'sf-size-2xs'],
		cssProperty: 'padding-inline',
		value: 'var(--sf-spacing-xs)',
	},
	{
		classNames: ['sf-text-block', 'sf-size-xs'],
		cssProperty: 'padding-inline',
		value: 'var(--sf-spacing-sm)',
	},

	// sf-drag-handle: dim icon at rest; border marks its floating extent. Hover/drag state
	// compounds below in sf-state layer override the active treatment.
	{
		classNames: ['sf-drag-handle'],
		cssProperty: 'color',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-4))',
	},
	// A depth sets the text colour; a drag handle on one stays dim.
	{
		classNames: ['sf-drag-handle', 'sf-depth-1'],
		cssProperty: 'color',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-4))',
	},
	{
		classNames: ['sf-drag-handle', 'sf-depth-2'],
		cssProperty: 'color',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-4))',
	},
	{
		classNames: ['sf-drag-handle', 'sf-depth-3'],
		cssProperty: 'color',
		value: 'rgb(from currentColor r g b / var(--sf-alpha-4))',
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
	// Baseline scoped to button.sf (sf membership marker) — third-party buttons are
	// unaffected. Emits to sf-element (below sf-bundle) so bundles/variants/states layered
	// on top win predictably. Border establishes a visible ghost baseline;
	// sf-is-contained clears it (sf-context > sf-element); sf-loudness-1 also clears it.
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-2)',
	},
	// Control-scale default (a button with no size is a normal button, not card-sized);
	// sf-size-* on the same button overrides it (later layer).
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: '--sf-padding',
		value: 'var(--sf-spacing-xs)',
	},
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: 'padding',
		value: 'var(--sf-padding)',
	},
	// A pointer shows it can be pressed; disabled (not-allowed) and busy (progress) override it.
	{ elementSelector: 'button', classNames: ['sf'], cssProperty: 'cursor', value: 'pointer' },
	// Inherit typography but not line-height — same reasoning as sf-field above.
	{ elementSelector: 'button', classNames: ['sf'], cssProperty: 'font-family', value: 'inherit' },
	{ elementSelector: 'button', classNames: ['sf'], cssProperty: 'font-size', value: 'inherit' },
	{ elementSelector: 'button', classNames: ['sf'], cssProperty: 'font-weight', value: 'inherit' },
	{
		elementSelector: 'button',
		classNames: ['sf'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-fg_primary) / var(--sf-alpha-3))',
	},
	{
		elementSelector: 'button',
		classNames: ['sf', 'sf-is-overlay'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-3)',
	},

	// ─── Anchor element ───────────────────────────────────────────────────────
	// a.sf mirrors button.sf's chrome contract — <a class="sf"> and <button class="sf">
	// render identically when composed with the same size/loudness/state axes. For
	// anchors acting as interactive button-like elements (navigation actions in menus,
	// link-buttons in toolbars). Anchor default display is `inline`, which doesn't
	// respect vertical padding predictably — `inline-block` gives padded-box behaviour
	// while preserving inline flow.
	// Links inside running text read as links. Only there: a link wrapping a card, an
	// icon or a logo isn't a text link, and needs no opt-out. :where keeps this as weak
	// as a bare `a` rule, so a.sf and every class beat it.
	...(
		[
			[
				'color',
				BRAND_WORDS,
			],
			['text-decoration', 'underline'],
		] as const
	).map(
		([cssProperty, value]): RuleSpec => ({
			elementSelector: 'a',
			pseudo: ':where(p *, li *, dd *, td *, th *, blockquote *, figcaption *, address *, h1 *, h2 *, h3 *, h4 *, h5 *, h6 *)',
			cssProperty,
			value,
		}),
	),
	// A link-button reads as a button wherever it sits, including inside text; loudness
	// and variant classes set its colour.
	{ elementSelector: 'a', classNames: ['sf'], cssProperty: 'color', value: 'inherit' },
	{ elementSelector: 'a', classNames: ['sf'], cssProperty: 'text-decoration', value: 'none' },
	{ elementSelector: 'a', classNames: ['sf'], cssProperty: 'display', value: 'inline-block' },
	{
		elementSelector: 'a',
		classNames: ['sf'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-2)',
	},
	{
		elementSelector: 'a',
		classNames: ['sf'],
		cssProperty: '--sf-padding',
		value: 'var(--sf-spacing-xs)',
	},
	{
		elementSelector: 'a',
		classNames: ['sf'],
		cssProperty: 'padding',
		value: 'var(--sf-padding)',
	},
	{ elementSelector: 'a', classNames: ['sf'], cssProperty: 'font-family', value: 'inherit' },
	{ elementSelector: 'a', classNames: ['sf'], cssProperty: 'font-size', value: 'inherit' },
	{ elementSelector: 'a', classNames: ['sf'], cssProperty: 'font-weight', value: 'inherit' },
	{
		elementSelector: 'a',
		classNames: ['sf'],
		cssProperty: 'border',
		value: '1px solid rgb(var(--sf-fg_primary) / var(--sf-alpha-3))',
	},
	{
		elementSelector: 'a',
		classNames: ['sf', 'sf-is-overlay'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-3)',
	},

	// ─── Summary element ──────────────────────────────────────────────────────
	// The heading of a <details> is pressed like a button, so summary.sf gets the same
	// chrome as button.sf / a.sf. Its disclosure marker is left to the component.
	...(
		[
			['border-radius', 'var(--sf-radius-2)'],
			['--sf-padding', 'var(--sf-spacing-xs)'],
			['padding', 'var(--sf-padding)'],
			['border', '1px solid rgb(var(--sf-fg_primary) / var(--sf-alpha-3))'],
		] as const
	).map(
		([cssProperty, value]): RuleSpec => ({
			elementSelector: 'summary',
			classNames: ['sf'],
			cssProperty,
			value,
		}),
	),

	// ─── Code element ─────────────────────────────────────────────────────────
	// Inline code / identifier content. Applied via <code class="sf">, matching
	// button.sf / a.sf opt-in pattern. Content-only: sets mono font. Size and
	// layout (nowrap, overflow) are consumer choices.
	{
		elementSelector: 'code',
		classNames: ['sf'],
		cssProperty: 'font-family',
		value: 'var(--sf-font-mono)',
	},

	// ─── Blockquote element ───────────────────────────────────────────────────
	// A quote: <blockquote class="sf">. The stripe down its leading edge is what's unique
	// to quotes; surface and padding come from whatever depth it wears.
	{
		elementSelector: 'blockquote',
		classNames: ['sf'],
		cssProperty: 'border-inline-start',
		value: 'calc(var(--sf-stroke-3) * 2) solid rgb(var(--sf-primary))',
	},

	// ─── List elements ────────────────────────────────────────────────────────
	// A list: <ul class="sf"> / <ol class="sf">. The reset clears markers and indent; the
	// theme brings them back. The indent is in em so the markers keep their room at any
	// text size. Space between items is the document's (block spacing).
	...(
		[
			['ul', 'disc'],
			['ol', 'decimal'],
		] as const
	).flatMap(([el, marker]): RuleSpec[] => [
		{ elementSelector: el, classNames: ['sf'], cssProperty: 'list-style', value: marker },
		{
			elementSelector: el,
			classNames: ['sf'],
			cssProperty: 'padding-inline-start',
			value: '1.5em',
		},
	]),

	// ─── Pre element ──────────────────────────────────────────────────────────
	// A code block: <pre class="sf">. Theme gives it padding, corners and the mono font;
	// the code inside inherits the font (otherwise the browser's own monospace wins).
	// Colours come from the syntax-highlighting theme, not here.
	{
		elementSelector: 'pre',
		classNames: ['sf'],
		cssProperty: 'padding',
		value: 'var(--sf-spacing-sm) var(--sf-spacing-md)',
	},
	{
		elementSelector: 'pre',
		classNames: ['sf'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-2)',
	},
	{
		elementSelector: 'pre',
		classNames: ['sf'],
		cssProperty: 'font-family',
		value: 'var(--sf-font-mono)',
	},
	{
		elementSelector: 'pre',
		classNames: ['sf'],
		pseudo: ' code',
		cssProperty: 'font-family',
		value: 'inherit',
	},

	// span.sf-loudness-3 — text carriers at loudness-3 gain heavier weight.
	// Scoped to span (not bare) so a loud card <div class="sf-loudness-3"> does not
	// cascade bold onto every descendant. Extend to other text carriers (button, a,
	// code, etc.) via similar compounds as they surface a need.
	{
		elementSelector: 'span',
		classNames: ['sf-loudness-3'],
		cssProperty: 'font-weight',
		value: '600',
	},

	// Loudness-2 on buttons and link-buttons: a light tint of the text colour, so the
	// control shows on any surface (page, card, sheet) without knowing which one.
	...(['button', 'a'] as const).flatMap((el): RuleSpec[] => [
		{
			elementSelector: el,
			classNames: ['sf', 'sf-loudness-2'],
			cssProperty: 'background',
			value: underFill('rgb(from currentColor r g b / var(--sf-alpha-1))'),
		},
	]),

	// Loudness-3 solid fill — button-only. Non-button elements (cards) get loudness-3 prominence
	// via sf-depth-1 × sf-loudness-3 shadow/border compounds; they keep their surface background.
	...fill(
		{ elementSelector: 'button', classNames: ['sf', 'sf-loudness-3'] },
		'rgb(var(--sf-fg_primary))',
	),
	...words(
		{ elementSelector: 'button', classNames: ['sf', 'sf-loudness-3'] },
		'rgb(var(--sf-fg_inverted))',
	),
	// A loud button keeps its faint light edge: the 30% text-colour edge is for ordinary ones.
	{
		elementSelector: 'button',
		classNames: ['sf', 'sf-loudness-3'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-border_color) / var(--sf-alpha-4))',
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
		value: 'rgb(var(--sf-primary_ink))',
	},
	// Checkboxes and radios are sized from the text around them, so they grow and shrink
	// with the type scale instead of each component fixing a pixel size.
	{
		elementSelector: 'input',
		classNames: ['sf'],
		pseudo: ':is([type="checkbox"], [type="radio"])',
		cssProperty: 'width',
		value: '1em',
	},
	{
		elementSelector: 'input',
		classNames: ['sf'],
		pseudo: ':is([type="checkbox"], [type="radio"])',
		cssProperty: 'height',
		value: '1em',
	},

	// ─── sf-switch / sf-thumb ─────────────────────────────────────────────────
	// The switch is a button.sf with its own shape: a pill a little over two knobs long,
	// with a thin gap round the knob. The role makes the rule stronger than a theme's plain
	// button.sf rule, so a theme with square buttons keeps round switches unless it
	// restyles sf-switch itself. Everything is in em so sf-text-* scales the whole switch.
	...(
		[
			['border-radius', 'var(--sf-radius-full)'],
			['--sf-padding', '0.2em'],
			['inline-size', '2.5em'],
		] as const
	).map(
		([cssProperty, value]): RuleSpec => ({
			elementSelector: 'button',
			classNames: ['sf-switch'],
			pseudo: ':is([role="switch"])',
			cssProperty,
			value,
		}),
	),
	// A toast is a short message you glance at, so its text is heavier, whatever its colour.
	{ classNames: ['sf-toast'], cssProperty: 'font-weight', value: 'var(--sf-weight-3)' },
	// The knob: round, one text-em across, muted at rest and primary when on. Its icon
	// is a little smaller than the knob and always contrasts with its fill.
	{ classNames: ['sf-thumb'], cssProperty: 'border-radius', value: 'var(--sf-radius-full)' },
	{ classNames: ['sf-thumb'], cssProperty: 'font-size', value: '0.8em' },
	{ classNames: ['sf-thumb'], cssProperty: 'inline-size', value: '1.25em' },
	{ classNames: ['sf-thumb'], cssProperty: 'block-size', value: '1.25em' },
	...fill({ classNames: ['sf-thumb'] }, 'rgb(var(--sf-fg_primary) / var(--sf-alpha-5))'),
	...words({ classNames: ['sf-thumb'] }, 'rgb(var(--sf-fg_inverted))'),
	{
		classNames: ['sf-thumb', 'sf-on-current'],
		cssProperty: 'background',
		value: 'rgb(var(--sf-primary_ink))',
	},
	...words({ classNames: ['sf-thumb', 'sf-on-current'] }, 'rgb(var(--sf-fg_on_primary))'),

	// ─── Compact units: sf-chip, sf-tag, sf-status, sf-counter ────────────────
	// Each is its own element type. A chip stands for an input, attribute or action (an entered
	// item, a filter, a choice, a suggestion); tag, status and counter are the read-only labels
	// for a category, a state and a count. Any element may wear them (a span, a button, a
	// link), so the bare rules are the floor. The root theme draws all four the same (a theme
	// may tell them apart); they carry only their shape. Colour and weight come from the shared
	// loudness × variant rules. With no variant, loudness-3 still means the loudest unit, so
	// they get the neutral solid fill the shared rules give only buttons. Wearers add
	// sf-single-line; display is structural (reset); wrapping is the layout's.
	...(['sf-chip', 'sf-tag', 'sf-status', 'sf-counter'] as const).flatMap((unit): RuleSpec[] => [
		{ classNames: [unit], cssProperty: 'border-radius', value: 'var(--sf-radius-3)' },
		{
			classNames: [unit],
			cssProperty: 'padding',
			value: 'var(--sf-padding, var(--sf-spacing-2xs))',
		},
		...fill({ classNames: [unit, 'sf-loudness-3'] }, 'rgb(var(--sf-fg_primary))'),
		...words({ classNames: [unit, 'sf-loudness-3'] }, 'rgb(var(--sf-fg_inverted))'),
	]),
	// A loud chip keeps its faint light edge, as a loud button does.
	{
		classNames: ['sf-chip', 'sf-loudness-3'],
		cssProperty: 'border-color',
		value: 'rgb(var(--sf-border_color) / var(--sf-alpha-3))',
	},
	// A chip you press or follow is still a chip: it keeps the chip's own shape and edge over
	// the button / link baseline, which outranks bare markers. The compounds tie with
	// button.sf / a.sf; sf-chip's cascade order settles it (a marker refines its element).
	...(['button', 'a'] as const).flatMap((el): RuleSpec[] => [
		{
			elementSelector: el,
			classNames: ['sf-chip'],
			cssProperty: 'border-radius',
			value: 'var(--sf-radius-3)',
		},
		{
			elementSelector: el,
			classNames: ['sf-chip'],
			cssProperty: 'border',
			value: 'var(--sf-stroke-1) solid rgb(var(--sf-fg_primary) / var(--sf-alpha-3))',
		},
	]),

	// ─── sf-badge, and a counter over another element ──────────────────────────
	// A mark, with nothing in it (sf-badge), or a count over a box (sf-counter sf-is-overlay):
	// the mark a dot, the count a small round number. Where it sits is the author's (sl-over and
	// the align words); how far a floating one pokes out past its corner is here, as a margin:
	// held to two sides, it moves out only on those, at any corner and in right-to-left text. A
	// count pokes out sideways only, as a bar's count at the top of the screen would touch its edge
	// (owner, 2026-11-26). The mark is the text colour, a fill, so floating keeps it; one wearing a
	// variant takes the variant's fill (loudness × variant, a later layer), as on any box.
	{ classNames: ['sf-badge'], cssProperty: 'border-radius', value: 'var(--sf-radius-full)' },
	{
		classNames: ['sf-counter', 'sf-is-overlay'],
		cssProperty: 'border-radius',
		value: 'var(--sf-radius-full)',
	},
	{ classNames: ['sf-badge', 'sf-is-overlay'], cssProperty: 'margin', value: '-0.125rem' },
	{ classNames: ['sf-counter', 'sf-is-overlay'], cssProperty: 'margin', value: '0 -0.5rem' },
	...fill({ classNames: ['sf-badge'] }, 'currentColor'),
	{ classNames: ['sf-badge'], cssProperty: 'inline-size', value: '0.5rem' },
	{ classNames: ['sf-badge'], cssProperty: 'block-size', value: '0.5rem' },
	{
		classNames: ['sf-counter', 'sf-is-overlay'],
		cssProperty: 'font-size',
		value: 'var(--sf-text-xs)',
	},
	{
		classNames: ['sf-counter', 'sf-is-overlay'],
		cssProperty: 'padding',
		value: '0.125rem var(--sf-spacing-2xs)',
	},
	// As wide as it is tall at least, so one digit is a circle.
	{
		classNames: ['sf-counter', 'sf-is-overlay'],
		cssProperty: 'min-inline-size',
		value: 'calc(1em + 0.25rem)',
	},
	{ classNames: ['sf-counter', 'sf-is-overlay'], cssProperty: 'text-align', value: 'center' },

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
	// Its line stands apart, so a lilac line round a lilac swatch still shows (Line parts).
	{ classNames: ['sf-swatch'], cssProperty: '--sfx-line-gap', value: 'var(--sf-stroke-2)' },
	// The gap is its own, so it keeps room for it, all round as it can't tell a row from a column:
	// set the smallest spacing apart, a picked line stays off the next swatch. Only one that can be
	// pressed, so can be picked or tabbed to (a colour shown inside a button doesn't grow it).
	{
		classNames: ['sf-swatch'],
		pseudo: ':enabled',
		cssProperty: 'margin',
		value: 'var(--sf-stroke-2)',
	},

	// Swatch hover — the line keeps the swatch's own colour intact (bare sf-on-hover bg tint
	// would be masked by the inline background-color anyway; the line gives real feedback).
	// Faint: a hint, so it doesn't look picked.
	{
		classNames: ['sf-swatch', 'sf-on-hover'],
		cssProperty: '--sfx-line-alpha',
		value: 'var(--sf-alpha-5)',
	},
	...drawsLine(['sf-swatch', 'sf-on-hover']),
	// A picked swatch keeps its full line under the pointer: clicking it again changes nothing.
	{
		classNames: ['sf-swatch', 'sf-on-hover', 'sf-on-selected'],
		cssProperty: '--sfx-line-alpha',
		value: '1',
	},

	// ─── sf-avatar ────────────────────────────────────────────────────────────
	// User / entity identity indicator. Solid-fill compact element for initials,
	// photo, or icon. Theme decides shape (root theme: fully round via radius-full),
	// default colours (fg_primary bg + fg_inverted text), and layout (inline-flex
	// centred). Variant compounds swap the background for semantic colour roles.
	// Consumer sets the size, since avatar sizes vary widely per use case (small
	// comment avatar vs large profile avatar).
	{ classNames: ['sf-avatar'], cssProperty: 'display', value: 'inline-flex' },
	{ classNames: ['sf-avatar'], cssProperty: 'align-items', value: 'center' },
	{ classNames: ['sf-avatar'], cssProperty: 'justify-content', value: 'center' },
	{ classNames: ['sf-avatar'], cssProperty: 'border-radius', value: 'var(--sf-radius-full)' },
	...fill({ classNames: ['sf-avatar'] }, 'rgb(var(--sf-fg_primary))'),
	...words({ classNames: ['sf-avatar'] }, 'rgb(var(--sf-fg_inverted))'),
	// Variant compounds — semantic colour role overrides the neutral default fill.
	// Bare sf-avatar still works if a theme doesn't define these (graceful degradation).
	...(
		[
			['featured', 'primary'],
			['primary', 'primary'],
			['danger', 'danger'],
			['warning', 'warning'],
			['success', 'success'],
			['info', 'info'],
		] as const
	).flatMap(([variant, role]): RuleSpec[] => {
		const avatar: RuleSelector = { classNames: ['sf-avatar', `sf-variant-${variant}`] }
		return [
			...fill(avatar, `rgb(var(--sf-${role}))`),
			...words(avatar, `rgb(var(--sf-fg_on_${role}))`),
		]
	}),

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
	// border in the brand ink. Consumer keeps layout / overflow / transition scoped.
	// At rest the edge is the text colour at 60%, as a field's: the frame is where you type,
	// so it must be found (3:1); the border grey is for boxes you don't act on.
	{
		classNames: ['sf-content-frame'],
		cssProperty: 'border',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-fg_primary) / var(--sf-alpha-6))',
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
		value: 'rgb(var(--sf-primary_ink))',
	},

	// ─── sf-field ─────────────────────────────────────────────────────────────
	// Shared editable-form-control chrome. Consumers on <input>, <select>, <textarea>
	// wear this alongside sf-size-* for padding scale. Element-specific extras
	// (select chevron etc.) live in compound rules below in the same layer.
	{ classNames: ['sf-field'], cssProperty: 'border-radius', value: 'var(--sf-radius-2)' },
	// Control-scale default, same as button.sf; sf-size-* overrides.
	{ classNames: ['sf-field'], cssProperty: '--sf-padding', value: 'var(--sf-spacing-xs)' },
	{ classNames: ['sf-field'], cssProperty: 'padding', value: 'var(--sf-padding)' },
	// Fields are writable surfaces. Explicit background + text colour make the
	// field visually distinct on any raised parent (depth-1+); on a bare page
	// (surface-0) the bg is the same as the canvas so it's invisible but the
	// border still delineates. Focus shows as on anything else.
	{
		classNames: ['sf-field'],
		cssProperty: 'background',
		value: underFill('rgb(var(--sf-surface-0))'),
	},
	{ classNames: ['sf-field'], cssProperty: 'color', value: 'rgb(var(--sf-fg_primary))' },
	// Inherit typography from the parent (match surrounding text) without inheriting
	// the reading line-height — the `font` shorthand would pull line-height too,
	// which stretches single-line controls in body-text contexts (body: 1.6).
	// Native <input>'s browser default line-height (`normal`, ~1.2) is right here.
	{ classNames: ['sf-field'], cssProperty: 'font-family', value: 'inherit' },
	{ classNames: ['sf-field'], cssProperty: 'font-size', value: 'inherit' },
	{ classNames: ['sf-field'], cssProperty: 'font-weight', value: 'inherit' },
	// The text colour at 60%: a field has no words of its own to mark it out, so its edge
	// is what shows it's there (3:1). Buttons' 30% edge is looks; their words show them.
	{
		classNames: ['sf-field'],
		cssProperty: 'border',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-fg_primary) / var(--sf-alpha-6))',
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
	// A divider: <hr class="sf">. Replaces the browser's inset border with a single line.
	// Space around it is the container's (a layout's gap, or block spacing), not the theme's.
	{ elementSelector: 'hr', classNames: ['sf'], cssProperty: 'height', value: '0' },
	{ elementSelector: 'hr', classNames: ['sf'], cssProperty: 'border', value: '0' },
	{
		elementSelector: 'hr',
		classNames: ['sf'],
		cssProperty: 'border-top',
		value: 'var(--sf-stroke-1) solid rgb(var(--sf-border_color))',
	},

	// ─── Table elements ───────────────────────────────────────────────────────
	// Theme-wide defaults for data tables. border-collapse:separate + border-spacing:0 is
	// required so that box-shadow works on sticky <td> cells (collapse merges cell paint layers
	// which clips overflow; separate gives each cell its own box).
	// depth controls surface colour and corners; pinned columns (sl-pin-*) get their overflow
	// treatment from the sf-is-overflow-* rules; border-bottom on tr:last-child td removes the
	// orphan bottom edge.
	{ elementSelector: 'table', cssProperty: 'border-collapse', value: 'separate' },
	{ elementSelector: 'table', cssProperty: 'border-spacing', value: '0' },
	// table.sf — data tables are dense; smaller text is the common default.
	{
		elementSelector: 'table',
		classNames: ['sf'],
		cssProperty: 'font-size',
		value: 'var(--sf-text-sm)',
	},
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
	return createClassRuleTrusted(db, { themeId, ...r })
}

// ─── Orchestrator ────────────────────────────────────────────────────────

async function wipeDesignSystem(db: Db): Promise<void> {
	// Themes cascade: theme_tokens, class_rules → class_rule_classes
	await db.delete(themes)
	// Vocabulary stands alone after rules are gone (no junction rows reference it)
	await db.delete(classVocabulary)
}

export async function seed(db: Db) {
	await wipeDesignSystem(db)

	await createTheme(db, {
		id: ROOT_ID,
		name: 'Root',
		isRoot: true,
		version: SEED_VERSION,
	})
	await createTheme(db, {
		id: DARK_ID,
		name: 'Dark',
		activationClass: 'theme-dark',
	})
	await createTheme(db, {
		id: PINK_ID,
		name: 'Pink',
		activationClass: 'theme-pink',
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
		themesCreated: 3,
		tokensSet,
		vocabularyEntries: VOCABULARY.length,
		rulesCreated,
		collapseStepsSeeded: COLLAPSE_THRESHOLDS.length,
	}
}
