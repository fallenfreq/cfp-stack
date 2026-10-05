import type { DrizzleD1Database } from 'drizzle-orm/d1'

// The database as `drizzle(env.DB)` gives it, with no tables registered: each query names its
// table (docs/database.md, "How we use it").
export type Db = DrizzleD1Database
