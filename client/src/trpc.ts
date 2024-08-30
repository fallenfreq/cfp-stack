import { httpBatchLink, createTRPCClient } from '@trpc/client'
import zitadelAuth from '@/services/zitadelAuth'

import type { AppRouter } from '@vue-app/api/appRouter'
import superjson from 'superjson'

const { VITE_API_PORT, VITE_API_HOST } = import.meta.env

// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${VITE_API_PORT === '443' ? 'https' : 'http'}://${VITE_API_HOST}:${VITE_API_PORT}/trpc`,
      headers: () => {
        return {
          Authorization: 'Bearer ' + zitadelAuth.oidcAuth.accessToken
        }
      }
    })
  ]
})

export { trpc }
