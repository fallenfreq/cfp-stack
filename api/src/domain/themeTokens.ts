import { and, eq } from 'drizzle-orm'
import type { Db } from '../db.js'
import { type ThemeToken, themeTokens } from '../schemas/theme.js'
import { NotFoundError, ValidationError } from './errors.js'
import { getThemeOrThrow, touchTheme } from './themes.js'
import { type TokenKind, TOKEN_KINDS } from './types.js'

const TOKEN_NAME_RE = /^--sf-[a-z][a-z0-9_-]*$/

function assertValidTokenName(name: string): void {
	if (!TOKEN_NAME_RE.test(name))
		throw new ValidationError(`Token name must match ${TOKEN_NAME_RE} — got "${name}"`)
}

function assertValidTokenKind(kind: string): asserts kind is TokenKind {
	if (!TOKEN_KINDS.includes(kind as TokenKind))
		throw new ValidationError(
			`Token kind must be one of ${TOKEN_KINDS.join(', ')} — got "${kind}"`,
		)
}

// ─── Read ────────────────────────────────────────────────────────────────

export async function listTokens(db: Db, themeId: string): Promise<ThemeToken[]> {
	return db.select().from(themeTokens).where(eq(themeTokens.themeId, themeId))
}

export async function listAllTokens(db: Db): Promise<ThemeToken[]> {
	return db.select().from(themeTokens).orderBy(themeTokens.themeId, themeTokens.name)
}

export async function getToken(db: Db, themeId: string, name: string): Promise<ThemeToken | null> {
	const row = await db
		.select()
		.from(themeTokens)
		.where(and(eq(themeTokens.themeId, themeId), eq(themeTokens.name, name)))
		.get()
	return row ?? null
}

// ─── Write ───────────────────────────────────────────────────────────────
// `setToken` is upsert by (themeId, name) — the natural shape for theme
// editing (set or update a value). Removal is `unsetToken`.

export interface SetTokenInput {
	themeId: string
	name: string
	value: string
	kind: TokenKind
}

export async function setToken(db: Db, input: SetTokenInput): Promise<void> {
	assertValidTokenName(input.name)
	assertValidTokenKind(input.kind)
	if (!input.value.trim()) throw new ValidationError('Token value is required')
	await getThemeOrThrow(db, input.themeId)

	await db
		.insert(themeTokens)
		.values({
			themeId: input.themeId,
			name: input.name,
			value: input.value.trim(),
			kind: input.kind,
		})
		.onConflictDoUpdate({
			target: [themeTokens.themeId, themeTokens.name],
			set: { value: input.value.trim(), kind: input.kind },
		})

	await touchTheme(db, input.themeId)
}

export async function unsetToken(db: Db, themeId: string, name: string): Promise<void> {
	const result = await db
		.delete(themeTokens)
		.where(and(eq(themeTokens.themeId, themeId), eq(themeTokens.name, name)))
		.returning({ name: themeTokens.name })
	if (result.length === 0) throw new NotFoundError(`Token ${name} not found on theme ${themeId}`)

	await touchTheme(db, themeId)
}
