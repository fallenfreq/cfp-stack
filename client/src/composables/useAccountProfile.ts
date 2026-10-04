import { trpc } from '@/trpc'
import type { AccountProfile } from '@somefreq-app/api/appRouter'
import { useQuery } from '@tanstack/vue-query'
import { TRPCClientError } from '@trpc/client'

export type { AccountProfile }

export const accountProfileKey = ['account', 'profile']

// What the sign-in provider refused (a wrong code, an address in use), as the server words it;
// null for any other failure.
export const refusalOf = (error: unknown) =>
	error instanceof TRPCClientError && error.data?.code === 'UNPROCESSABLE_CONTENT'
		? error.message
		: null

// Your account at the sign-in provider, through our server.
export function useAccountProfile() {
	return useQuery({
		queryKey: accountProfileKey,
		queryFn: () => trpc.account.profile.query(),
		retry: false,
	})
}
