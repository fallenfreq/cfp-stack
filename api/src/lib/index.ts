import { TRPCError } from '@trpc/server'
import { eq, getColumnTable } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { z } from 'zod'
import { type Db, isUniqueViolation } from '../db.js'
import { NotFoundError } from '../domain/errors.js'

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

export async function insertWithUniqueSlug<T>(
	insert: (slug: string) => Promise<T>,
	baseSlug: string,
	maxAttempts = 10,
): Promise<T> {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`
		try {
			return await insert(slug)
		} catch (error) {
			if (!isUniqueViolation(error)) throw error
		}
	}
	throw new TRPCError({
		code: 'CONFLICT',
		message: `Could not generate a unique slug after ${maxAttempts} attempts`,
	})
}
