import * as client from 'openid-client'
import type { IdentityProvider, ProviderTokens } from './provider.js'

// Signing in with any OpenID Connect provider (docs/auth.md, "Signing in"): the code flow with
// PKCE and state, the client secret sent as HTTP Basic, the ID token checked, then roles and
// profile from user info — the same source re-checking reads, so a provider that puts roles
// elsewhere shows at once. Refreshing. An adapter adds what's its provider's own: scopes, and
// where roles are.

export interface OidcSettings {
	issuer: string
	clientId: string
	clientSecret: string
}

export interface OidcAdapter {
	/** Scopes beyond `openid profile email offline_access`. */
	scopes: string[]
	/** Our roles, from the provider's user info. */
	roles(claims: Readonly<Record<string, unknown>>): string[]
}

const SCOPES = ['openid', 'profile', 'email', 'offline_access']
const TIMEOUT_SECONDS = 10

export function oidcProvider(settings: OidcSettings, adapter: OidcAdapter): IdentityProvider {
	return {
		async startSignIn(callback, { maxAgeSeconds } = {}) {
			const state = client.randomState()
			const codeVerifier = client.randomPKCECodeVerifier()
			const maxAge = maxAgeSeconds === undefined ? {} : { max_age: String(maxAgeSeconds) }
			const address = client.buildAuthorizationUrl(await configuration(settings), {
				redirect_uri: callback,
				scope: [...SCOPES, ...adapter.scopes].join(' '),
				code_challenge: await client.calculatePKCECodeChallenge(codeVerifier),
				code_challenge_method: 'S256',
				state,
				...maxAge,
			})
			return { address: address.href, state, checks: { state, codeVerifier, ...maxAge } }
		},

		async finishSignIn(callback, { state, codeVerifier, max_age }) {
			try {
				if (!state || !codeVerifier) throw new Error('Sign-in checks missing')
				const config = await configuration(settings)
				// With max_age, the ID token's auth_time is checked against it.
				const tokens = await client.authorizationCodeGrant(config, callback, {
					expectedState: state,
					pkceCodeVerifier: codeVerifier,
					idTokenExpected: true,
					...(max_age ? { maxAge: Number(max_age) } : {}),
				})
				const idToken = tokens.claims()
				if (!idToken) throw new Error('No ID token')
				const userInfo = await client.fetchUserInfo(
					config,
					tokens.access_token,
					idToken.sub,
				)
				return {
					user: {
						...currentUser(userInfo),
						subject: idToken.sub,
						authTime: idToken.auth_time ? new Date(idToken.auth_time * 1000) : null,
						providerSessionId: text(idToken.sid),
					},
					tokens: providerTokens(tokens),
				}
			} catch (error) {
				// Rethrown without the original, whose details can hold the provider's response.
				throw new Error(`Sign-in didn't finish: ${describe(error)}`)
			}
		},

		async refresh(refreshToken) {
			try {
				return providerTokens(
					await client.refreshTokenGrant(await configuration(settings), refreshToken),
				)
			} catch (error) {
				if (error instanceof client.ResponseBodyError && error.error === 'invalid_grant')
					return 'refused'
				throw new Error(`Refreshing didn't work: ${describe(error)}`)
			}
		},

		async currentUser(accessToken, subject) {
			try {
				const config = await configuration(settings)
				return currentUser(await client.fetchUserInfo(config, accessToken, subject))
			} catch (error) {
				if (statusOf(error) === 401) return 'refused'
				throw new Error(`Checking the user didn't work: ${describe(error)}`)
			}
		},

		async revoke(refreshToken) {
			await client.tokenRevocation(await configuration(settings), refreshToken, {
				token_type_hint: 'refresh_token',
			})
		},

		async signOutAddress(idToken, returnTo) {
			const config = await configuration(settings)
			return client.buildEndSessionUrl(config, {
				post_logout_redirect_uri: returnTo,
				...(idToken ? { id_token_hint: idToken } : {}),
			}).href
		},
	}

	function currentUser(claims: Readonly<Record<string, unknown>>) {
		return { name: text(claims.name), email: text(claims.email), roles: adapter.roles(claims) }
	}
}

// A provider may keep the refresh and ID tokens it gave before: null here keeps them.
function providerTokens(tokens: client.TokenEndpointResponse): ProviderTokens {
	return {
		accessToken: tokens.access_token,
		accessTokenExpiresAt: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
		refreshToken: tokens.refresh_token ?? null,
		idToken: tokens.id_token ?? null,
	}
}

// The provider's metadata, fetched once per isolate (settings don't change within one). Only the
// result is kept: a Worker mustn't await a fetch another request started, which may be cancelled
// with it.
let discovered: client.Configuration | undefined

async function configuration({ issuer, clientId, clientSecret }: OidcSettings) {
	discovered ??= await client.discovery(
		new URL(issuer),
		clientId,
		undefined,
		// The library would post the secret in the body otherwise.
		client.ClientSecretBasic(clientSecret),
		{ timeout: TIMEOUT_SECONDS },
	)
	return discovered
}

const text = (value: unknown) => (typeof value === 'string' && value ? value : null)

// What went wrong, safe to log: the provider's error code and description, or the library's
// message; never a response body.
function describe(error: unknown) {
	if (
		error instanceof client.AuthorizationResponseError
		|| error instanceof client.ResponseBodyError
	)
		return [error.error, error.error_description].filter(Boolean).join(': ')
	return error instanceof Error ? error.message : 'unknown error'
}

// The HTTP status the provider answered with, wherever the library keeps it.
function statusOf(error: unknown) {
	if (
		error instanceof client.ResponseBodyError
		|| error instanceof client.WWWAuthenticateChallengeError
	)
		return error.status
	const cause = error instanceof Error ? error.cause : undefined
	return cause instanceof Response ? cause.status : undefined
}
