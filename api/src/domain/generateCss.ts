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
			`[sf-system] DB seed version ${rootTheme.version} !== code version ${SEED_VERSION} — run pnpm seed:local`,
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
		SL_OBJECT,
		emitCollapseLayer(collapseThresholds),
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
	const result: CachedCss = { css, etag: `"${signature}"` }
	cache = { signature, result }
	return result
}

// Signature for cache + ETag. Captures every change path that affects the
// generated CSS: theme add/remove (themeCount), token add/remove
// (tokenCount), rule add/remove (ruleCount), vocabulary add/remove
// (vocabCount), and any theme-scoped value edit (themeMax — bumped by
// `touchTheme` from token/rule mutators).
export async function themeSignature(db: Db): Promise<string> {
	const [themeAgg, tokenAgg, vocabAgg, ruleAgg, collapseThresholdAgg] = await Promise.all([
		db
			.select({ max: max(themes.updatedAt), count: count() })
			.from(themes)
			.get(),
		db.select({ count: count() }).from(themeTokens).get(),
		db.select({ count: count() }).from(classVocabulary).get(),
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
	const collapseMs = collapseThresholdAgg.max === null ? 0 : collapseThresholdAgg.max.getTime()
	return `${maxMs}.${themeAgg.count}.${tokenAgg.count}.${vocabAgg.count}.${ruleAgg.count}.${collapseMs}.${collapseThresholdAgg.count}`
}

// ─── Header ─────────────────────────────────────────────────────────────

const HEADER = `/* Generated from D1 — runtime-emitted, do not cache stale. */
@layer reset, ui, sf-element, sf-bundle, sf-variant, sf-context, sf-semantic, sf-utility, sf-state;`

// Static resets — no theme dependency, never stored in DB.
// Lowest cascade priority (reset layer declared first).
const RESET = `@layer reset {
\t/* Remove trailing margin from the last child of any table cell */
\ttd > *:last-child,
\tth > *:last-child { margin-bottom: 0; }

\t/* sf-swatch structural — display enables width/height on the marker;
\t   background-clip guards padded-frame themes so bg doesn't bleed into the border. */
\t.sf-swatch { display: inline-block; background-clip: padding-box; }

\t/* Native colour input: strip UA inset chrome so swatch treatment can render. */
\tinput[type="color"].sf-swatch { padding: 0; background: none; }

\t/* Native <select>.sf-field: strip UA appearance so the custom chevron renders,
\t   align cursor across browsers (Firefox: pointer, Chrome: default). */
\tselect.sf-field { appearance: none; cursor: pointer; }
}`

// Static sf-element defaults — page-wide baselines using sf tokens.
// Emitted before DB-seeded sf-element rules so seed rules for the same
// selectors win within the layer. Themes override via sf-bundle or higher.
const SF_ELEMENT_DEFAULTS = `@layer sf-element {
\tbody {
\t\tcolor: rgb(var(--sf-fg_primary));
\t\tbackground-color: rgb(var(--sf-surface-0));
\t}
\t*:focus-visible {
\t\toutline: var(--sf-stroke-2) solid rgb(var(--sf-primary));
\t}
}`

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
		else if (tk.kind === 'shadow-shape') b.shadow.push(entry)
	}
	return b
}

// ─── Rule grouping (for rich-class emission) ─────────────────────────────

interface CssProp {
	property: string
	value: string
}
type LayerRules = Map<string, Map<string, CssProp[]>>
// themeId → selector → properties

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

		let props = themeMap.get(selector)
		if (!props) {
			props = []
			themeMap.set(selector, props)
		}

		props.push({ property: rule.cssProperty, value: rule.value })
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

// Highest kind's layer. Classes are sorted bundle → layout so the last entry wins.
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
	if (rootRules) body += emitThemeBlocks(rootRules, '')

	for (const theme of themesList) {
		if (theme.isRoot) continue
		const themeRules = layerMap.get(theme.id)
		if (!themeRules) continue
		body += emitThemeBlocks(themeRules, `.${theme.activationClass} `)
	}

	if (body.length === 0) return ''
	return `@layer ${layer} {\n${body}}\n`
}

function emitThemeBlocks(rules: Map<string, CssProp[]>, selectorPrefix: string): string {
	let out = ''
	const sorted = [...rules.entries()].sort(([a], [b]) => a.localeCompare(b))
	for (const [sel, props] of sorted) {
		out += `\t${selectorPrefix}${sel} {\n`
		for (const { property, value } of props) out += `\t\t${property}: ${value};\n`
		out += '\t}\n'
	}
	return out
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

	if (sections.length === 0) return ''
	return `@layer sf-utility {\n${sections.join('\n')}}\n`
}

const util = (e: BucketEntry, property: string): string =>
	`\t.sf-${e.suffix} { ${property}: var(${e.name}); }\n`

const section = (title: string): string =>
	`\t/* ── ${title} ─────────────────────────────────────────── */\n`

// ─── Object-fit layer ────────────────────────────────────────────────────
// sl-object-* is vocabulary-only in the DB — the rules need child element
// selectors (.sl-object-cover > img:only-child) which the class_rules schema
// cannot express (selector is always the class element, not a descendant).
// Two selectors per value:
//   img.sl-object-*             — class on the <img> itself (TipTap image node).
//                                 No height: the img's own aspect-ratio determines it.
//   .sl-object-* > img:only-child — class on a container; the container provides the
//                                   height via its own aspect-ratio, so height: 100%
//                                   fills that box. :only-child guard prevents affecting
//                                   images alongside other content.

const SL_OBJECT = `@layer sl-layout {
\timg.sl-object-cover { object-fit: cover; width: 100%; display: block; }
\t.sl-object-cover > img:only-child { object-fit: cover; width: 100%; height: 100%; display: block; }
\timg.sl-object-contain { object-fit: contain; width: 100%; display: block; }
\t.sl-object-contain > img:only-child { object-fit: contain; width: 100%; height: 100%; display: block; }
\timg.sl-object-fill { object-fit: fill; width: 100%; display: block; }
\t.sl-object-fill > img:only-child { object-fit: fill; width: 100%; height: 100%; display: block; }
\timg.sl-object-none { object-fit: none; display: block; }
\t.sl-object-none > img:only-child { object-fit: none; display: block; }
}\n`

// ─── Collapse layer ──────────────────────────────────────────────────────
// sl-collapse-* is vocabulary-only in the DB (var() is not valid in @container
// conditions). CSS is generated here from the resolved breakpoint token values
// so the pixel widths can be embedded directly in @container conditions.
// Each collapsible layout primitive gets a compound selector per breakpoint.

const COLLAPSE_GRID = ['.sl-columns', '.sl-split', '.sl-grid']
const COLLAPSE_FLEX = ['.sl-cluster']

function emitCollapseLayer(collapseThresholds: CollapseThreshold[]): string {
	if (collapseThresholds.length === 0) return ''

	let body = ''
	for (const { name, value } of collapseThresholds) {
		const gridSels = COLLAPSE_GRID.map((s) => `\t\t${s}.sl-collapse-${name}`).join(',\n')
		const flexSels = COLLAPSE_FLEX.map((s) => `\t\t${s}.sl-collapse-${name}`).join(',\n')
		body += `\t@container (width <= ${value}) {\n`
		body += `${gridSels} { grid-template-columns: 1fr; }\n`
		body += `${flexSels} { flex-direction: column; align-items: stretch; }\n`
		body += '\t}\n'
	}
	return `@layer sl-layout {\n${body}}\n`
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
