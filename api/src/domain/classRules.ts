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

const CLASS_NAME_RE = /^(sf|sl)(-[a-z][a-z0-9_-]*)?$/
// Vocabulary pseudo (state classes): strict — only :pseudo-class or ::pseudo-element
const VOCAB_PSEUDO_RE = /^::?[a-z][a-z-]*$/
// Rule-level pseudo: also allows combinator suffixes (' > * + *', ':last-child td', etc.)
// Blocks { } ; to prevent CSS injection.
const RULE_PSEUDO_RE = /^[: >+~][^{};]*$/

// Interactive + structural elements only. Heading/text-scale elements (h1-h6, p) are
// intentionally excluded — those are handled by sf-heading-* bundles and token utilities.
const HTML_ELEMENTS = new Set([
	// Interactive
	'a',
	'button',
	// Form
	'fieldset',
	'form',
	'input',
	'label',
	'legend',
	'output',
	'progress',
	'select',
	'textarea',
	// Layout landmarks
	'aside',
	'footer',
	'header',
	'main',
	'nav',
	'section',
	'article',
	// Disclosure / modal
	'details',
	'dialog',
	'summary',
	// Tables
	'caption',
	'table',
	'tbody',
	'td',
	'tfoot',
	'th',
	'thead',
	'tr',
	// Lists
	'dd',
	'dl',
	'dt',
	'li',
	'ol',
	'ul',
	// Media
	'audio',
	'canvas',
	'figure',
	'figcaption',
	'img',
	'picture',
	'video',
	// Content blocks (theme-styleable)
	'blockquote',
	'code',
	'kbd',
	'pre',
])

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
	if (!VOCAB_PSEUDO_RE.test(value))
		throw new ValidationError(
			`Pseudo must start with ':' and use lowercase letters — got "${value}"`,
		)
}

function assertValidRulePseudo(value: string | null | undefined): void {
	if (value == null) return
	if (!RULE_PSEUDO_RE.test(value))
		throw new ValidationError(
			`Rule pseudo must start with ':', '::', or a combinator character — got "${value}"`,
		)
}

function assertValidElementSelector(element: string): void {
	const notMatch = element.match(/^:not\(([a-z]+)\)$/)
	if (notMatch) {
		if (!HTML_ELEMENTS.has(notMatch[1]))
			throw new ValidationError(
				`Element inside :not() must be a known HTML element — got "${notMatch[1]}"`,
			)
		return
	}
	if (!HTML_ELEMENTS.has(element))
		throw new ValidationError(
			`Element selector must be a known HTML element or :not(<element>) — got "${element}"`,
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
// A rule binds a CSS property to a selector on a theme. The selector is built
// from an optional element type AND-chained with zero or more vocabulary classes.
// At least one of elementSelector or classNames must be provided.
// The generator left-joins the junction at emit time; pseudos come from the
// involved state classes' vocabulary entries.

export type ClassRuleWithClasses = ClassRule & {
	classes: { name: string; kind: ClassKind; pseudo: string | null }[]
}

export interface ClassOnlyRuleInput {
	elementSelector?: null
	classNames: [string, ...string[]]
	cssProperty: string
	value: string
	pseudo?: string | null
}

export interface ElementRuleInput {
	elementSelector: string
	classNames?: string[]
	cssProperty: string
	value: string
	pseudo?: string | null
}

export type CreateClassRuleInput =
	| (ClassOnlyRuleInput & { themeId: string })
	| (ElementRuleInput & { themeId: string })

const CSS_PROPERTY_RE = /^--[a-z][a-z0-9-]*$|^[a-z][a-z0-9-]*$/

function assertValidCssProperty(property: string): void {
	if (!CSS_PROPERTY_RE.test(property))
		throw new ValidationError(
			`CSS property must be a standard property or custom property (--*) — got "${property}"`,
		)
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
		// State, context, and bundle classes may be compounded freely.
		// Bundles from different families (sf-depth-* × sf-loudness-*) compose
		// intentionally via compound selectors — the cascade composition pattern
		// depends on this. Same for state/context (sf-is-overflow-left + -right).
		if (v.kind === 'state' || v.kind === 'context' || v.kind === 'bundle') continue
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
	pseudo: string | null,
	elementSelector: string | null,
): Promise<void> {
	const rows = await db
		.select({
			ruleId: classRules.id,
			className: classRuleClasses.className,
			rulePseudo: classRules.pseudo,
			ruleElement: classRules.elementSelector,
		})
		.from(classRules)
		.leftJoin(classRuleClasses, eq(classRuleClasses.ruleId, classRules.id))
		.where(and(eq(classRules.themeId, themeId), eq(classRules.cssProperty, cssProperty)))

	if (rows.length === 0) return

	const byRule = new Map<
		number,
		{ classes: string[]; pseudo: string | null; element: string | null }
	>()
	for (const { ruleId, className, rulePseudo, ruleElement } of rows) {
		const entry = byRule.get(ruleId)
		if (entry) {
			if (className) entry.classes.push(className)
		} else {
			byRule.set(ruleId, {
				classes: className ? [className] : [],
				pseudo: rulePseudo,
				element: ruleElement,
			})
		}
	}

	const target = [...classNames].sort().join('|')
	for (const { classes, pseudo: existingPseudo, element } of byRule.values()) {
		if (
			classes.sort().join('|') === target
			&& existingPseudo === pseudo
			&& element === elementSelector
		)
			throw new ConflictError(
				`A rule already exists for theme ${themeId} with element ${elementSelector ?? 'none'}, classes [${classNames.join(', ')}], property ${cssProperty}, and pseudo ${pseudo ?? 'none'}`,
			)
	}
}

export async function createClassRule(
	db: Db,
	input: CreateClassRuleInput,
): Promise<{ id: number }> {
	const elementSelector = input.elementSelector ?? null
	const classNames = input.classNames ?? []

	if (elementSelector) assertValidElementSelector(elementSelector)
	if (classNames.length > 0) assertUniqueClassNames(classNames)
	assertValidCssProperty(input.cssProperty)
	if (!input.value.trim()) throw new ValidationError('Rule value is required')

	const pseudo = input.pseudo ?? null
	if (pseudo) assertValidRulePseudo(pseudo)

	await getThemeOrThrow(db, input.themeId)

	if (classNames.length > 0) {
		const vocab = await fetchVocabForClasses(db, classNames)
		assertAllClassesExist(vocab, classNames)
		assertAtMostOneClassPerKind(vocab)
	}

	await assertNoDuplicateRule(
		db,
		input.themeId,
		classNames,
		input.cssProperty,
		pseudo,
		elementSelector,
	)

	const rule = await db
		.insert(classRules)
		.values({
			themeId: input.themeId,
			cssProperty: input.cssProperty,
			value: input.value.trim(),
			pseudo,
			elementSelector,
		})
		.returning({ id: classRules.id })
		.get()

	if (classNames.length > 0) {
		await db
			.insert(classRuleClasses)
			.values(classNames.map((className) => ({ ruleId: rule.id, className })))
	}

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
// leftJoin is required: bare element rules have no junction rows and would
// disappear under an innerJoin.
function ruleJoinQuery(db: Db) {
	return db
		.select({
			ruleId: classRules.id,
			themeId: classRules.themeId,
			cssProperty: classRules.cssProperty,
			value: classRules.value,
			rulePseudo: classRules.pseudo,
			ruleElement: classRules.elementSelector,
			createdAt: classRules.createdAt,
			className: classVocabulary.name,
			classKind: classVocabulary.kind,
			classPseudo: classVocabulary.pseudo,
		})
		.from(classRules)
		.leftJoin(classRuleClasses, eq(classRuleClasses.ruleId, classRules.id))
		.leftJoin(classVocabulary, eq(classVocabulary.name, classRuleClasses.className))
}

interface RuleJoinRow {
	ruleId: number
	themeId: string
	cssProperty: string
	value: string
	rulePseudo: string | null
	ruleElement: string | null
	createdAt: Date
	className: string | null
	classKind: string | null
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
				pseudo: r.rulePseudo,
				elementSelector: r.ruleElement,
				createdAt: r.createdAt,
				classes: [],
			}
			byId.set(r.ruleId, rule)
		}
		if (r.className && r.classKind) {
			rule.classes.push({
				name: r.className,
				kind: r.classKind as ClassKind,
				pseudo: r.classPseudo,
			})
		}
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
