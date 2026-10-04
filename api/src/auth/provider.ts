// The sign-in provider as the rest of the app sees it, in our terms (docs/auth.md, "The provider
// boundary"). Only its adapter knows which provider it is: another provider is another adapter
// meeting this contract, chosen in auth/index.ts. Refreshing, re-checking and the account API join
// it in step 3, with the code that uses them.

/** Who signed in. */
export interface SignedInUser {
	/** The provider's id for the user. */
	subject: string
	name: string | null
	email: string | null
	/** Our roles, such as `admin`. */
	roles: string[]
	/** When the user last proved who they are at the provider, which may be before this sign-in. */
	authTime: Date | null
	/** The provider's own session, for being told when it ends (back-channel sign-out, later). */
	providerSessionId: string | null
}

/** The provider's tokens. Only our server holds them. */
export interface ProviderTokens {
	accessToken: string
	accessTokenExpiresAt: Date
	refreshToken: string | null
	idToken: string | null
}

/** What finishing a sign-in checks. Kept with us meanwhile; only the provider reads it. */
export type SignInChecks = Readonly<Record<string, string>>

export interface SignInStart {
	/** Where to send the browser. */
	address: string
	/** Names this sign-in: it comes back as the callback's `state` parameter (OAuth 2.0). */
	state: string
	checks: SignInChecks
}

export interface IdentityProvider {
	/** A sign-in that comes back to `callback`. */
	startSignIn(callback: string): Promise<SignInStart>
	/** Finishes sign-in at the address the provider sent the browser back to. */
	finishSignIn(
		callback: URL,
		checks: SignInChecks,
	): Promise<{ user: SignedInUser; tokens: ProviderTokens }>
	/** Ends a refresh token at the provider. */
	revoke(refreshToken: string): Promise<void>
	/** Where to send the browser to end its session at the provider, coming back to `returnTo`. */
	signOutAddress(idToken: string | null, returnTo: string): Promise<string>
}
