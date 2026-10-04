import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Signed-in sessions (docs/auth.md, "Sessions"). The provider's tokens are sealed (auth/sealing.ts).
export const sessions = sqliteTable('sessions', {
	idHash: text('id_hash').primaryKey(), // SHA-256 of the cookie's value, never the value
	subject: text('subject').notNull(), // the provider's user id
	providerSessionId: text('provider_session_id'),
	name: text('name'),
	email: text('email'),
	roles: text('roles', { mode: 'json' }).$type<string[]>().notNull(),
	authTime: integer('auth_time', { mode: 'timestamp' }),
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }).notNull(),
	// One request refreshes the tokens at a time: the one holding the lease until it runs out.
	refreshLease: text('refresh_lease'),
	refreshLeaseUntil: integer('refresh_lease_until', { mode: 'timestamp' }),
	checkedAt: integer('checked_at', { mode: 'timestamp' }).notNull(), // last good check with the provider
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})
