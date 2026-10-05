import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ─── Themes ──────────────────────────────────────────────────────────────
// UUID-keyed for global uniqueness — themes can be exported, shared, and
// imported between instances without slug collisions. `name` is the
// author's canonical display name. `activation_class` is system-assigned
// (stable across renames; saved content references it through the cascade).

export const themes = sqliteTable(
	'themes',
	{
		id: text('id', { length: 36 }).primaryKey(),
		version: text('version', { length: 32 }).notNull().default('1.0.0'),
		name: text('name', { length: 256 }).notNull(),
		activationClass: text('activation_class', { length: 64 }),
		isRoot: integer('is_root', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [uniqueIndex('themes_activation_class_unique').on(table.activationClass)],
)

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
	(table) => [primaryKey({ columns: [table.themeId, table.name] })],
)

// ─── Class vocabulary ────────────────────────────────────────────────────
// What sf-/sl- classes are admitted. `kind` drives layer assignment and
// canonical class ordering inside compound selectors. `pseudo` is
// intrinsic to state classes (e.g., sf-on-hover carries `:hover`).
// `cascade_order` breaks ties between classes of equal specificity in the same
// layer: higher is emitted later and wins (a modifier beats what it modifies).
// It never crosses layers and never beats a more specific selector. Global and
// maintainer-owned — themes can't reorder what classes mean.

export const classVocabulary = sqliteTable('class_vocabulary', {
	name: text('name', { length: 128 }).primaryKey(),
	kind: text('kind', { length: 32 }).notNull(),
	pseudo: text('pseudo', { length: 32 }),
	description: text('description', { length: 512 }),
	cascadeOrder: integer('cascade_order').notNull().default(0),
	// Nullable so the column can be added to existing rows; the CSS signature reads max().
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ─── Class rules + junction ──────────────────────────────────────────────
// Per-theme CSS rules. A rule's selector is built from its set of classes
// (junction-joined, canonically ordered at emit time) plus any pseudo
// suffixes from the state classes involved. The junction's FK on
// `class_name` guarantees only known vocabulary appears in selectors.

export const classRules = sqliteTable(
	'class_rules',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		themeId: text('theme_id', { length: 36 })
			.notNull()
			.references(() => themes.id, { onDelete: 'cascade' }),
		cssProperty: text('css_property', { length: 64 }).notNull(),
		value: text('value', { length: 512 }).notNull(),
		// Pseudo-class or pseudo-element appended to the final selector (e.g. ':hover',
		// '::before'). Distinct from classVocabulary.pseudo which carries state pseudo-classes
		// intrinsic to a class's meaning. Rule-level pseudo controls WHEN/WHERE the CSS applies.
		pseudo: text('pseudo', { length: 64 }),
		// HTML element type that AND-chains with the vocabulary classes, placed first in the
		// compound selector: element='button' + classes=[sf-variant-danger] →
		// button.sf-variant-danger. Analogous to .sf-depth-1.sf-variant-featured but with an
		// element type as the leading part. Bare element rules (no classes) emit to sf-element —
		// a baseline layer below sf-bundle, so any bundle/variant/state layered on top wins
		// predictably. Compound rules take the layer of their highest-kind class. Validated
		// against HTML_ELEMENTS allowlist in code.
		elementSelector: text('element_selector', { length: 64 }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index('class_rules_theme_id_idx').on(table.themeId)],
)

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
	(table) => [
		primaryKey({ columns: [table.ruleId, table.className] }),
		index('class_rule_classes_class_name_idx').on(table.className),
	],
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
