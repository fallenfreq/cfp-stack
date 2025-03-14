import { QueryClient, QueryCache } from '@tanstack/vue-query'
import { useToast } from 'vuestic-ui'

// You can subscribe for more control via queryClient.getQueryCache().subscribe

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Duration in milliseconds. Set to 0 to prevent automatic close
      console.log('Query error', error)
      useToast().notify({
        duration: 10000,
        color: 'danger',
        position: 'bottom-right',
        message: error.message
      })
    }
  })
  // defaultOptions: {
  //   queries: {
  //     retry: 2
  //   }
  // }
})

export { queryClient }
