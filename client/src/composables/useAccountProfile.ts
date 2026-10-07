import { trpc } from '@/trpc'
import type { AccountProfile } from '@somefreq-app/api/appRouter'
import { useQuery } from '@tanstack/vue-query'

export type { AccountProfile }

export const accountProfileKey = ['account', 'profile']

// Your account at the sign-in provider, through our server.
export function useAccountProfile() {
	return useQuery({
		queryKey: accountProfileKey,
		queryFn: () => trpc.account.profile.query(),
		retry: false,
	})
}
