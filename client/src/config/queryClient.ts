import { notify } from '@/services/toast'
import { QueryCache, QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.log('Query error', error)
			notify({ message: error.message, variant: 'danger', duration: 10000 })
		},
	}),
})

export { queryClient }
