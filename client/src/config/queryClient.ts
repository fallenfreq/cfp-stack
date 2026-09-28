import { notify } from '@/services/toast'
import { QueryCache, QueryClient } from '@tanstack/vue-query'

// You can subscribe for more control via queryClient.getQueryCache().subscribe

const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.log('Query error', error)
			notify({ message: error.message, variant: 'danger', duration: 10000 })
		},
	}),
	// defaultOptions: {
	//   queries: {
	//     retry: 2
	//   }
	// }
})

export { queryClient }
