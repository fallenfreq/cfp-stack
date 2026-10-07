import { eq, getColumnTable } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import { type Db, isUniqueViolation } from '../db.js'
import { ConflictError, NotFoundError } from '../domain/errors.js'

// What a name column accepts (a page's, a collection's, a marker's title), on top of its type:
// trimmed, then not empty, its length counted once trimmed.
export const nameRule = (column: z.ZodString) => z.string().trim().pipe(column.min(1))

// What a slug column accepts (a page's, a collection's), on top of its length: the address part,
// lowercased.
export const slugRule = (column: z.ZodString) =>
	column
		.min(1)
		.toLowerCase()
		.regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')

// The row a write is for is there, or the answer is 404: the check that reads before the write
// (docs/database.md, "How we use it").
export async function mustExist(db: Db, key: SQLiteColumn, id: number, notFound: string) {
	const row = await db
		.select({ key })
		.from(getColumnTable<SQLiteTable>(key))
		.where(eq(key, id))
		.get()
	if (!row) throw new NotFoundError(notFound)
}

export function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '') || 'untitled'
	)
}

type WithDefinedValues<T extends object> = {
	[K in keyof T]?: Exclude<T[K], undefined>
}

export function definedFields<T extends object>(obj: T): WithDefinedValues<T> {
	return Object.fromEntries(
		Object.entries(obj).filter(([, v]) => v !== undefined),
	) as WithDefinedValues<T>
}

// The slug with its ending, both within the column's length: the slug is cut to make room, and a
// hyphen left at the cut goes.
const withinLength = (slug: string, ending: string, length = Infinity) =>
	slug.length + ending.length <= length
		? slug + ending
		: slug.slice(0, length - ending.length).replace(/-+$/, '') + ending

// A slug the app makes: the one given or, while that's taken, with -2, -3… added, up to
// maxAttempts and then 409. Each fits the slug column, so the row's address accepts it.
export async function insertWithUniqueSlug<T>(
	insert: (slug: string) => Promise<T>,
	baseSlug: string,
	column: SQLiteColumn,
	maxAttempts = 10,
): Promise<T> {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const slug = withinLength(baseSlug, attempt === 1 ? '' : `-${attempt}`, column.length)
		try {
			return await insert(slug)
		} catch (error) {
			if (!isUniqueViolation(error, column)) throw error
		}
	}
	throw new ConflictError(`Could not generate a unique slug after ${maxAttempts} attempts`)
}

// A write that saves a slug the admin chose: if another row has it, the answer is 409.
export async function conflictIfSlugTaken<T>(write: Promise<T>, column: SQLiteColumn): Promise<T> {
	try {
		return await write
	} catch (error) {
		if (isUniqueViolation(error, column)) throw new ConflictError('That slug is already in use')
		throw error
	}
}
