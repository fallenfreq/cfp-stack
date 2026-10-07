import { DrizzleQueryError, getColumnTable, getTableName, is, max } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core'

// The database as `drizzle(env.DB)` gives it, with no tables registered: each query names its
// table (docs/database.md, "How we use it"). In a module of its own, so sign-in can use it
// without depending on the domain.
export type Db = DrizzleD1Database

// Writes that must happen together, as one batch: D1 runs it as one transaction, so if a write
// fails, none of them stays. For a list built from what was sent, which may be empty; Drizzle's
// batch needs at least one.
export async function writeTogether(db: Db, writes: BatchItem<'sqlite'>[]): Promise<void> {
	const [first, ...rest] = writes
	if (first) await db.batch([first, ...rest])
}

// For a write in a batch that needs the id an earlier insert in it made: the newest row's. The
// batch is one transaction, and a new row's integer key is larger than any before it. Only when
// that insert always adds a row and leaves its key to the database (no onConflictDoNothing).
export const newestId = (db: Db, key: SQLiteColumn) =>
	db.select({ id: max(key) }).from(getColumnTable<SQLiteTable>(key))

// What the database said about a failed query. Drizzle wraps it in an error whose message is the
// query with its values, which logs mustn't carry (a session's email, its sealed tokens).
export const databaseError = (error: unknown): unknown =>
	is(error, DrizzleQueryError) ? error.cause : error

// The write would repeat a value that must be unique; given a column, a value of that column. The
// database names the columns: "UNIQUE constraint failed: site_pages.slug".
export const isUniqueViolation = (error: unknown, column?: SQLiteColumn): boolean => {
	const cause = databaseError(error)
	if (!(cause instanceof Error)) return false
	const failed = /UNIQUE constraint failed: ([\w.]+(?:, [\w.]+)*)/.exec(cause.message)
	if (!failed?.[1]) return false
	if (!column) return true
	const name = `${getTableName(getColumnTable<SQLiteTable>(column))}.${column.name}`
	return failed[1].split(', ').includes(name)
}
