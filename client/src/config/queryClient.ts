import { notifyError } from '@/services/errors'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/vue-query'

// A read or a write that fails says why, once, wherever it was made (services/errors.ts). A write
// whose page shows the error itself says so: meta: { showsOwnError: true }. A write made offline
// fails at once and says so, rather than waiting unseen to go out once the browser is back online.
const queryClient = new QueryClient({
	defaultOptions: { mutations: { networkMode: 'always' } },
	queryCache: new QueryCache({ onError: notifyError }),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			if (!mutation.meta?.showsOwnError) notifyError(error)
		},
	}),
})

declare module '@tanstack/vue-query' {
	interface Register {
		mutationMeta: { showsOwnError?: boolean }
	}
}

export { queryClient }
