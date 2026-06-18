#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiDir = join(__dirname, '..')
const assetsDir = join(apiDir, '..', 'client', 'src', 'assets')

function query(sql) {
	const raw = execSync(`npx wrangler d1 execute somefreq-db --local --json --command="${sql}"`, {
		cwd: apiDir,
		encoding: 'utf-8',
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const parsed = JSON.parse(raw)
	return parsed[0]?.results ?? []
}

const themes = query(
	'SELECT slug, activation_class, is_root FROM themes ORDER BY is_root DESC, slug',
)
const tokens = query(
	'SELECT theme_slug, name, value, kind FROM theme_tokens ORDER BY theme_slug, name',
)

// ─── generated-tokens.css ─────────────────────────────────────────────────

const tokensByTheme = new Map()
for (const t of tokens) {
	if (!tokensByTheme.has(t.theme_slug)) tokensByTheme.set(t.theme_slug, [])
	tokensByTheme.get(t.theme_slug).push(t)
}

let tokensCss = '/* Generated from D1 — do not edit. Run: pnpm generate:css */\n\n'
for (const theme of themes) {
	const themeTokens = tokensByTheme.get(theme.slug) ?? []
	if (themeTokens.length === 0) continue
	const selector = theme.is_root ? ':root' : `.${theme.activation_class}`
	tokensCss += `${selector} {\n`
	for (const tk of themeTokens) {
		tokensCss += `\t${tk.name}: ${tk.value};\n`
	}
	tokensCss += '}\n\n'
}

// ─── Classify root tokens to drive class emission ────────────────────────

const suffixOf = (name) => name.replace(/^--sf-/, '')
const stepOf = (suffix) => suffix.replace(/^[a-z]+(?:_[a-z]+)?-/, '')
const familyOf = (suffix) => {
	const m = suffix.match(/^([a-z]+(?:_[a-z]+)?)(?:[-_].*)?$/)
	return m ? m[1] : suffix
}

const buckets = {
	palette: [], // color-triplet → editor bg/color/border classes
	semantic: [], // fg_* / border_* → semantic canonical class
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

const rootTokens = tokensByTheme.get('root') ?? []
for (const tk of rootTokens) {
	const suffix = suffixOf(tk.name)
	// Tokens that exist for editor/component introspection but emit no class.
	if (suffix.startsWith('breakpoint-')) continue
	if (suffix === 'shadow-opacity') continue

	if (tk.kind === 'color-triplet') {
		buckets.palette.push({ suffix, name: tk.name })
		if (suffix.startsWith('fg_') || suffix.startsWith('border_')) {
			buckets.semantic.push({ suffix, name: tk.name })
		}
		continue
	}

	if (suffix.startsWith('text-')) buckets.text.push({ suffix, name: tk.name })
	else if (suffix.startsWith('leading-')) buckets.leading.push({ suffix, name: tk.name })
	else if (suffix.startsWith('tracking-')) buckets.tracking.push({ suffix, name: tk.name })
	else if (suffix.startsWith('radius-')) buckets.radius.push({ suffix, name: tk.name })
	else if (suffix.startsWith('spacing-')) buckets.spacing.push({ suffix, name: tk.name })
	else if (suffix.startsWith('font-')) buckets.fontFamily.push({ suffix, name: tk.name })
	else if (suffix.startsWith('weight-')) buckets.weight.push({ suffix, name: tk.name })
	else if (suffix.startsWith('alpha-')) buckets.alpha.push({ suffix, name: tk.name })
	else if (tk.kind === 'shadow-shape') buckets.shadow.push({ suffix, name: tk.name })
}

// ─── generated-classes.css (core sf — semantic + value-linked utilities) ──

let classesCss = '/* Generated from D1 — do not edit. Run: pnpm generate:css */\n\n'

if (buckets.semantic.length) {
	classesCss += '@layer sf-semantic {\n'
	for (const { suffix, name } of buckets.semantic) {
		const property = suffix.startsWith('fg_') ? 'color' : 'border-color'
		classesCss += `\t.sf-${suffix} { ${property}: rgb(var(${name})); }\n`
	}
	classesCss += '}\n\n'
}

classesCss += '@layer sf-utility {\n'

const emitLine = (cls, prop, valueRef) => `\t.sf-${cls} { ${prop}: var(${valueRef}); }\n`

let needNewline = false
const section = (title) => {
	const prefix = needNewline ? '\n' : ''
	needNewline = true
	return `${prefix}\t/* ── ${title} ─────────────────────────────────────────── */\n`
}

if (
	buckets.fontFamily.length
	|| buckets.weight.length
	|| buckets.text.length
	|| buckets.leading.length
	|| buckets.tracking.length
) {
	classesCss += section('Typography')
	for (const { suffix, name } of buckets.fontFamily)
		classesCss += emitLine(suffix, 'font-family', name)
	for (const { suffix, name } of buckets.weight)
		classesCss += emitLine(suffix, 'font-weight', name)
	for (const { suffix, name } of buckets.text) classesCss += emitLine(suffix, 'font-size', name)
	for (const { suffix, name } of buckets.leading)
		classesCss += emitLine(suffix, 'line-height', name)
	for (const { suffix, name } of buckets.tracking)
		classesCss += emitLine(suffix, 'letter-spacing', name)
}

if (buckets.radius.length) {
	classesCss += section('Radius')
	for (const { suffix, name } of buckets.radius)
		classesCss += emitLine(suffix, 'border-radius', name)
}

if (buckets.spacing.length) {
	classesCss += section('Spacing — sets runtime --sf-gap / --sf-padding for layout primitives')
	for (const { suffix, name } of buckets.spacing) {
		classesCss += `\t.sf-gap-${stepOf(suffix)} { --sf-gap: var(${name}); }\n`
	}
	for (const { suffix, name } of buckets.spacing) {
		classesCss += `\t.sf-padding-${stepOf(suffix)} { --sf-padding: var(${name}); }\n`
	}
}

if (buckets.shadow.length) {
	classesCss += section(
		'Shadow — shape × theme colour at theme opacity; inline --sf-shadow-color overrides',
	)
	for (const { suffix, name } of buckets.shadow) {
		classesCss += `\t.sf-${suffix} { box-shadow: var(${name}) var(--sf-shadow-color, rgb(var(--sf-shadow) / var(--sf-shadow-opacity))); }\n`
	}
}

classesCss += '}\n'

// ─── generated-editor-classes.css (palette picks + alpha pairings) ────────

let editorCss = '/* Generated from D1 — do not edit. Run: pnpm generate:css */\n'
editorCss += '/* Editor-pairing classes — see sf-system.md "Colours and alpha". */\n\n'
editorCss += '@layer sf-utility {\n'

const paletteByFamily = new Map()
for (const tk of buckets.palette) {
	const fam = familyOf(tk.suffix)
	if (!paletteByFamily.has(fam)) paletteByFamily.set(fam, [])
	paletteByFamily.get(fam).push(tk)
}
const familyTitles = {
	primary: 'Primary palette',
	surface: 'Surface palette',
	fg_primary: 'Semantic — fg_primary',
	fg_inverted: 'Semantic — fg_inverted',
	border_color: 'Semantic — border_color',
	shadow: 'Semantic — shadow',
}
const knownOrder = ['primary', 'surface', 'fg_primary', 'fg_inverted', 'border_color', 'shadow']
const familyOrder = [
	...knownOrder.filter((f) => paletteByFamily.has(f)),
	...[...paletteByFamily.keys()].filter((f) => !knownOrder.includes(f)).sort(),
]

let editorNeedNl = false
for (const fam of familyOrder) {
	const items = paletteByFamily.get(fam)
	if (editorNeedNl) editorCss += '\n'
	editorNeedNl = true
	editorCss += `\t/* ── ${familyTitles[fam] ?? fam} ───────────────────────── */\n`
	for (const { suffix, name } of items) {
		editorCss += `\t.sf-bg-${suffix} { --sf-bg-alpha: 1; background-color: rgb(var(${name}) / var(--sf-bg-alpha)); }\n`
	}
	for (const { suffix, name } of items) {
		editorCss += `\t.sf-color-${suffix} { --sf-color-alpha: 1; color: rgb(var(${name}) / var(--sf-color-alpha)); }\n`
	}
	for (const { suffix, name } of items) {
		editorCss += `\t.sf-border-${suffix} { --sf-border-alpha: 1; border-color: rgb(var(${name}) / var(--sf-border-alpha)); }\n`
	}
}

if (buckets.alpha.length) {
	editorCss += '\n\t/* ── Alpha pairings — last so they override the reset ───── */\n'
	for (const { suffix, name } of buckets.alpha) {
		editorCss += `\t.sf-bg-alpha-${stepOf(suffix)} { --sf-bg-alpha: var(${name}); }\n`
	}
	for (const { suffix, name } of buckets.alpha) {
		editorCss += `\t.sf-color-alpha-${stepOf(suffix)} { --sf-color-alpha: var(${name}); }\n`
	}
	for (const { suffix, name } of buckets.alpha) {
		editorCss += `\t.sf-border-alpha-${stepOf(suffix)} { --sf-border-alpha: var(${name}); }\n`
	}
}

editorCss += '}\n'

// ─── Write all three files ───────────────────────────────────────────────

mkdirSync(assetsDir, { recursive: true })
writeFileSync(join(assetsDir, 'generated-tokens.css'), tokensCss, 'utf-8')
writeFileSync(join(assetsDir, 'generated-classes.css'), classesCss, 'utf-8')
writeFileSync(join(assetsDir, 'generated-editor-classes.css'), editorCss, 'utf-8')

console.log(
	`Wrote ${themes.length} themes, ${tokens.length} tokens. `
		+ `Core classes: semantic=${buckets.semantic.length}, text=${buckets.text.length}, `
		+ `leading=${buckets.leading.length}, radius=${buckets.radius.length}, `
		+ `spacing=${buckets.spacing.length}, shadow=${buckets.shadow.length}. `
		+ `Editor classes: palette=${buckets.palette.length}, alpha=${buckets.alpha.length}.`,
)
