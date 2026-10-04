import { z } from 'zod'
import { oidcProvider, type OidcSettings } from '../auth/oidc.js'
import type {
	AccountChange,
	AccountHolder,
	AccountProfile,
	AccountProvider,
	Gender,
	ProfileChanges,
	Provider,
} from '../auth/provider.js'

// The only code that knows Zitadel (docs/auth.md, "Zitadel (the current provider)"): its own
// setting, its scopes, where it puts roles, and its user API for your account.

const settingsSchema = z.object({
	// The Zitadel project whose roles are our roles.
	ZITADEL_PROJECT_ID: z.string().min(1),
})

export function zitadel(oidc: OidcSettings, env: unknown): Provider {
	const { ZITADEL_PROJECT_ID: projectId } = settingsSchema.parse(env)
	// `{ [role]: { [orgId]: orgDomain } }`, under the project's own claim.
	const rolesClaim = `urn:zitadel:iam:org:project:${projectId}:roles`
	return {
		identity: oidcProvider(oidc, {
			scopes: [
				// Tokens meant for our project and for Zitadel's own API (your account, through
				// our server).
				`urn:zitadel:iam:org:project:id:${projectId}:aud`,
				'urn:zitadel:iam:org:project:id:zitadel:aud',
				'urn:zitadel:iam:org:projects:roles',
			],
			roles: (claims) => {
				const roles = claims[rolesClaim]
				return roles && typeof roles === 'object' && !Array.isArray(roles)
					? Object.keys(roles)
					: []
			},
		}),
		account: (holder) => zitadelAccount(oidc.issuer, holder),
	}
}

const TIMEOUT_MS = 10 * 1000

const genders: Record<Gender, string> = {
	female: 'GENDER_FEMALE',
	male: 'GENDER_MALE',
	diverse: 'GENDER_DIVERSE',
}

// What we read of Zitadel's v2 user.
const userSchema = z.object({
	user: z.object({
		username: z.string(),
		human: z.object({
			profile: z.object({
				givenName: z.string().default(''),
				familyName: z.string().default(''),
				nickName: z.string().default(''),
				displayName: z.string().default(''),
				preferredLanguage: z.string().default(''),
				gender: z.string().default('GENDER_UNSPECIFIED'),
			}),
			email: z.object({
				email: z.string().default(''),
				isVerified: z.boolean().default(false),
			}),
		}),
	}),
})

// Your account, through Zitadel's API with your own token: Zitadel lets a user read and change
// themselves. The v2 user API, except saving the profile: v2 can't clear a field (a nickname,
// say), v1's `users/me/profile` can.
function zitadelAccount(issuer: string, { subject, accessToken }: AccountHolder): AccountProvider {
	const user = `/v2/users/${encodeURIComponent(subject)}`

	const call = (method: string, path: string, body?: object) =>
		fetch(new URL(path, issuer), {
			method,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				...(body ? { 'Content-Type': 'application/json' } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
			signal: AbortSignal.timeout(TIMEOUT_MS),
		})

	// Zitadel refuses what it won't accept (a wrong code, an address in use, a change to what's
	// there already) with 400 or 409. Anything else is a fault: its refusing our token, a limit
	// reached, a request of ours it doesn't know.
	async function change(method: string, path: string, body: object): Promise<AccountChange> {
		const response = await call(method, path, body)
		if (response.ok) return 'done'
		const message = await messageOf(response)
		const { status } = response
		if (status === 400 || status === 409) {
			console.warn('Zitadel refused an account change:', { subject, status, message })
			return 'refused'
		}
		throw new Error(`Zitadel's user API answered ${status}: ${message}`)
	}

	async function readProfile(): Promise<AccountProfile> {
		const response = await call('GET', user)
		if (!response.ok)
			throw new Error(
				`Zitadel's user API answered ${response.status}: ${await messageOf(response)}`,
			)
		const { username, human } = userSchema.parse(await response.json()).user
		const { profile, email } = human
		return {
			userId: subject,
			username,
			firstName: profile.givenName,
			lastName: profile.familyName,
			displayName: profile.displayName,
			nickname: profile.nickName,
			// Zitadel may keep the browser's extensions (`en-u-rg-uszzzz`): the language alone.
			language: profile.preferredLanguage.replace(/-u-.*/i, ''),
			gender: genderOf(profile.gender),
			email: email.email,
			emailVerified: email.isVerified,
		}
	}

	return {
		profile: readProfile,

		// Zitadel refuses to save a profile unchanged, so that's checked first: saved already.
		async updateProfile(changes: ProfileChanges) {
			const saved = await readProfile()
			const fields = Object.keys(changes) as (keyof ProfileChanges)[]
			if (fields.every((field) => changes[field] === saved[field])) return 'done'
			return change('PUT', '/auth/v1/users/me/profile', {
				firstName: changes.firstName,
				lastName: changes.lastName,
				nickName: changes.nickname,
				displayName: changes.displayName,
				preferredLanguage: changes.language,
				gender: changes.gender ? genders[changes.gender] : 'GENDER_UNSPECIFIED',
			})
		},

		changeEmail: (email) => change('POST', `${user}/email`, { email, sendCode: {} }),
		resendEmailCode: () => change('POST', `${user}/email/resend`, { sendCode: {} }),
		verifyEmail: (code) => change('POST', `${user}/email/verify`, { verificationCode: code }),
	}
}

function genderOf(zitadelGender: string): Gender | null {
	const entry = Object.entries(genders).find(([, value]) => value === zitadelGender)
	return entry ? (entry[0] as Gender) : null
}

// What Zitadel says it refused, safe to log.
async function messageOf(response: Response) {
	const body: unknown = await response.json().catch(() => null)
	return body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
		? body.message
		: response.statusText
}
