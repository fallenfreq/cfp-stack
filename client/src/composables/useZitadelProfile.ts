import zitadelAuth from '@/services/zitadelAuth'
import { computed } from 'vue'
import { z } from 'zod'

export const zitadelProfileSchema = z.object({
	sub: z.string(),
	given_name: z.string().optional(),
	family_name: z.string().optional(),
	name: z.string().optional(),
	nickname: z.string().optional(),
	email: z.string().email().optional(),
	email_verified: z.boolean().optional(),
	locale: z.string().optional(),
	gender: z.string().optional(),
	preferred_username: z.string().optional(),
})

export type ZitadelProfile = z.infer<typeof zitadelProfileSchema>

export function useZitadelProfile() {
	return computed(() => {
		const result = zitadelProfileSchema.safeParse(zitadelAuth.oidcAuth.userProfile)
		if (!result.success) {
			console.error('Unexpected Zitadel profile shape', result.error)
			return null
		}
		return result.data
	})
}
