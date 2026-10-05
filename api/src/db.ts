import { DrizzleQueryError, is } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

// The database as `drizzle(env.DB)` gives it, with no tables registered: each query names its
// table (docs/database.md, "How we use it").
export type Db = DrizzleD1Database

// What the database said about a failed query. Drizzle wraps it in an error whose message is the
// query with its values, which logs mustn't carry (a session's email, its sealed tokens).
export const databaseError = (error: unknown): unknown =>
	is(error, DrizzleQueryError) ? error.cause : error

// The write would repeat a value that must be unique, such as a slug.
export const isUniqueViolation = (error: unknown): boolean => {
	const cause = databaseError(error)
	return cause instanceof Error && cause.message.includes('UNIQUE constraint failed')
}
