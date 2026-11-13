import { connectionDropped, notifyError } from '@/services/errors'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/vue-query'

// A read or a write that fails says why, once, wherever it was made (services/errors.ts). A write
// whose page shows the error itself says so: meta: { showsOwnError: true }. A write made offline
// fails at once and says so, rather than waiting unseen to go out once the browser is back online.
// A read whose connection dropped is asked once more, a second later, and waits first if the
// browser is offline or the tab hidden by then. Any other failure says so at once: a refusal or a
// server error would meet the same answer, and the time limit has waited already.
const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: (failures, error) => failures === 0 && connectionDropped(error) },
		mutations: { networkMode: 'always' },
	},
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
