import { integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { users } from './user.js'

// ─── Themes ──────────────────────────────────────────────────────────────
// UUID-keyed for global uniqueness — themes can be exported, shared, and
// imported between instances without slug collisions. `name` is the
// author's canonical display name. Per-user labels live in
// `user_theme_aliases`. `activation_class` is system-assigned (stable
// across renames; saved content references it through the cascade).

export const themes = sqliteTable('themes', {
	id: text('id', { length: 36 }).primaryKey(),
	version: text('version', { length: 32 }).notNull().default('1.0.0'),
	name: text('name', { length: 256 }).notNull(),
	activationClass: text('activation_class', { length: 64 }).unique(),
	isRoot: integer('is_root', { mode: 'boolean' }).notNull().default(false),
	createdBy: integer('created_by').references(() => users.userId, { onDelete: 'set null' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})

export const themeTokens = sqliteTable(
	'theme_tokens',
	{
		themeId: text('theme_id', { length: 36 })
			.notNull()
			.references(() => themes.id, { onDelete: 'cascade' }),
		name: text('name', { length: 128 }).notNull(),
		value: text('value', { length: 512 }).notNull(),
		kind: text('kind', { length: 32 }).notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.themeId, table.name] }),
	}),
)

// ─── Class vocabulary ────────────────────────────────────────────────────
// What sf-/sl- classes are admitted. `kind` drives layer assignment and
// canonical class ordering inside compound selectors. `pseudo` is
// intrinsic to state classes (e.g., sf-on-hover carries `:hover`).

export const classVocabulary = sqliteTable('class_vocabulary', {
	name: text('name', { length: 128 }).primaryKey(),
	kind: text('kind', { length: 32 }).notNull(),
	pseudo: text('pseudo', { length: 32 }),
	description: text('description', { length: 512 }),
})

// ─── Class rules + junction ──────────────────────────────────────────────
// Per-theme CSS rules. A rule's selector is built from its set of classes
// (junction-joined, canonically ordered at emit time) plus any pseudo
// suffixes from the state classes involved. The junction's FK on
// `class_name` guarantees only known vocabulary appears in selectors.

export const classRules = sqliteTable('class_rules', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	themeId: text('theme_id', { length: 36 })
		.notNull()
		.references(() => themes.id, { onDelete: 'cascade' }),
	cssProperty: text('css_property', { length: 64 }).notNull(),
	value: text('value', { length: 512 }).notNull(),
	// Pseudo-class or pseudo-element appended to the final selector (e.g. ':hover', '::before').
	// Distinct from classVocabulary.pseudo which carries state pseudo-classes intrinsic to a
	// class's meaning. Rule-level pseudo controls WHEN/WHERE the CSS applies.
	pseudo: text('pseudo', { length: 64 }),
	// HTML element type that AND-chains with the vocabulary classes, placed first in the
	// compound selector: element='button' + classes=[sf-variant-danger] → button.sf-variant-danger
	// Analogous to .sf-depth-1.sf-variant-featured but with an element type as the leading part.
	// All rules go in sf-bundle; bare element selectors (0-0-1) naturally lose to class
	// selectors (0-1-0) in the same layer. Validated against HTML_ELEMENTS allowlist in code.
	elementSelector: text('element_selector', { length: 64 }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})

export const classRuleClasses = sqliteTable(
	'class_rule_classes',
	{
		ruleId: integer('rule_id')
			.notNull()
			.references(() => classRules.id, { onDelete: 'cascade' }),
		className: text('class_name', { length: 128 })
			.notNull()
			.references(() => classVocabulary.name),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.ruleId, table.className] }),
	}),
)

// ─── User theme aliases (registry) ───────────────────────────────────────
// Per-user local labels for themes. The canonical theme name travels with
// the theme on export/import; each user can re-label any theme locally
// without affecting global identity.

export const userThemeAliases = sqliteTable(
	'user_theme_aliases',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.userId, { onDelete: 'cascade' }),
		themeId: text('theme_id', { length: 36 })
			.notNull()
			.references(() => themes.id, { onDelete: 'cascade' }),
		localName: text('local_name', { length: 256 }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.themeId] }),
		uniqueLocalName: unique().on(table.userId, table.localName),
	}),
)

// ─── Inferred types ──────────────────────────────────────────────────────

export type Theme = typeof themes.$inferSelect
export type NewTheme = typeof themes.$inferInsert
export type ThemeToken = typeof themeTokens.$inferSelect
export type NewThemeToken = typeof themeTokens.$inferInsert
export type ClassVocabulary = typeof classVocabulary.$inferSelect
export type NewClassVocabulary = typeof classVocabulary.$inferInsert
export type ClassRule = typeof classRules.$inferSelect
export type NewClassRule = typeof classRules.$inferInsert
export type ClassRuleClass = typeof classRuleClasses.$inferSelect
export type NewClassRuleClass = typeof classRuleClasses.$inferInsert
export type UserThemeAlias = typeof userThemeAliases.$inferSelect
export type NewUserThemeAlias = typeof userThemeAliases.$inferInsert
