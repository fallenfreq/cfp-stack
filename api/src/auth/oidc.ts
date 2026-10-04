import * as client from 'openid-client'
import type { IdentityProvider } from './provider.js'

// Signing in with any OpenID Connect provider (docs/auth.md, "Signing in"): the code flow with
// PKCE and state, the client secret sent as HTTP Basic, the ID token checked, then roles and
// profile from user info. An adapter adds what's its provider's own: scopes, and where roles are.

export interface OidcSettings {
	issuer: string
	clientId: string
	clientSecret: string
}

export interface OidcAdapter {
	/** Scopes beyond `openid profile email offline_access`. */
	scopes: string[]
	/** Our roles, from the provider's claims (the ID token's and user info's together). */
	roles(claims: Readonly<Record<string, unknown>>): string[]
}

const SCOPES = ['openid', 'profile', 'email', 'offline_access']
const TIMEOUT_SECONDS = 10

export function oidcProvider(settings: OidcSettings, adapter: OidcAdapter): IdentityProvider {
	return {
		async startSignIn(callback) {
			const state = client.randomState()
			const codeVerifier = client.randomPKCECodeVerifier()
			const address = client.buildAuthorizationUrl(await configuration(settings), {
				redirect_uri: callback,
				scope: [...SCOPES, ...adapter.scopes].join(' '),
				code_challenge: await client.calculatePKCECodeChallenge(codeVerifier),
				code_challenge_method: 'S256',
				state,
			})
			return { address: address.href, state, checks: { state, codeVerifier } }
		},

		async finishSignIn(callback, { state, codeVerifier }) {
			try {
				if (!state || !codeVerifier) throw new Error('Sign-in checks missing')
				const config = await configuration(settings)
				const tokens = await client.authorizationCodeGrant(config, callback, {
					expectedState: state,
					pkceCodeVerifier: codeVerifier,
					idTokenExpected: true,
				})
				const idToken = tokens.claims()
				if (!idToken) throw new Error('No ID token')
				const userInfo = await client.fetchUserInfo(
					config,
					tokens.access_token,
					idToken.sub,
				)
				const claims = { ...idToken, ...userInfo }
				const expiresIn = tokens.expiresIn() ?? 0
				return {
					user: {
						subject: idToken.sub,
						name: text(claims.name),
						email: text(claims.email),
						roles: adapter.roles(claims),
						authTime: idToken.auth_time ? new Date(idToken.auth_time * 1000) : null,
						providerSessionId: text(idToken.sid),
					},
					tokens: {
						accessToken: tokens.access_token,
						accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
						refreshToken: tokens.refresh_token ?? null,
						idToken: tokens.id_token ?? null,
					},
				}
			} catch (error) {
				// Rethrown without the original, whose details can hold the provider's response.
				throw new Error(`Sign-in didn't finish: ${describe(error)}`)
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
