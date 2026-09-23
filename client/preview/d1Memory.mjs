// Minimal Cloudflare D1 binding over node:sqlite, so drizzle's d1 driver can run the real
// seed + CSS generator in memory — no wrangler, no local D1 files.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

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
	for (const file of readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort()) {
		db.exec(readFileSync(join(migrationsDir, file), 'utf8'))
	}
	return {
		prepare: (sql) => statement(db, sql),
		batch: (stmts) => Promise.all(stmts.map((s) => s.all())),
		exec: async (sql) => {
			db.exec(sql)
			return { count: 0, duration: 0 }
		},
	}
}
