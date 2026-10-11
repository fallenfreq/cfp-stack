import { eq } from 'drizzle-orm'
import type { Db } from '../db.js'
import { type CollapseThreshold, collapseThresholds } from '../schemas/layout.js'
import { ValidationError } from './errors.js'

export type { CollapseThreshold }

export async function listCollapseThresholds(db: Db): Promise<CollapseThreshold[]> {
	return db.select().from(collapseThresholds).all()
}

// A width is a number and a unit, the same unit as the others: the hide/show bands are made by
// sorting the widths by number (slLayout.ts, widthBands), and 640px can't be put in order with
// 40rem before the page knows its font size.
const WIDTH = /^(?:\d+(?:\.\d+)?|\.\d+)([a-z]+)$/i
const unitOf = (value: string) => WIDTH.exec(value)?.[1]?.toLowerCase()

export async function setCollapseThreshold(db: Db, name: string, value: string): Promise<void> {
	const unit = unitOf(value)
	if (!unit)
		throw new ValidationError(`A width is a number and a unit, like 640px — got "${value}"`)
	const others = (await listCollapseThresholds(db)).filter((t) => t.name !== name)
	const other = others.find((t) => unitOf(t.value) !== unit)
	if (other)
		throw new ValidationError(
			`The widths share one unit so they can be put in order: ${other.name} is ${other.value}, got "${value}"`,
		)
	await db
		.insert(collapseThresholds)
		.values({ name, value, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: collapseThresholds.name,
			set: { value, updatedAt: new Date() },
		})
}

export async function removeCollapseThreshold(db: Db, name: string): Promise<void> {
	await db.delete(collapseThresholds).where(eq(collapseThresholds.name, name))
}
