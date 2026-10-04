import { z } from 'zod'
import { oidcProvider, type OidcSettings } from '../auth/oidc.js'
import type { IdentityProvider } from '../auth/provider.js'

// The only code that knows Zitadel (docs/auth.md, "Zitadel (the current provider)"): its own
// setting, its scopes and where it puts roles. Its account API joins it in step 3.

const settingsSchema = z.object({
	// The Zitadel project whose roles are our roles.
	ZITADEL_PROJECT_ID: z.string().min(1),
})

export function zitadel(oidc: OidcSettings, env: unknown): IdentityProvider {
	const { ZITADEL_PROJECT_ID: projectId } = settingsSchema.parse(env)
	// `{ [role]: { [orgId]: orgDomain } }`, under the project's own claim.
	const rolesClaim = `urn:zitadel:iam:org:project:${projectId}:roles`
	return oidcProvider(oidc, {
		scopes: [
			// Tokens meant for our project and for Zitadel's own API (your account, through our server).
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
	})
}
