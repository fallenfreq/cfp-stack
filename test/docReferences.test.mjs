// From the root: node --test 'test/*.test.mjs'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, posix } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const TEXT = /\.(md|ts|vue|mjs|cjs|js|css|html|sql|toml|example|json|ya?ml)$/

// The docs a text names, each with the sections quoted after it (docs/README.md, "Citing a
// doc"). A comment's or a paragraph's line break is a space, so a citation can wrap. A path after
// `/`, `*`, `{` or `<` is part of a URL, a glob or a placeholder (`docs/<topic>.md`), not one.
function citations(text) {
	const flat = text.replace(/[ \t]*\n[ \t]*(?:\/\/|--|#+|\*(?!\*)|>)?[ \t]*/g, ' ')
	return [
		...flat.matchAll(
			/(?<![\w/<>*{}.-])((?:[\w.-]+\/)*[\w.-]+\.md)\b`?((?:,? "[^"]{1,100}")*)/g,
		),
	].map(([, path, quoted]) => ({
		path,
		names: [...quoted.matchAll(/"([^"]+)"/g)].map(([, name]) => name),
	}))
}

// What a doc's sections are named by: its headings and the bold leads of its paragraphs and list
// items, as they read (no code marks or links), each also without a closing parenthetical.
function sectionNames(markdown) {
	const names = new Set()
	let fenced = false
	for (const line of markdown.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
		if (fenced) continue
		const match =
			line.match(/^#{1,6}\s+(.+?)[\s#]*$/)
			?? line.match(/^\s*(?:(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)?\*\*([^*]+?)[.:]?\*\*/)
		if (!match) continue
		const name = match[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*]/g, '')
		names.add(name)
		names.add(name.replace(/\s*\([^)]*\)$/, ''))
	}
	return names
}

test('every doc cited is there, and so is each section it names', () => {
	const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
		cwd: ROOT,
		encoding: 'utf8',
	})
		.split('\n')
		.filter((file) => TEXT.test(file) && file !== 'pnpm-lock.yaml' && existsSync(ROOT + file))
	const docs = files.filter((file) => file.endsWith('.md'))
	// From the root, else from the citing file's folder, else the only doc with that name.
	const find = (from, path) => {
		const found = [path, posix.join(dirname(from), path)].find((doc) => docs.includes(doc))
		if (found || path.includes('/')) return found
		const named = docs.filter((doc) => basename(doc) === path)
		return named.length === 1 ? named[0] : undefined
	}
	const sections = new Map()
	const broken = []
	for (const file of files) {
		for (const { path, names } of citations(readFileSync(ROOT + file, 'utf8'))) {
			const doc = find(file, path)
			if (!doc) {
				broken.push(`${file}: ${path}`)
				continue
			}
			if (!sections.has(doc))
				sections.set(doc, sectionNames(readFileSync(ROOT + doc, 'utf8')))
			for (const name of names)
				if (!sections.get(doc).has(name)) broken.push(`${file}: ${path}, "${name}"`)
		}
	}
	assert.deepEqual(broken, [])
})

// The examples below are citations too, so they name real sections.
test('a citation can wrap, name several sections or none', () => {
	assert.deepEqual(
		citations(`// (docs/README.md, "The docs", "Where
			// things go"), \`docs/README.md\` "Citing a doc", CLAUDE.md.`),
		[
			{ path: 'docs/README.md', names: ['The docs', 'Where things go'] },
			{ path: 'docs/README.md', names: ['Citing a doc'] },
			{ path: 'CLAUDE.md', names: [] },
		],
	)
})

test("a URL, a glob or a placeholder isn't a citation, and a quoted path names no section", () => {
	assert.deepEqual(citations('https://example.com/a.md, **/*.md, docs/<topic>.md'), [])
	assert.deepEqual(citations('<a href="docs/README.md">Docs</a> <b class="x">'), [
		{ path: 'docs/README.md', names: [] },
	])
})

test('a section is named by its heading or a bold lead', () => {
	const names = sectionNames(
		[
			'## Zitadel (the `current` provider)',
			'- **Migrations** are',
			'5. **A step.** Text',
			'- [ ] **An item**: text',
			'```',
			'# Code',
			'```',
		].join('\n'),
	)
	assert.deepEqual([...names].sort(), [
		'A step',
		'An item',
		'Migrations',
		'Zitadel',
		'Zitadel (the current provider)',
	])
})
