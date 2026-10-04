import { and, desc, eq, ne } from 'drizzle-orm'
import { type Theme, type UserThemeAlias, themes, userThemeAliases } from '../schemas/theme.js'
import { ConflictError, NotFoundError, ValidationError } from './errors.js'
import { type Db } from './types.js'

const ACTIVATION_CLASS_RE = /^[a-z][a-z0-9-]{0,62}$/
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

function assertValidActivationClass(value: string): void {
	if (!ACTIVATION_CLASS_RE.test(value))
		throw new ValidationError(
			`Activation class must match ${ACTIVATION_CLASS_RE} — got "${value}"`,
		)
}

function assertValidVersion(value: string): void {
	if (!SEMVER_RE.test(value))
		throw new ValidationError(
			`Version must be semver (MAJOR.MINOR.PATCH[-pre]) — got "${value}"`,
		)
}

function deriveActivationClass(themeId: string): string {
	return `theme-${themeId.replace(/-/g, '').slice(0, 8)}`
}

// ─── Read ────────────────────────────────────────────────────────────────

export async function getTheme(db: Db, id: string): Promise<Theme | null> {
	const row = await db.select().from(themes).where(eq(themes.id, id)).get()
	return row ?? null
}

export async function getThemeOrThrow(db: Db, id: string): Promise<Theme> {
	const row = await getTheme(db, id)
	if (!row) throw new NotFoundError(`Theme ${id} not found`)
	return row
}

export async function getRootTheme(db: Db): Promise<Theme | null> {
	const row = await db.select().from(themes).where(eq(themes.isRoot, true)).get()
	return row ?? null
}

export async function getRootThemeOrThrow(db: Db): Promise<Theme> {
	const row = await getRootTheme(db)
	if (!row) throw new NotFoundError('No root theme — seed has not been applied')
	return row
}

export async function listThemes(db: Db): Promise<Theme[]> {
	return db.select().from(themes).orderBy(desc(themes.isRoot), themes.name)
}

// Bump `updated_at` on a theme. Called by child-row mutators (token set,
// rule create/delete) so the parent row tracks descendant changes — drives
// CSS-cache invalidation downstream without per-table updatedAt columns.
export async function touchTheme(db: Db, themeId: string): Promise<void> {
	await db.update(themes).set({ updatedAt: new Date() }).where(eq(themes.id, themeId))
}

// ─── Write ───────────────────────────────────────────────────────────────
// One creation path. Callers may pin `id` (for import or seed reproducibility)
// or `activationClass` (for human-readable system-ish themes); both default to
// system-derived values otherwise. The root invariant — exactly one theme with
// `isRoot=true`, and its activation_class is NULL — is enforced here.

export interface CreateThemeInput {
	name: string
	createdBy: number
	id?: string
	version?: string
	isRoot?: boolean
	activationClass?: string | null
}

export async function createTheme(
	db: Db,
	input: CreateThemeInput,
): Promise<{ id: string; version: string; activationClass: string | null }> {
	if (!input.name.trim()) throw new ValidationError('Theme name is required')

	const id = input.id ?? crypto.randomUUID()
	const isRoot = input.isRoot ?? false
	const version = input.version ?? '1.0.0'
	assertValidVersion(version)

	let activationClass: string | null
	if (isRoot) {
		if (input.activationClass)
			throw new ValidationError('Root theme must not have an activation class')
		activationClass = null
	} else {
		activationClass = input.activationClass ?? deriveActivationClass(id)
		assertValidActivationClass(activationClass)
	}

	if (isRoot) {
		const existingRoot = await db
			.select({ id: themes.id })
			.from(themes)
			.where(and(eq(themes.isRoot, true), ne(themes.id, id)))
			.get()
		if (existingRoot) throw new ConflictError(`A root theme already exists: ${existingRoot.id}`)
	}

	try {
		await db.insert(themes).values({
			id,
			version,
			name: input.name.trim(),
			activationClass,
			isRoot,
			createdBy: input.createdBy,
		})
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		if (msg.includes('UNIQUE constraint failed'))
			throw new ConflictError(
				activationClass
					? `Theme "${id}" or its activation class "${activationClass}" is already in use`
					: `Theme "${id}" already exists`,
			)
		throw err
	}

	return { id, version, activationClass }
}

export async function setThemeVersion(db: Db, themeId: string, version: string): Promise<void> {
	assertValidVersion(version)
	const result = await db
		.update(themes)
		.set({ version, updatedAt: new Date() })
		.where(eq(themes.id, themeId))
		.returning({ id: themes.id })
	if (result.length === 0) throw new NotFoundError(`Theme ${themeId} not found`)
}

export async function renameTheme(db: Db, themeId: string, name: string): Promise<void> {
	if (!name.trim()) throw new ValidationError('Theme name is required')
	const result = await db
		.update(themes)
		.set({ name: name.trim(), updatedAt: new Date() })
		.where(eq(themes.id, themeId))
		.returning({ id: themes.id })
	if (result.length === 0) throw new NotFoundError(`Theme ${themeId} not found`)
}

export async function deleteTheme(db: Db, themeId: string): Promise<void> {
	const theme = await getThemeOrThrow(db, themeId)
	if (theme.isRoot) throw new ValidationError('Cannot delete the root theme')
	await db.delete(themes).where(eq(themes.id, themeId))
}

// ─── User theme aliases (registry) ───────────────────────────────────────
// Each user can label any theme locally. Per-user local names are unique
// so a user can pick a theme by their own label unambiguously.

export interface SetLocalAliasInput {
	userId: number
	themeId: string
	localName: string
}

export async function setLocalAlias(db: Db, input: SetLocalAliasInput): Promise<void> {
	if (!input.localName.trim()) throw new ValidationError('Local name is required')
	await getThemeOrThrow(db, input.themeId)
	try {
		await db
			.insert(userThemeAliases)
			.values({
				userId: input.userId,
				themeId: input.themeId,
				localName: input.localName.trim(),
			})
			.onConflictDoUpdate({
				target: [userThemeAliases.userId, userThemeAliases.themeId],
				set: { localName: input.localName.trim() },
			})
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		if (msg.includes('UNIQUE constraint failed'))
			throw new ConflictError(`Local name "${input.localName}" already in use`)
		throw err
	}
}

export async function clearLocalAlias(db: Db, userId: number, themeId: string): Promise<void> {
	await db
		.delete(userThemeAliases)
		.where(and(eq(userThemeAliases.userId, userId), eq(userThemeAliases.themeId, themeId)))
}

export async function listAliasesForUser(db: Db, userId: number): Promise<UserThemeAlias[]> {
	return db.select().from(userThemeAliases).where(eq(userThemeAliases.userId, userId))
}
