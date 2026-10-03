// pnpm seed:local / pnpm seed:live — puts the design-system seed (src/domain/seed.ts) into a
// database. The seed runs here, in a throwaway database in memory, with all its checks; its rows
// then go out as one SQL file of a few statements. Run against D1 directly, the seed's thousands
// of single-row queries go over Cloudflare's limit for one request (1,000), so no request seeds.
//
//   node scripts/seed.mjs local   your local database (the dev server needn't be running)
//   node scripts/seed.mjs live    the live database, after saying what it replaces and asking
//
// The file replaces the whole design (themes and everything under them, the class vocabulary),
// writes the collapse thresholds it names, and adds the brand user and the menu's collections if
// missing. Wrangler applies it in one go: a statement that fails leaves the database as it was
// (checked locally; wrangler says so for live), so a failed run can be retried.
import { drizzle } from 'drizzle-orm/d1'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { createMemoryD1 } from '../../client/e2e/d1Memory.mjs'

const target = process.argv[2]
if (target !== 'local' && target !== 'live') {
	console.error('Usage: node scripts/seed.mjs local|live')
	process.exit(1)
}

const apiDir = dirname(dirname(fileURLToPath(import.meta.url)))
const DATABASE = 'somefreq-db'
// One file per target: a local seed run while live waits at its question can't swap live's file.
const OUTPUT = join(apiDir, `.wrangler/seed-${target}.sql`)
// D1 refuses a statement over 100 KB; inserts are split well below that.
const MAX_STATEMENT_BYTES = 50_000
// The collections the site's menu links to (client/src/App.vue), published and empty. One whose
// address is taken is left as it is: its name, its pages, published or not.
const MENU_COLLECTIONS = [
	{ name: 'Branding', slug: 'branding' },
	{ name: 'Software Development', slug: 'software-development' },
]

// With `quiet`, the command's output is shown only if it fails.
function run(command, args, { quiet = false, ...options } = {}) {
	const result = spawnSync(command, args, {
		cwd: apiDir,
		stdio: quiet ? 'pipe' : 'inherit',
		...options,
	})
	if (result.status !== 0) {
		// Output that was captured rather than shown says why (wrangler's --json errors go to stdout).
		for (const output of [result.stdout, result.stderr])
			if (output) process.stderr.write(output)
		if (result.error) console.error(result.error.message)
		process.exit(result.status ?? 1)
	}
	return result
}

// The seed is read from dist, so build it first: the same quick build the dev server runs.
run(join(apiDir, '../node_modules/.bin/tsc'), ['--build', '--noCheck'])
const { seed } = await import('../dist/domain/seed.js')
const { SEED_VERSION } = await import('../dist/domain/seedVersion.js')

const d1 = createMemoryD1(join(apiDir, 'migrations'))
await seed(drizzle(d1))
const rows = async (sql) => (await d1.prepare(sql).all()).results

// ─── SQL ─────────────────────────────────────────────────────────────────

const quote = (value) => {
	if (value === null) return 'NULL'
	if (typeof value === 'number' || typeof value === 'bigint') return String(value)
	return `'${String(value).replaceAll("'", "''")}'`
}

// Multi-row inserts, split by size. `columns` overrides how a column's value is written.
function inserts(table, list, { verb = 'INSERT', columns = {} } = {}) {
	if (list.length === 0) return []
	const names = Object.keys(list[0])
	const head = `${verb} INTO ${table} (${names.join(', ')}) VALUES\n`
	const statements = []
	let tuples = []
	let bytes = 0
	for (const row of list) {
		const tuple = `(${names.map((n) => (columns[n] ?? quote)(row[n])).join(', ')})`
		const size = Buffer.byteLength(tuple) + 2
		if (tuples.length > 0 && bytes + size > MAX_STATEMENT_BYTES) {
			statements.push(`${head}${tuples.join(',\n')};`)
			tuples = []
			bytes = 0
		}
		tuples.push(tuple)
		bytes += size
	}
	statements.push(`${head}${tuples.join(',\n')};`)
	return statements
}

// The brand user's id differs between databases, so it's found by email.
const users = await rows('SELECT user_id, name, email FROM users')
const userRef = (id) => {
	if (id === null) return 'NULL'
	const email = users.find((u) => u.user_id === id)?.email
	if (!email) throw new Error(`The seed refers to user ${id}, which it didn't create`)
	return `(SELECT user_id FROM users WHERE email = ${quote(email)})`
}

const copied = [
	'users',
	'themes',
	'theme_tokens',
	'class_vocabulary',
	'class_rules',
	'class_rule_classes',
	'collapse_thresholds',
]
// A table the seed writes but this file doesn't copy would be silently missing.
for (const { name } of await rows(
	"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
)) {
	const [{ n }] = await rows(`SELECT count(*) AS n FROM "${name}"`)
	if (n > 0 && !copied.includes(name))
		throw new Error(`The seed writes to ${name}, which scripts/seed.mjs doesn't copy`)
}

const statements = [
	`-- Seed ${SEED_VERSION}, generated by scripts/seed.mjs from src/domain/seed.ts. Regenerated on`,
	'-- every run; edit the seed, not this file.',
	...users.map(
		(u) =>
			`INSERT INTO users (name, email) SELECT ${quote(u.name)}, ${quote(u.email)} `
			+ `WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ${quote(u.email)});`,
	),
	'INSERT OR IGNORE INTO site_tags (name, slug, published, created_at, updated_at) VALUES\n'
		+ MENU_COLLECTIONS.map(
			(c) => `(${quote(c.name)}, ${quote(c.slug)}, 1, unixepoch(), unixepoch())`,
		).join(',\n')
		+ ';',
	// Themes cascade: theme_tokens, class_rules → class_rule_classes, user_theme_aliases.
	// The vocabulary stands alone once the rules are gone.
	'DELETE FROM themes;',
	'DELETE FROM class_vocabulary;',
	...inserts('themes', await rows('SELECT * FROM themes'), { columns: { created_by: userRef } }),
	...inserts('theme_tokens', await rows('SELECT * FROM theme_tokens')),
	...inserts('class_vocabulary', await rows('SELECT * FROM class_vocabulary')),
	...inserts('class_rules', await rows('SELECT * FROM class_rules ORDER BY id')),
	...inserts('class_rule_classes', await rows('SELECT * FROM class_rule_classes')),
	// As the seed does: writes the thresholds it names, leaves any others.
	...inserts('collapse_thresholds', await rows('SELECT * FROM collapse_thresholds'), {
		verb: 'INSERT OR REPLACE',
	}),
]
mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, `${statements.join('\n')}\n`)

// ─── Apply ───────────────────────────────────────────────────────────────

if (target === 'local') {
	run('npx', ['wrangler', 'd1', 'execute', DATABASE, '--local', '--file', OUTPUT], {
		quiet: true,
	})
	console.log(`Local database seeded with ${SEED_VERSION}.`)
} else {
	const found = run(
		'npx',
		[
			'wrangler',
			'd1',
			'execute',
			DATABASE,
			'--remote',
			'--json',
			'--command',
			'SELECT version FROM themes WHERE is_root = 1',
		],
		{ stdio: ['inherit', 'pipe', 'inherit'] },
	)
	const live = JSON.parse(found.stdout.toString())[0]?.results[0]?.version
	console.log(
		live
			? `\nLive has seed ${live}. This replaces the whole live design with seed ${SEED_VERSION}.`
			: `\nLive has no design yet. This adds seed ${SEED_VERSION}.`,
	)
	console.log(
		`It adds the menu's collections (${MENU_COLLECTIONS.map((c) => `/c/${c.slug}`).join(', ')}) `
			+ 'where live has none at that address yet.',
	)
	// Input that ends without an answer (not run from a terminal) counts as no.
	const prompt = createInterface({ input: process.stdin, output: process.stdout })
	const answer = await new Promise((resolve) => {
		prompt.question('Continue? (y/N) ').then(resolve, () => resolve(''))
		prompt.once('close', () => resolve(''))
	})
	prompt.close()
	if (answer.trim().toLowerCase() !== 'y') {
		console.log('Nothing changed.')
		process.exit(0)
	}
	run('npx', ['wrangler', 'd1', 'execute', DATABASE, '--remote', '--file', OUTPUT, '--yes'])
	console.log(`\nLive database seeded with ${SEED_VERSION}.`)
}
