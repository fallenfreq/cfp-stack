import { isSlug, notASlug, slugCase, slugify } from '@somefreq-app/shared/slug'
import { eq, getColumnTable, inArray } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import { type Db, isUniqueViolation } from '../db.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'

// What a name column accepts (a page's, a collection's, a marker's title), on top of its type:
// trimmed, then not empty, its length counted once trimmed.
export const nameRule = (column: z.ZodString) => z.string().trim().pipe(column.min(1))

// What a slug column accepts (a page's, a collection's): what a slug may hold, in a slug's case
// (@somefreq-app/shared/slug), its length counted after that.
export const slugRule = (column: z.ZodString) =>
	z.string().overwrite(slugCase).pipe(column.min(1).refine(isSlug, notASlug))

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

type WithDefinedValues<T extends object> = {
	[K in keyof T]?: Exclude<T[K], undefined>
}

export function definedFields<T extends object>(obj: T): WithDefinedValues<T> {
	return Object.fromEntries(
		Object.entries(obj).filter(([, v]) => v !== undefined),
	) as WithDefinedValues<T>
}

// The slug with its ending, both within the column's length: the slug is cut to make room, and
// half a character or a hyphen left at the cut goes.
const withinLength = (slug: string, ending: string, length = Infinity) =>
	slug.length + ending.length <= length
		? slug + ending
		: slug
				.slice(0, length - ending.length)
				.replace(/[\uD800-\uDBFF]$/, '')
				.replace(/-+$/, '') + ending

// A slug made from a name: the name's own or, while that's taken, with -2, -3… added, each within
// the slug column's length so the row's address accepts it. One read finds which of the next 50
// are taken (D1 binds at most 100 values a query), then the first free one is inserted. The
// unique index still decides: one another request takes meanwhile moves this on to the next. It
// always ends, as each round moves 50 on and there are only so many rows.
export async function insertWithUniqueSlug<T>(
	db: Db,
	insert: (slug: string) => Promise<T>,
	name: string,
	column: SQLiteColumn,
): Promise<T> {
	const slug = slugify(name)
	if (!slug) throw new ValidationError('A name needs a letter or a number for its address')
	for (let first = 1; ; first += 50) {
		const candidates = Array.from({ length: 50 }, (_, i) =>
			withinLength(slug, first + i === 1 ? '' : `-${first + i}`, column.length),
		)
		const taken = await db
			.select({ slug: column })
			.from(getColumnTable<SQLiteTable>(column))
			.where(inArray(column, candidates))
		const takenSlugs = new Set(taken.map((row) => row.slug))
		for (const candidate of candidates.filter((c) => !takenSlugs.has(c))) {
			try {
				return await insert(candidate)
			} catch (error) {
				if (!isUniqueViolation(error, column)) throw error
			}
		}
	}
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
