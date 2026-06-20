import { eq } from 'drizzle-orm'
import { type CollapseThreshold, collapseThresholds } from '../schemas/layout.js'
import { type Db } from './types.js'

export type { CollapseThreshold }

export async function listCollapseThresholds(db: Db): Promise<CollapseThreshold[]> {
	return db.select().from(collapseThresholds).all()
}

export async function setCollapseThreshold(db: Db, name: string, value: string): Promise<void> {
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
