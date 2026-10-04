import { eq, lt } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { sessions } from '../schemas/session.js'
import type { ProviderTokens, SignedInUser } from './provider.js'
import type { Sealer } from './sealing.js'

// Session rows in D1 (docs/auth.md, "Sessions"). The cookie holds a random id; the table keeps only
// its hash, so a copy of the database holds no usable cookie. The provider's tokens are sealed and
// bound to their row. No HTTP here.

/** Fixed from sign-in: the cookie's Max-Age is set once, so reading a session never writes. */
export const SESSION_SECONDS = 30 * 24 * 60 * 60

type TokenColumn = 'accessToken' | 'refreshToken' | 'idToken'

export function sessionStore(db: DrizzleD1Database, sealer: Sealer) {
	const place = (idHash: string, subject: string, column: TokenColumn) =>
		[idHash, subject, column].join('\n')

	return {
		/** A new session; returns the cookie's value. */
		async create(user: SignedInUser, tokens: ProviderTokens): Promise<string> {
			const now = new Date()
			await db.delete(sessions).where(lt(sessions.expiresAt, now))
			const id = hex(crypto.getRandomValues(new Uint8Array(32)))
			const idHash = await hashOf(id)
			const seal = (value: string, column: TokenColumn) =>
				sealer.seal(value, place(idHash, user.subject, column))
			await db.insert(sessions).values({
				idHash,
				subject: user.subject,
				providerSessionId: user.providerSessionId,
				name: user.name,
				email: user.email,
				roles: user.roles,
				authTime: user.authTime,
				accessToken: await seal(tokens.accessToken, 'accessToken'),
				refreshToken:
					tokens.refreshToken && (await seal(tokens.refreshToken, 'refreshToken')),
				idToken: tokens.idToken && (await seal(tokens.idToken, 'idToken')),
				accessTokenExpiresAt: tokens.accessTokenExpiresAt,
				checkedAt: now,
				createdAt: now,
				expiresAt: new Date(now.getTime() + SESSION_SECONDS * 1000),
			})
			return id
		},

		/** Deletes the session; returns what signing out of the provider needs. */
		async end(id: string) {
			const idHash = await hashOf(id)
			const [row] = await db.delete(sessions).where(eq(sessions.idHash, idHash)).returning({
				subject: sessions.subject,
				refreshToken: sessions.refreshToken,
				idToken: sessions.idToken,
			})
			if (!row) return null
			// A token that won't open (the secret rotated without keeping the previous one) is
			// skipped: the session is gone either way.
			const open = (sealed: string | null, column: TokenColumn) =>
				sealed === null
					? null
					: sealer.open(sealed, place(idHash, row.subject, column)).catch(() => null)
			return {
				subject: row.subject,
				refreshToken: await open(row.refreshToken, 'refreshToken'),
				idToken: await open(row.idToken, 'idToken'),
			}
		},
	}
}

const hex = (bytes: ArrayBuffer | Uint8Array) =>
	Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')

const hashOf = async (id: string) =>
	hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id)))
