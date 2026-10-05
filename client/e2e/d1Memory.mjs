// Minimal Cloudflare D1 binding over node:sqlite, so drizzle's d1 driver can run the real
// seed + CSS generator in memory — no wrangler, no local D1 files. Used by the layout checks
// (globalSetup.ts), the component preview and the seed script (api/scripts/seed.mjs).
import { readdirSync, readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

const toParam = (v) => {
	if (v === undefined) return null
	if (typeof v === 'boolean') return v ? 1 : 0
	if (v instanceof Date) return v.getTime()
	return v
}

function statement(db, sql, params = []) {
	const stmt = db.prepare(sql)
	return {
		bind: (...p) => statement(db, sql, p.map(toParam)),
		async all() {
			stmt.setReturnArrays(false)
			return { results: stmt.all(...params), success: true, meta: {} }
		},
		async raw() {
			stmt.setReturnArrays(true)
			return stmt.all(...params)
		},
		async first(col) {
			stmt.setReturnArrays(false)
			const row = stmt.get(...params)
			return col ? row?.[col] : (row ?? null)
		},
		async run() {
			const r = stmt.run(...params)
			return {
				results: [],
				success: true,
				meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) },
			}
		},
	}
}

export function createMemoryD1(migrationsDir) {
	const db = new DatabaseSync(':memory:')
	// One folder per migration, applied in name order (as wrangler does: api/wrangler.toml).
	const folders = readdirSync(migrationsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
	for (const name of folders.sort())
		db.exec(readFileSync(join(migrationsDir, name, 'migration.sql'), 'utf8'))
	return {
		prepare: (sql) => statement(db, sql),
		batch: (stmts) => Promise.all(stmts.map((s) => s.all())),
		exec: async (sql) => {
			db.exec(sql)
			return { count: 0, duration: 0 }
		},
	}
}

/** A drizzle database in memory with the api's migrations applied. */
export async function memoryDatabase(apiDir) {
	// drizzle-orm is an api dependency; import its ESM d1 entry from there.
	const pkgDir = realpathSync(join(apiDir, 'node_modules/drizzle-orm'))
	const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
	const entry = pkg.exports['./d1'].import
	const file = typeof entry === 'string' ? entry : entry.default
	const { drizzle } = await import(pathToFileURL(join(pkgDir, file)).href)
	return drizzle(createMemoryD1(join(apiDir, 'migrations')))
}
