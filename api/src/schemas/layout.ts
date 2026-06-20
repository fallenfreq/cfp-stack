import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─── Collapse thresholds ─────────────────────────────────────────────────
// System-level layout configuration — not theme-controlled. Each row names
// a width threshold at which sl-collapse-{name} triggers a layout collapse.
// Values are CSS lengths embedded directly in generated @container conditions
// (var() is not valid in @container conditions, so values are resolved at
// CSS emit time rather than being referenced via custom properties).

export const collapseThresholds = sqliteTable('collapse_thresholds', {
	name: text('name', { length: 16 }).primaryKey(),
	value: text('value', { length: 32 }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})

export type CollapseThreshold = typeof collapseThresholds.$inferSelect
