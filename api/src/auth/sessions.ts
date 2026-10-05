import { and, eq, gt, isNull, lt, or } from 'drizzle-orm'
import type { Db } from '../db.js'
import { sessions } from '../schemas/session.js'
import type { IdentityProvider, ProviderTokens, SignedInUser } from './provider.js'
import type { Sealer } from './sealing.js'

// Session rows in D1 (docs/auth.md, "Sessions", "Refreshing", "Re-checking with the provider"). The
// cookie holds a random id; the table keeps only its hash, so a copy of the database holds no
// usable cookie. The provider's tokens are sealed and bound to their row. No HTTP here.

/** Fixed from sign-in: the cookie's Max-Age is set once, so reading a session never writes. */
export const SESSION_SECONDS = 30 * 24 * 60 * 60

const MINUTE = 60 * 1000
/** A sensitive change (the email) needs a sign-in this recent. */
const RECENT_SIGN_IN = 10 * MINUTE
/** The access token is refreshed when less than this is left of it. */
const REFRESH_BEFORE = MINUTE
/** How long one request may hold the right to refresh (the provider's request times out at 10 s). */
const LEASE = 30 * 1000
/** Calls that need sign-in ask the provider whether the user is still valid this often… */
const RECHECK_EVERY = 10 * MINUTE
/** …and are refused while it can't be reached, once its last answer is this old. */
const UNCHECKED_LIMIT = 60 * MINUTE

export type Session = typeof sessions.$inferSelect

/** Who a session is for. */
export interface SessionUser {
	subject: string
	name: string | null
	email: string | null
	roles: string[]
	authTime: Date | null
}

/** Neither a session nor its end: the provider can't be reached, or another request is refreshing. */
export class SessionUnavailable extends Error {}

export type WaitUntil = (promise: Promise<unknown>) => void

type TokenColumn = 'accessToken' | 'refreshToken' | 'idToken'

export function sessionStore(db: Db, sealer: Sealer, provider: IdentityProvider) {
	const place = (idHash: string, subject: string, column: TokenColumn) =>
		[idHash, subject, column].join('\n')
	const seal = (
		session: Pick<Session, 'idHash' | 'subject'>,
		column: TokenColumn,
		value: string,
	) => sealer.seal(value, place(session.idHash, session.subject, column))

	// A token that's missing or won't open (the secret rotated without keeping the previous one)
	// ends its session: signing in again is the way back. null then.
	async function open(session: Session, column: TokenColumn) {
		const sealed = session[column]
		const plain =
			sealed === null
				? null
				: await sealer
						.open(sealed, place(session.idHash, session.subject, column))
						.catch(() => null)
		if (plain !== null) return plain
		await db.delete(sessions).where(eq(sessions.idHash, session.idHash))
		console.log(`Session ended: its ${column} is missing or won't open`, {
			subject: session.subject,
		})
		return null
	}

	// The session with at least a minute left of its access token, refreshed first if needed:
	// 'busy' while another request refreshes it, 'unreachable' if the provider can't be reached,
	// null if the session has ended.
	async function fresh(session: Session, waitUntil: WaitUntil) {
		if (session.accessTokenExpiresAt.getTime() - Date.now() > REFRESH_BEFORE) return session
		const now = new Date()
		const lease = hex(crypto.getRandomValues(new Uint8Array(16)))
		const [claimed] = await db
			.update(sessions)
			.set({ refreshLease: lease, refreshLeaseUntil: new Date(now.getTime() + LEASE) })
			.where(and(eq(sessions.idHash, session.idHash), leaseFree(now)))
			.returning()
		if (!claimed) return 'busy'
		const mine = and(eq(sessions.idHash, session.idHash), eq(sessions.refreshLease, lease))
		const release = () =>
			db.update(sessions).set({ refreshLease: null, refreshLeaseUntil: null }).where(mine)
		// Refreshed by another request since this one read it.
		if (claimed.accessTokenExpiresAt.getTime() - now.getTime() > REFRESH_BEFORE) {
			await release()
			return claimed
		}
		const subject = claimed.subject
		// Kept alive after the response: a refresh token used but not stored would end the session.
		const refreshing = (async () => {
			const refreshToken = await open(claimed, 'refreshToken')
			if (refreshToken === null) return null
			let tokens: ProviderTokens | 'refused'
			try {
				tokens = await provider.refresh(refreshToken)
			} catch (error) {
				await release()
				console.warn('Refreshing failed; the session is kept:', {
					subject,
					error: message(error),
				})
				return 'unreachable' as const
			}
			if (tokens === 'refused') {
				await db.delete(sessions).where(mine)
				console.log('Session ended: the provider refused a refresh', { subject })
				return null
			}
			const refreshed = await db
				.update(sessions)
				.set({
					accessToken: await seal(claimed, 'accessToken', tokens.accessToken),
					accessTokenExpiresAt: tokens.accessTokenExpiresAt,
					...(tokens.refreshToken && {
						refreshToken: await seal(claimed, 'refreshToken', tokens.refreshToken),
					}),
					...(tokens.idToken && {
						idToken: await seal(claimed, 'idToken', tokens.idToken),
					}),
					refreshLease: null,
					refreshLeaseUntil: null,
				})
				.where(mine)
				.returning()
				.then(
					([row]) => row ?? null,
					(error: unknown) => {
						console.error('Storing refreshed tokens failed:', {
							subject,
							error: message(error),
						})
						return null
					},
				)
			// Not stored (signed out meanwhile, or the write failed), so not left usable either.
			if (!refreshed && tokens.refreshToken)
				await provider.revoke(tokens.refreshToken).catch((error: unknown) => {
					console.warn('Revoking a refresh token failed:', {
						subject,
						error: message(error),
					})
				})
			return refreshed
		})()
		waitUntil(refreshing)
		return refreshing
	}

	return {
		/** A new session; returns the cookie's value. */
		async create(user: SignedInUser, tokens: ProviderTokens): Promise<string> {
			const now = new Date()
			await db.delete(sessions).where(lt(sessions.expiresAt, now))
			const id = hex(crypto.getRandomValues(new Uint8Array(32)))
			const row = { idHash: await idHashOf(id), subject: user.subject }
			await db.insert(sessions).values({
				...row,
				providerSessionId: user.providerSessionId,
				name: user.name,
				email: user.email,
				roles: user.roles,
				authTime: user.authTime,
				accessToken: await seal(row, 'accessToken', tokens.accessToken),
				refreshToken:
					tokens.refreshToken && (await seal(row, 'refreshToken', tokens.refreshToken)),
				idToken: tokens.idToken && (await seal(row, 'idToken', tokens.idToken)),
				accessTokenExpiresAt: tokens.accessTokenExpiresAt,
				checkedAt: now,
				createdAt: now,
				expiresAt: new Date(now.getTime() + SESSION_SECONDS * 1000),
			})
			return id
		},

		/** The session as last known, or null (none, or expired). Never writes. */
		async read(id: string) {
			const [row] = await db
				.select()
				.from(sessions)
				.where(
					and(
						eq(sessions.idHash, await idHashOf(id)),
						gt(sessions.expiresAt, new Date()),
					),
				)
			return row ?? null
		},

		/**
		 * The session, its user vouched for by the provider in the last 10 minutes. While the
		 * provider can't be reached, as last known for up to an hour, then SessionUnavailable.
		 * null: the provider no longer accepts the user, so the session has ended.
		 */
		async checked(session: Session, waitUntil: WaitUntil): Promise<Session | null> {
			const age = Date.now() - session.checkedAt.getTime()
			if (age < RECHECK_EVERY) return session
			const unchecked = (reason: string) => {
				if (age < UNCHECKED_LIMIT) return session
				throw new SessionUnavailable(
					`The user couldn't be re-checked for an hour: ${reason}`,
				)
			}
			const live = await fresh(session, waitUntil)
			if (live === null) return null
			if (live === 'busy' || live === 'unreachable') return unchecked(live)
			const accessToken = await open(live, 'accessToken')
			if (accessToken === null) return null
			let current
			try {
				current = await provider.currentUser(accessToken, live.subject)
			} catch (error) {
				console.warn('Re-checking the user failed:', {
					subject: live.subject,
					error: message(error),
				})
				return unchecked('unreachable')
			}
			if (current === 'refused') {
				// Unless the token changed meanwhile: a refresh ends the old one at once.
				const [ended] = await db
					.delete(sessions)
					.where(
						and(
							eq(sessions.idHash, live.idHash),
							eq(sessions.accessToken, live.accessToken),
							leaseFree(new Date()),
						),
					)
					.returning({ subject: sessions.subject })
				if (!ended) return unchecked('the token changed while checking')
				console.log('Session ended: the provider no longer accepts the user', {
					subject: live.subject,
				})
				return null
			}
			const [checked] = await db
				.update(sessions)
				.set({ ...current, checkedAt: new Date() })
				.where(eq(sessions.idHash, live.idHash))
				.returning()
			return checked ?? null
		},

		/**
		 * A live access token, for calls made at the provider on the user's behalf. Waits a moment
		 * if another request is refreshing it. null: the session has ended.
		 */
		async accessToken(session: Session, waitUntil: WaitUntil): Promise<string | null> {
			for (let attempt = 0; ; attempt++) {
				const live = await fresh(session, waitUntil)
				if (live === null) return null
				if (live === 'unreachable')
					throw new SessionUnavailable("The provider can't be reached")
				if (live !== 'busy') return open(live, 'accessToken')
				if (attempt === 3)
					throw new SessionUnavailable('Another request is refreshing the tokens')
				await new Promise((resolve) => setTimeout(resolve, 500))
				const [reread] = await db
					.select()
					.from(sessions)
					.where(eq(sessions.idHash, session.idHash))
				if (!reread) return null
				session = reread
			}
		},

		/** Deletes the session; returns what signing out of the provider needs. */
		async end(id: string) {
			const idHash = await idHashOf(id)
			const [row] = await db.delete(sessions).where(eq(sessions.idHash, idHash)).returning({
				subject: sessions.subject,
				refreshToken: sessions.refreshToken,
				idToken: sessions.idToken,
			})
			if (!row) return null
			// A token that won't open (the secret rotated without keeping the previous one) is
			// skipped: the session is gone either way.
			const opened = (sealed: string | null, column: TokenColumn) =>
				sealed === null
					? null
					: sealer.open(sealed, place(idHash, row.subject, column)).catch(() => null)
			return {
				subject: row.subject,
				refreshToken: await opened(row.refreshToken, 'refreshToken'),
				idToken: await opened(row.idToken, 'idToken'),
			}
		},
	}
}

// No request is refreshing: none claimed it, or the one that did ran out of time.
const leaseFree = (now: Date) =>
	or(isNull(sessions.refreshLeaseUntil), lt(sessions.refreshLeaseUntil, now))

export const userOf = ({ subject, name, email, roles, authTime }: Session): SessionUser => ({
	subject,
	name,
	email,
	roles,
	authTime,
})

export const signedInRecently = (user: SessionUser) =>
	user.authTime !== null && Date.now() - user.authTime.getTime() < RECENT_SIGN_IN

const idHashOf = async (id: string) =>
	hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id)))

const hex = (bytes: ArrayBuffer | Uint8Array) =>
	Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')

const message = (error: unknown) => (error instanceof Error ? error.message : error)
