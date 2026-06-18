#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiDir = join(__dirname, '..')
const outputPath = join(apiDir, '..', 'client', 'src', 'assets', 'generated-tokens.css')

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
const tokens = query('SELECT theme_slug, name, value FROM theme_tokens ORDER BY theme_slug, name')

const tokensByTheme = new Map()
for (const token of tokens) {
	if (!tokensByTheme.has(token.theme_slug)) tokensByTheme.set(token.theme_slug, [])
	tokensByTheme.get(token.theme_slug).push(token)
}

let css = '/* Generated from D1 — do not edit. Run: pnpm generate:css */\n\n'

for (const theme of themes) {
	const themeTokens = tokensByTheme.get(theme.slug) ?? []
	if (themeTokens.length === 0) continue

	const selector = theme.is_root ? ':root' : `.${theme.activation_class}`
	css += `${selector} {\n`
	for (const token of themeTokens) {
		css += `\t${token.name}: ${token.value};\n`
	}
	css += '}\n\n'
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, css, 'utf-8')

console.log(`Wrote ${outputPath} (${themes.length} themes, ${tokens.length} tokens)`)
