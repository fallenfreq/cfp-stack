import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const slugSchema = z
	.string()
	.min(1)
	.max(256)
	.transform((s) => s.toLowerCase())
	.pipe(
		z
			.string()
			.regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
	)

export const nameSchema = z.string().min(1).max(256)

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
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err)
			if (!msg.includes('UNIQUE constraint failed')) throw err
		}
	}
	throw new TRPCError({
		code: 'CONFLICT',
		message: `Could not generate a unique slug after ${maxAttempts} attempts`,
	})
}
