import { count, max } from 'drizzle-orm'
import { collapseThresholds } from '../schemas/layout.js'
import {
	type Theme,
	type ThemeToken,
	classRules,
	classVocabulary,
	themeTokens,
	themes,
} from '../schemas/theme.js'
import { type ClassRuleWithClasses, listAllRules } from './classRules.js'
import { type CollapseThreshold, listCollapseThresholds } from './collapseThresholds.js'
import { BLOCK_SPACING } from './css/blockSpacing.js'
import { SF_ELEMENT_DEFAULTS } from './css/elementDefaults.js'
import { EMBEDS } from './css/embeds.js'
import { NODE_VIEWS } from './css/nodeViews.js'
import { RESET } from './css/reset.js'
import { BLEEDS_FROM_DOCUMENT, SL_COMBINED } from './css/slCombined.js'
import {
	COLLAPSE_CLASS_SELECTOR,
	COLLAPSE_HOST_SELECTOR,
	SIZED_BY_CONTENT_SELECTOR,
	SL_LAYOUT,
	SWAP_CLASS_SELECTOR,
	forLooks,
	forPlacement,
} from './css/slLayout.js'
import { SL_OBJECT } from './css/slObject.js'
import { ValidationError } from './errors.js'
import { SEED_VERSION } from './seedVersion.js'
import { listAllTokens } from './themeTokens.js'
import { getRootThemeOrThrow, listThemes } from './themes.js'
import { type ClassKind, type Db, KIND_SORT_ORDER, KIND_TO_LAYER, type Layer } from './types.js'

// ─── Public API ──────────────────────────────────────────────────────────
// `emitStylesheet` is the pure builder. `getStylesheet` wraps it with an
// in-isolate memo keyed by `themeSignature` — cheap aggregate query that
// changes whenever themes/tokens/rules/vocabulary do.

export async function emitStylesheet(db: Db): Promise<string> {
	const rootTheme = await getRootThemeOrThrow(db)
	if (rootTheme.version !== SEED_VERSION)
		console.warn(
			`[sf-system] DB seed version ${rootTheme.version} !== code version ${SEED_VERSION} — run pnpm seed:local (seed:live for live)`,
		)
	const [themesList, allTokens, allRules, collapseThresholds] = await Promise.all([
		listThemes(db),
		listAllTokens(db),
		listAllRules(db),
		listCollapseThresholds(db),
	])

	const tokensByTheme = groupTokensByTheme(allTokens)
	const rootTokens = tokensByTheme.get(rootTheme.id)
	if (!rootTokens || rootTokens.length === 0)
		throw new ValidationError(`Root theme ${rootTheme.id} has no tokens`)

	const buckets = classifyTokens(rootTokens)
	const rulesByLayer = groupRulesByLayer(allRules)

	const sections = [
		HEADER,
		RESET,
		SF_ELEMENT_DEFAULTS,
		emitTokenBlocks(themesList, tokensByTheme),
		emitRichLayer('sf-element', themesList, rootTheme, rulesByLayer),
		emitRichLayer('sf-bundle', themesList, rootTheme, rulesByLayer),
		emitRichLayer('sf-variant', themesList, rootTheme, rulesByLayer),
		emitRichLayer('sf-context', themesList, rootTheme, rulesByLayer),
		emitSemanticLayer(buckets.semantic),
		emitUtilityLayer(buckets),
		emitRichLayer('sf-state', themesList, rootTheme, rulesByLayer),
		emitRichLayer('sl-layout', themesList, rootTheme, rulesByLayer),
		// Hand-written blocks come after the DB rules of their layer, so they sit
		// above every cascade_order at equal specificity.
		SL_LAYOUT,
		SL_OBJECT,
		SL_COMBINED,
		emitCollapseLayer(collapseThresholds),
		// How a TipTap document's blocks sit, in the editor and on published pages.
		NODE_VIEWS,
		BLOCK_SPACING,
		EMBEDS,
		emitEditorLayer(buckets),
	]
	return sections.filter((s) => s.length > 0).join('\n')
}

export interface CachedCss {
	css: string
	etag: string
}

let cache: { signature: string; result: CachedCss } | null = null

export async function getStylesheet(db: Db): Promise<CachedCss> {
	const signature = await themeSignature(db)
	if (cache && cache.signature === signature) return cache.result
	const css = await emitStylesheet(db)
	// The ETag is a hash of the stylesheet itself, so any change gives a new one: DB data, or
	// the fixed CSS and emitters in code. The signature only decides when to rebuild; new code
	// runs in a new isolate, so it never keeps a stale build.
	const result: CachedCss = { css, etag: `"${await contentHash(css)}"` }
	cache = { signature, result }
	return result
}

async function contentHash(text: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Signature for the in-isolate cache: it changes whenever the generated CSS can. Each table
// gives its row count (an add or remove); themes, vocabulary and collapse thresholds also give
// their latest `updated_at` (an edit; token and rule changes bump their theme's through
// `touchTheme`).
export async function themeSignature(db: Db): Promise<string> {
	const [themeAgg, tokenAgg, vocabAgg, ruleAgg, collapseThresholdAgg] = await Promise.all([
		db
			.select({ max: max(themes.updatedAt), count: count() })
			.from(themes)
			.get(),
		db.select({ count: count() }).from(themeTokens).get(),
		db
			.select({ max: max(classVocabulary.updatedAt), count: count() })
			.from(classVocabulary)
			.get(),
		db.select({ count: count() }).from(classRules).get(),
		db
			.select({ max: max(collapseThresholds.updatedAt), count: count() })
			.from(collapseThresholds)
			.get(),
	])
	// Drizzle types `.get()` as `T | undefined`, but aggregate queries
	// always return exactly one row. Narrow with a throw.
	if (!themeAgg || !tokenAgg || !vocabAgg || !ruleAgg || !collapseThresholdAgg)
		throw new Error('themeSignature: aggregate query returned no row')

	const maxMs = themeAgg.max === null ? 0 : themeAgg.max.getTime()
	const vocabMs = vocabAgg.max === null ? 0 : vocabAgg.max.getTime()
	const collapseMs = collapseThresholdAgg.max === null ? 0 : collapseThresholdAgg.max.getTime()
	return `${maxMs}.${themeAgg.count}.${tokenAgg.count}.${vocabMs}.${vocabAgg.count}.${ruleAgg.count}.${collapseMs}.${collapseThresholdAgg.count}`
}

// ─── Header ─────────────────────────────────────────────────────────────

const HEADER = `/* Generated from D1 — runtime-emitted, do not cache stale. */
@layer reset, ui, sf-element, sf-bundle, sf-variant, sf-context, sf-semantic, sf-utility, sf-state, sl-layout;`

// ─── Tokens ─────────────────────────────────────────────────────────────

function groupTokensByTheme(tokens: ThemeToken[]): Map<string, ThemeToken[]> {
	const out = new Map<string, ThemeToken[]>()
	for (const tk of tokens) {
		const list = out.get(tk.themeId)
		if (list) list.push(tk)
		else out.set(tk.themeId, [tk])
	}
	return out
}

function emitTokenBlocks(themesList: Theme[], tokensByTheme: Map<string, ThemeToken[]>): string {
	const blocks: string[] = []
	for (const theme of themesList) {
		const list = tokensByTheme.get(theme.id)
		if (!list) continue
		const selector = theme.isRoot ? ':root' : `.${theme.activationClass}`
		let block = `${selector} {\n`
		for (const tk of list) block += `\t${tk.name}: ${tk.value};\n`
		block += '}'
		blocks.push(block)
	}
	return blocks.join('\n\n')
}

// ─── Token classification (drives auto-derived classes) ──────────────────

interface BucketEntry {
	suffix: string
	name: string
}
interface Buckets {
	palette: BucketEntry[]
	semantic: BucketEntry[]
	text: BucketEntry[]
	leading: BucketEntry[]
	tracking: BucketEntry[]
	radius: BucketEntry[]
	spacing: BucketEntry[]
	fontFamily: BucketEntry[]
	weight: BucketEntry[]
	shadow: BucketEntry[]
	alpha: BucketEntry[]
	opacity: BucketEntry[]
}

function suffixOf(name: string): string {
	return name.replace(/^--sf-/, '')
}

function stepOf(suffix: string): string {
	return suffix.replace(/^[a-z]+(?:_[a-z]+)?-/, '')
}

function familyOf(suffix: string): string {
	const m = suffix.match(/^([a-z]+(?:_[a-z]+)?)(?:[-_].*)?$/)
	return m?.[1] ?? suffix
}

const TRIPLET = /^\s*\d+\s+\d+\s+\d+\s*$/

function classifyTokens(rootTokens: ThemeToken[]): Buckets {
	const b: Buckets = {
		palette: [],
		semantic: [],
		text: [],
		leading: [],
		tracking: [],
		radius: [],
		spacing: [],
		fontFamily: [],
		weight: [],
		shadow: [],
		alpha: [],
		opacity: [],
	}
	for (const tk of rootTokens) {
		const suffix = suffixOf(tk.name)
		if (suffix === 'shadow-opacity') continue

		const entry: BucketEntry = { suffix, name: tk.name }
		if (tk.kind === 'color-triplet') {
			// Skip semantic aliases whose values are var() refs (e.g. --sf-primary:
			// var(--sf-primary-5)). Those are not palette steps and would produce a
			// phantom shade entry alongside the numbered steps they alias.
			if (!TRIPLET.test(tk.value)) continue
			b.palette.push(entry)
			if (suffix.startsWith('fg_') || suffix.startsWith('border_')) b.semantic.push(entry)
			continue
		}

		if (suffix.startsWith('text-')) b.text.push(entry)
		else if (suffix.startsWith('leading-')) b.leading.push(entry)
		else if (suffix.startsWith('tracking-')) b.tracking.push(entry)
		else if (suffix.startsWith('radius-')) b.radius.push(entry)
		else if (suffix.startsWith('spacing-')) b.spacing.push(entry)
		else if (suffix.startsWith('font-')) b.fontFamily.push(entry)
		else if (suffix.startsWith('weight-')) b.weight.push(entry)
		else if (suffix.startsWith('alpha-')) b.alpha.push(entry)
		else if (suffix.startsWith('opacity-')) b.opacity.push(entry)
		else if (tk.kind === 'shadow-shape') b.shadow.push(entry)
	}
	return b
}

// ─── Rule grouping (for rich-class emission) ─────────────────────────────

interface CssProp {
	property: string
	value: string
}
interface SelectorBlock {
	// Highest cascade_order among the selector's classes — sorts the block within its layer.
	order: number
	props: CssProp[]
}
type LayerRules = Map<string, Map<string, SelectorBlock>>
// themeId → selector → block

function groupRulesByLayer(rules: ClassRuleWithClasses[]): Map<Layer, LayerRules> {
	const out = new Map<Layer, LayerRules>()
	for (const rule of rules) {
		const sorted = [...rule.classes].sort(compareClasses)
		const selector = buildSelector(sorted, rule.pseudo ?? null, rule.elementSelector ?? null)
		const layer = ruleLayerFor(sorted, rule.elementSelector ?? null)

		let layerMap = out.get(layer)
		if (!layerMap) {
			layerMap = new Map()
			out.set(layer, layerMap)
		}

		let themeMap = layerMap.get(rule.themeId)
		if (!themeMap) {
			themeMap = new Map()
			layerMap.set(rule.themeId, themeMap)
		}

		let block = themeMap.get(selector)
		if (!block) {
			block = { order: Math.max(0, ...sorted.map((c) => c.cascadeOrder)), props: [] }
			themeMap.set(selector, block)
		}

		block.props.push({ property: rule.cssProperty, value: rule.value })
	}
	return out
}

function compareClasses(
	a: { name: string; kind: string },
	b: { name: string; kind: string },
): number {
	const ka = KIND_SORT_ORDER[a.kind as ClassKind]
	const kb = KIND_SORT_ORDER[b.kind as ClassKind]
	if (ka !== kb) return ka - kb
	return a.name.localeCompare(b.name)
}

function buildSelector(
	sortedClasses: readonly { name: string; kind: string; pseudo: string | null }[],
	rulePseudo: string | null = null,
	elementSelector: string | null = null,
): string {
	let base = elementSelector ?? ''
	let pseudos = ''
	for (const c of sortedClasses) {
		base += `.${c.name}`
		if (c.kind === 'state' && c.pseudo) pseudos += c.pseudo
	}
	// Vocab pseudo-classes (:hover etc.) come before rule pseudo-elements (::after etc.)
	return base + pseudos + (rulePseudo ?? '')
}

// Highest kind's layer. Classes are sorted element → layout (KIND_SORT_ORDER), so the last
// one's kind is the highest.
// Bare element rules (no classes) go in sf-element — baseline layer, ordered
// before sf-bundle so any bundle/variant/state layered on top wins predictably.
// The element analog for class-based markers (sf-chip etc.) lives here too via
// KIND_TO_LAYER, keeping structural/identity rules in one layer.
function ruleLayerFor(
	sortedClasses: readonly { kind: string }[],
	elementSelector: string | null = null,
): Layer {
	const last = sortedClasses[sortedClasses.length - 1]
	if (!last) {
		if (elementSelector) return 'sf-element'
		throw new Error(
			'rule with zero classes and no element selector — domain invariant violated',
		)
	}
	return KIND_TO_LAYER[last.kind as ClassKind]
}

// ─── Rich-class emission ─────────────────────────────────────────────────

function emitRichLayer(
	layer: Layer,
	themesList: Theme[],
	rootTheme: Theme,
	rulesByLayer: Map<Layer, LayerRules>,
): string {
	const layerMap = rulesByLayer.get(layer)
	if (!layerMap || layerMap.size === 0) return ''

	let body = ''

	const rootRules = layerMap.get(rootTheme.id)
	if (rootRules) body += emitThemeBlocks(rootRules, '\t')

	// Theme rules are scoped rather than prefixed: @scope adds no specificity, so a
	// theme restyles a class without outranking root compounds, and the nearest
	// theme wins when themes nest. :scope is included — the element carrying the
	// theme class is themed too.
	for (const theme of themesList) {
		if (theme.isRoot) continue
		const themeRules = layerMap.get(theme.id)
		if (!themeRules) continue
		body += `\t@scope (.${theme.activationClass}) {\n${emitThemeBlocks(themeRules, '\t\t')}\t}\n`
	}

	if (body.length === 0) return ''
	return `@layer ${layer} {\n${body}}\n`
}

// Within a layer, equal-specificity ties go to the later rule: sort by cascade_order,
// then alphabetically so unordered classes keep a stable, deterministic output.
function emitThemeBlocks(rules: Map<string, SelectorBlock>, indent: string): string {
	let out = ''
	const sorted = [...rules.entries()].sort(
		([a, ba], [b, bb]) => ba.order - bb.order || a.localeCompare(b),
	)
	for (const [sel, { props }] of sorted) {
		out += `${indent}${forNodeViews(sel)} {\n`
		for (const { property, value } of props) out += `${indent}\t${property}: ${value};\n`
		out += `${indent}}\n`
	}
	return out
}

// A theme rule is written for the content tree; a block a component renders has boxes around
// and inside it (nodeViewSelectors.ts). Every theme rule is a look, so it lands on the element
// wearing the classes. Rewritten after sorting, so ties keep the order of the selector as
// written. A selector the helper can't rewrite is emitted as written (which still works for
// plain blocks) and reported, rather than failing the whole stylesheet.
function forNodeViews(selector: string): string {
	try {
		return forLooks(selector)
	} catch (error) {
		console.warn(`[sf-system] ${(error as Error).message}; emitted as written`)
		return selector
	}
}

// ─── Auto-derived layers (semantic + utility + editor) ───────────────────

function emitSemanticLayer(semantic: BucketEntry[]): string {
	if (semantic.length === 0) return ''
	let out = '@layer sf-semantic {\n'
	for (const { suffix, name } of semantic) {
		const property = suffix.startsWith('fg_') ? 'color' : 'border-color'
		out += `\t.sf-${suffix} { ${property}: rgb(var(${name})); }\n`
	}
	return out + '}\n'
}

function emitUtilityLayer(b: Buckets): string {
	const sections: string[] = []

	if (
		b.fontFamily.length
		|| b.weight.length
		|| b.text.length
		|| b.leading.length
		|| b.tracking.length
	) {
		let s = section('Typography')
		for (const e of b.fontFamily) s += util(e, 'font-family')
		for (const e of b.weight) s += util(e, 'font-weight')
		for (const e of b.text) s += util(e, 'font-size')
		for (const e of b.leading) s += util(e, 'line-height')
		for (const e of b.tracking) s += util(e, 'letter-spacing')
		sections.push(s)
	}

	if (b.radius.length) {
		let s = section('Radius')
		for (const e of b.radius) s += util(e, 'border-radius')
		sections.push(s)
	}

	if (b.spacing.length) {
		let s = section('Spacing — sets runtime --sf-gap / --sf-padding for layout primitives')
		for (const e of b.spacing)
			s += `\t.sf-gap-${stepOf(e.suffix)} { --sf-gap: var(${e.name}); }\n`
		for (const e of b.spacing)
			s += `\t.sf-padding-${stepOf(e.suffix)} { --sf-padding: var(${e.name}); }\n`
		sections.push(s)
	}

	if (b.shadow.length) {
		let s = section(
			'Shadow — shape × theme colour at theme opacity; inline --sf-shadow-color overrides',
		)
		for (const e of b.shadow)
			s += `\t.sf-${e.suffix} { box-shadow: var(${e.name}) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity))); }\n`
		sections.push(s)
	}

	if (b.opacity.length) {
		let s = section('Opacity — element-wide alpha; separate scale from channel-tint alphas')
		for (const e of b.opacity) s += util(e, 'opacity')
		sections.push(s)
	}

	if (sections.length === 0) return ''
	return `@layer sf-utility {\n${sections.join('\n')}}\n`
}

const util = (e: BucketEntry, property: string): string =>
	`\t.sf-${e.suffix} { ${property}: var(${e.name}); }\n`

const section = (title: string): string =>
	`\t/* ── ${title} ─────────────────────────────────────────── */\n`

// ─── Collapse layer ──────────────────────────────────────────────────────
// sl-collapse-* is vocabulary-only in the DB (var() is not valid in @container
// conditions). CSS is generated here from the collapse thresholds so the pixel widths
// can be embedded directly in @container conditions.
// Each collapsible layout primitive gets a compound selector per breakpoint.
//   Collapse measures the space a block has: the nearest width container around it. A
//     layout holding a collapsing element is one, and so is a component block's wrapper
//     when the block itself collapses (nodeViews.ts), so a layout block measures its own
//     space. A width container takes no width from its content, so nothing sized by its
//     content becomes one (SIZED_BY_CONTENT_SELECTOR) — it would be 0 wide; what it holds
//     measures the next box out.
//   sl-hide-below-* / sl-show-below-* use the same widths to swap what shows: hidden at or
//     below the width, or shown only then (a menu button in place of inline links). In a
//     document (the editor and published pages) they measure the document: "hide below md"
//     means the page is narrower than md, so a layout there doesn't become a container for
//     them. On app screens they measure their container; with none around them they always
//     show.
//   The document is always a width container, named so the swap finds it past nearer ones;
//     a top-level block collapses against it.
//   A top-level block that bleeds out of a document in an inset is wider than the document,
//     so a layout there collapses by the box it bleeds into (sf-bleed-area, slCombined.ts)
//     instead. A component block's wrapper bleeds with it, so its root measures it as usual.
//     A block that bleeds is a width container when it holds a collapsing element, so what's
//     inside measures it, not the narrower document; it's never sized by its content.

const COLLAPSE_GRID = ['.sl-columns', '.sl-split', '.sl-grid']
const COLLAPSE_FLEX = ['.sl-cluster']
const DOCUMENT = '.tiptap.ProseMirror'
const OUTSIDE_DOCUMENTS = `:where(:not(${DOCUMENT} *))`

// A collapsing layout at a breakpoint stacks: a grid goes to one column, a cluster to a
// column. `scope` narrows which ones, without adding weight.
function stackRules(name: string, scope: string): string {
	const at = (layouts: string[]) =>
		layouts.map((s) => `\t\t${s}.sl-collapse-${name}${scope}`).join(',\n')
	return (
		`${at(COLLAPSE_GRID)} { grid-template-columns: 1fr; }\n`
		+ `${at(COLLAPSE_FLEX)} { flex-direction: column; align-items: stretch; }\n`
	)
}

function emitCollapseLayer(collapseThresholds: CollapseThreshold[]): string {
	if (collapseThresholds.length === 0) return ''

	const notSized = `:where(:not(${SIZED_BY_CONTENT_SELECTOR}))`
	let body = `\t${DOCUMENT} { container: sf-document / inline-size; }\n`
	for (const host of [
		...hostsFor(notSized, COLLAPSE_CLASS_SELECTOR),
		...hostsFor(`${notSized}${OUTSIDE_DOCUMENTS}`, SWAP_CLASS_SELECTOR),
		`${BLEEDS_FROM_DOCUMENT}:has(${COLLAPSE_CLASS_SELECTOR})`,
	])
		body += `\t${host} { container-type: inline-size; }\n`
	for (const { name, value } of collapseThresholds) {
		body += `\t@container (width <= ${value}) {\n`
		body += stackRules(name, `:where(:not(${BLEEDS_FROM_DOCUMENT}))`)
		body += `\t\t.sl-hide-below-${name}${OUTSIDE_DOCUMENTS} { display: none; }\n`
		body += '\t}\n'
		body += `\t@container sf-bleed-area (width <= ${value}) {\n`
		body += stackRules(name, `:where(${BLEEDS_FROM_DOCUMENT})`)
		body += '\t}\n'
		// Emitted after the layout primitives, so it wins over their display on the same element.
		body += `\t@container (width > ${value}) {\n`
		body += `\t\t.sl-show-below-${name}${OUTSIDE_DOCUMENTS} { display: none; }\n`
		body += '\t}\n'
		// In a document it's the box the parent places that hides, so a component block's
		// wrapper goes and leaves no gap.
		body += `\t@container sf-document (width <= ${value}) {\n`
		body += `\t\t${forPlacement(`:where(${DOCUMENT}) .sl-hide-below-${name}`)} { display: none; }\n`
		body += '\t}\n'
		body += `\t@container sf-document (width > ${value}) {\n`
		body += `\t\t${forPlacement(`:where(${DOCUMENT}) .sl-show-below-${name}`)} { display: none; }\n`
		body += '\t}\n'
	}
	return `@layer sl-layout {\n${body}}\n`
}

// The layouts that measure for what's inside them. A popover is laid out on its own (the top
// layer), wherever it sits in the page: what's inside one doesn't make the boxes around it
// measure — a toolbar row holding a closed panel would otherwise be 0 wide — and inside it,
// layouts measure as usual.
function hostsFor(scope: string, inside: string): string[] {
	return [
		`:is(${COLLAPSE_HOST_SELECTOR})${scope}:where(:not([popover] *)):has(:is(${inside}):not([popover] *))`,
		`[popover] :is(${COLLAPSE_HOST_SELECTOR})${scope}:has(${inside})`,
	]
}

function emitEditorLayer(b: Buckets): string {
	if (b.palette.length === 0 && b.alpha.length === 0) return ''

	const byFamily = new Map<string, BucketEntry[]>()
	for (const e of b.palette) {
		const fam = familyOf(e.suffix)
		const list = byFamily.get(fam)
		if (list) list.push(e)
		else byFamily.set(fam, [e])
	}

	const familyTitles: Record<string, string> = {
		primary: 'Primary palette',
		surface: 'Surface palette',
		fg_primary: 'Semantic — fg_primary',
		fg_inverted: 'Semantic — fg_inverted',
		border_color: 'Semantic — border_color',
		shadow: 'Semantic — shadow',
		danger: 'Semantic — danger',
	}
	const knownOrder = [
		'primary',
		'surface',
		'fg_primary',
		'fg_inverted',
		'border_color',
		'shadow',
		'danger',
	]
	const familyOrder = [
		...knownOrder.filter((f) => byFamily.has(f)),
		...[...byFamily.keys()].filter((f) => !knownOrder.includes(f)).sort(),
	]

	const sections: string[] = []
	for (const fam of familyOrder) {
		const items = byFamily.get(fam)
		if (!items) continue
		let s = section(familyTitles[fam] ?? fam)
		for (const e of items)
			s += `\t.sf-bg-${e.suffix} { --sf-bg-alpha: 1; background-color: rgb(var(${e.name}) / var(--sf-bg-alpha)); }\n`
		for (const e of items)
			s += `\t.sf-color-${e.suffix} { --sf-color-alpha: 1; color: rgb(var(${e.name}) / var(--sf-color-alpha)); }\n`
		for (const e of items)
			s += `\t.sf-border-${e.suffix} { --sf-border-alpha: 1; border-color: rgb(var(${e.name}) / var(--sf-border-alpha)); }\n`
		for (const e of items)
			s += `\t.sf-shadow-color-${e.suffix} { --sf-shadow-alpha: 1; --sf-shadow-color: rgb(var(${e.name}) / var(--sf-shadow-alpha)); }\n`
		sections.push(s)
	}

	if (b.alpha.length) {
		let s = section('Alpha pairings — last so they override the reset')
		for (const e of b.alpha)
			s += `\t.sf-bg-alpha-${stepOf(e.suffix)} { --sf-bg-alpha: var(${e.name}); }\n`
		for (const e of b.alpha)
			s += `\t.sf-color-alpha-${stepOf(e.suffix)} { --sf-color-alpha: var(${e.name}); }\n`
		for (const e of b.alpha)
			s += `\t.sf-border-alpha-${stepOf(e.suffix)} { --sf-border-alpha: var(${e.name}); }\n`
		for (const e of b.alpha)
			s += `\t.sf-shadow-alpha-${stepOf(e.suffix)} { --sf-shadow-alpha: var(${e.name}); }\n`
		sections.push(s)
	}

	const header = '/* Editor-pairing classes — see sf-system.md "Colours and alpha". */\n'
	return `${header}@layer sf-utility {\n${sections.join('\n')}}\n`
}
