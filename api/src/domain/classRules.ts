import { and, eq, inArray } from 'drizzle-orm'
import {
	type ClassRule,
	type ClassVocabulary,
	classRuleClasses,
	classRules,
	classVocabulary,
} from '../schemas/theme.js'
import { ConflictError, NotFoundError, ValidationError } from './errors.js'
import { getThemeOrThrow, touchTheme } from './themes.js'
import { CLASS_KINDS, type ClassKind, type Db } from './types.js'

// ─── Vocabulary admin ────────────────────────────────────────────────────

const CLASS_NAME_RE = /^(sf|sl)-[a-z][a-z0-9_-]*$/
const PSEUDO_RE = /^:[a-z][a-z-]*$/

function assertValidClassName(name: string): void {
	if (!CLASS_NAME_RE.test(name))
		throw new ValidationError(`Class name must match ${CLASS_NAME_RE} — got "${name}"`)
}

function assertValidClassKind(kind: string): asserts kind is ClassKind {
	if (!CLASS_KINDS.includes(kind as ClassKind))
		throw new ValidationError(
			`Class kind must be one of ${CLASS_KINDS.join(', ')} — got "${kind}"`,
		)
}

function assertValidPseudo(value: string | null | undefined): void {
	if (value == null) return
	if (!PSEUDO_RE.test(value))
		throw new ValidationError(
			`Pseudo must start with ':' and use lowercase letters — got "${value}"`,
		)
}

export interface AddVocabularyEntryInput {
	name: string
	kind: ClassKind
	pseudo?: string | null
	description?: string | null
}

export async function addVocabularyEntry(db: Db, input: AddVocabularyEntryInput): Promise<void> {
	assertValidClassName(input.name)
	assertValidClassKind(input.kind)
	assertValidPseudo(input.pseudo ?? null)
	if (input.kind !== 'state' && input.pseudo)
		throw new ValidationError(
			`Only state classes carry a pseudo — got "${input.pseudo}" on a ${input.kind}`,
		)

	await db
		.insert(classVocabulary)
		.values({
			name: input.name,
			kind: input.kind,
			pseudo: input.pseudo ?? null,
			description: input.description ?? null,
		})
		.onConflictDoUpdate({
			target: classVocabulary.name,
			set: {
				kind: input.kind,
				pseudo: input.pseudo ?? null,
				description: input.description ?? null,
			},
		})
}

export async function removeVocabularyEntry(db: Db, name: string): Promise<void> {
	const result = await db
		.delete(classVocabulary)
		.where(eq(classVocabulary.name, name))
		.returning({ name: classVocabulary.name })
	if (result.length === 0) throw new NotFoundError(`Vocabulary entry "${name}" not found`)
}

export async function listVocabulary(db: Db): Promise<ClassVocabulary[]> {
	return db.select().from(classVocabulary).orderBy(classVocabulary.kind, classVocabulary.name)
}

// ─── Class rules ─────────────────────────────────────────────────────────
// A rule binds a set of classes (1+) to a single CSS property on a theme.
// The generator joins the junction at emit time to build canonical selectors;
// pseudos come from the involved state classes' vocabulary entries.

export type ClassRuleWithClasses = ClassRule & {
	classes: { name: string; kind: ClassKind; pseudo: string | null }[]
}

export interface CreateClassRuleInput {
	themeId: string
	classNames: string[]
	cssProperty: string
	value: string
}

const CSS_PROPERTY_RE = /^[a-z][a-z0-9-]*$/

function assertValidCssProperty(property: string): void {
	if (!CSS_PROPERTY_RE.test(property))
		throw new ValidationError(`CSS property must match ${CSS_PROPERTY_RE} — got "${property}"`)
}

function assertAtLeastOneClass(classNames: string[]): void {
	if (classNames.length === 0)
		throw new ValidationError('A rule must reference at least one class')
}

function assertUniqueClassNames(classNames: string[]): void {
	const seen = new Set<string>()
	for (const name of classNames) {
		if (seen.has(name))
			throw new ValidationError(`Class "${name}" appears more than once in the rule`)
		seen.add(name)
	}
}

async function fetchVocabForClasses(db: Db, classNames: string[]): Promise<ClassVocabulary[]> {
	if (classNames.length === 0) return []
	return db.select().from(classVocabulary).where(inArray(classVocabulary.name, classNames))
}

function assertAllClassesExist(vocab: ClassVocabulary[], classNames: string[]): void {
	const known = new Set(vocab.map((v) => v.name))
	const missing = classNames.filter((n) => !known.has(n))
	if (missing.length > 0)
		throw new ValidationError(
			`Unknown class name(s): ${missing.join(', ')} — add to vocabulary first`,
		)
}

function assertAtMostOneClassPerKind(vocab: ClassVocabulary[]): void {
	const seen = new Map<string, string>()
	for (const v of vocab) {
		const prev = seen.get(v.kind)
		if (prev)
			throw new ValidationError(
				`A rule may include at most one ${v.kind} class — got both "${prev}" and "${v.name}"`,
			)
		seen.set(v.kind, v.name)
	}
}

async function assertNoDuplicateRule(
	db: Db,
	themeId: string,
	classNames: string[],
	cssProperty: string,
): Promise<void> {
	const rows = await db
		.select({ ruleId: classRules.id, className: classRuleClasses.className })
		.from(classRules)
		.innerJoin(classRuleClasses, eq(classRuleClasses.ruleId, classRules.id))
		.where(and(eq(classRules.themeId, themeId), eq(classRules.cssProperty, cssProperty)))

	if (rows.length === 0) return

	const byRule = new Map<number, string[]>()
	for (const { ruleId, className } of rows) {
		const list = byRule.get(ruleId)
		if (list) list.push(className)
		else byRule.set(ruleId, [className])
	}

	const target = [...classNames].sort().join('|')
	for (const classes of byRule.values()) {
		if (classes.sort().join('|') === target)
			throw new ConflictError(
				`A rule already exists for theme ${themeId} with classes [${classNames.join(', ')}] and property ${cssProperty}`,
			)
	}
}

export async function createClassRule(
	db: Db,
	input: CreateClassRuleInput,
): Promise<{ id: number }> {
	assertAtLeastOneClass(input.classNames)
	assertUniqueClassNames(input.classNames)
	assertValidCssProperty(input.cssProperty)
	if (!input.value.trim()) throw new ValidationError('Rule value is required')

	await getThemeOrThrow(db, input.themeId)

	const vocab = await fetchVocabForClasses(db, input.classNames)
	assertAllClassesExist(vocab, input.classNames)
	assertAtMostOneClassPerKind(vocab)

	await assertNoDuplicateRule(db, input.themeId, input.classNames, input.cssProperty)

	const rule = await db
		.insert(classRules)
		.values({
			themeId: input.themeId,
			cssProperty: input.cssProperty,
			value: input.value.trim(),
		})
		.returning({ id: classRules.id })
		.get()

	await db
		.insert(classRuleClasses)
		.values(input.classNames.map((className) => ({ ruleId: rule.id, className })))

	await touchTheme(db, input.themeId)

	return { id: rule.id }
}

export async function deleteClassRule(db: Db, ruleId: number): Promise<void> {
	const result = await db
		.delete(classRules)
		.where(eq(classRules.id, ruleId))
		.returning({ id: classRules.id, themeId: classRules.themeId })
	const deleted = result[0]
	if (!deleted) throw new NotFoundError(`Rule ${ruleId} not found`)

	await touchTheme(db, deleted.themeId)
}

// Shared shape for the rules + junction + vocabulary join. Each public
// reader appends its own WHERE (or none) before awaiting.
function ruleJoinQuery(db: Db) {
	return db
		.select({
			ruleId: classRules.id,
			themeId: classRules.themeId,
			cssProperty: classRules.cssProperty,
			value: classRules.value,
			createdAt: classRules.createdAt,
			className: classVocabulary.name,
			classKind: classVocabulary.kind,
			classPseudo: classVocabulary.pseudo,
		})
		.from(classRules)
		.innerJoin(classRuleClasses, eq(classRuleClasses.ruleId, classRules.id))
		.innerJoin(classVocabulary, eq(classVocabulary.name, classRuleClasses.className))
}

interface RuleJoinRow {
	ruleId: number
	themeId: string
	cssProperty: string
	value: string
	createdAt: Date
	className: string
	classKind: string
	classPseudo: string | null
}

function groupRulesFromRows(rows: RuleJoinRow[]): ClassRuleWithClasses[] {
	const byId = new Map<number, ClassRuleWithClasses>()
	for (const r of rows) {
		let rule = byId.get(r.ruleId)
		if (!rule) {
			rule = {
				id: r.ruleId,
				themeId: r.themeId,
				cssProperty: r.cssProperty,
				value: r.value,
				createdAt: r.createdAt,
				classes: [],
			}
			byId.set(r.ruleId, rule)
		}
		rule.classes.push({
			name: r.className,
			kind: r.classKind as ClassKind,
			pseudo: r.classPseudo,
		})
	}
	return [...byId.values()]
}

export async function listAllRules(db: Db): Promise<ClassRuleWithClasses[]> {
	return groupRulesFromRows(await ruleJoinQuery(db).orderBy(classRules.id))
}

export async function listRulesForTheme(db: Db, themeId: string): Promise<ClassRuleWithClasses[]> {
	return groupRulesFromRows(
		await ruleJoinQuery(db).where(eq(classRules.themeId, themeId)).orderBy(classRules.id),
	)
}

export async function listRulesForClass(
	db: Db,
	className: string,
): Promise<ClassRuleWithClasses[]> {
	const ruleIds = await db
		.select({ ruleId: classRuleClasses.ruleId })
		.from(classRuleClasses)
		.where(eq(classRuleClasses.className, className))

	if (ruleIds.length === 0) return []

	const ids = ruleIds.map((r) => r.ruleId)
	return groupRulesFromRows(
		await ruleJoinQuery(db).where(inArray(classRules.id, ids)).orderBy(classRules.id),
	)
}
