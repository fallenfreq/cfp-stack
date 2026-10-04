// The sign-in provider as the rest of the app sees it, in our terms (docs/auth.md, "The provider
// boundary"). Only its adapter knows which provider it is: another provider is another adapter
// meeting this contract, chosen in auth/index.ts.

/** Who signed in. */
export interface SignedInUser extends CurrentUser {
	/** The provider's id for the user. */
	subject: string
	/** When the user last proved who they are at the provider, which may be before this sign-in. */
	authTime: Date | null
	/** The provider's own session, for being told when it ends (back-channel sign-out, later). */
	providerSessionId: string | null
}

/** What can change about a user while they're signed in. */
export interface CurrentUser {
	name: string | null
	email: string | null
	/** Our roles, such as `admin`. */
	roles: string[]
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

/** The provider no longer accepts the token: the session is over. */
export type Refused = 'refused'

export interface IdentityProvider {
	/**
	 * A sign-in that comes back to `callback`. With `maxAgeSeconds`, the user proves who they are
	 * again unless they did within that time.
	 */
	startSignIn(callback: string, options?: { maxAgeSeconds?: number }): Promise<SignInStart>
	/** Finishes sign-in at the address the provider sent the browser back to. */
	finishSignIn(
		callback: URL,
		checks: SignInChecks,
	): Promise<{ user: SignedInUser; tokens: ProviderTokens }>
	/** New tokens. Throws if the provider can't be reached. */
	refresh(refreshToken: string): Promise<ProviderTokens | Refused>
	/** The user as the provider knows them now. Throws if the provider can't be reached. */
	currentUser(accessToken: string, subject: string): Promise<CurrentUser | Refused>
	/** Ends a refresh token at the provider. */
	revoke(refreshToken: string): Promise<void>
	/** Where to send the browser to end its session at the provider, coming back to `returnTo`. */
	signOutAddress(idToken: string | null, returnTo: string): Promise<string>
}

export type Gender = 'female' | 'male' | 'diverse'

/** Your account at the provider. */
export interface AccountProfile {
	/** The provider's id for you. */
	userId: string
	username: string
	firstName: string
	lastName: string
	displayName: string
	nickname: string
	/** A language code such as `en`; empty when not set. */
	language: string
	gender: Gender | null
	email: string
	emailVerified: boolean
}

export type ProfileChanges = Pick<
	AccountProfile,
	'firstName' | 'lastName' | 'displayName' | 'nickname' | 'language' | 'gender'
>

/** How the provider answered a change: done, or refused (it didn't accept the input). */
export type AccountChange = 'done' | 'refused'

/**
 * Your own account, changed through our server with your session's token. Made for one signed-in
 * user, so no method takes a user id (docs/auth.md, "Adding account features"). Each throws if the
 * provider can't be reached.
 */
export interface AccountProvider {
	profile(): Promise<AccountProfile>
	updateProfile(changes: ProfileChanges): Promise<AccountChange>
	/** Changes the email at once and sends a code to the new address, to verify it. */
	changeEmail(email: string): Promise<AccountChange>
	resendEmailCode(): Promise<AccountChange>
	verifyEmail(code: string): Promise<AccountChange>
}

/** Who an `AccountProvider` acts for. */
export interface AccountHolder {
	subject: string
	accessToken: string
}

/** What an adapter gives: signing in, and each signed-in user's own account. */
export interface Provider {
	identity: IdentityProvider
	account(holder: AccountHolder): AccountProvider
}
