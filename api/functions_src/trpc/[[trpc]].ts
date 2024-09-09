import { drizzle } from 'drizzle-orm/d1'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { Context } from '../../dist/config/trpc.js'
import * as schema from '../../dist/schemas/schema.js'
import { initEnvs, type Envs } from '../../dist/config/envs.js'

export const onRequest: PagesFunction<Envs> = async ({ request, env }) => {
  try {
    initEnvs(env)

    // Dynamically import any dependencies that use the `env` object
    const [{ appRouter }] = await Promise.all([import('../../dist/routes/appRouter.js')])

    return fetchRequestHandler({
      endpoint: '/trpc',
      req: request,
      router: appRouter,
      createContext: (): Context => {
        return {
          req: request,
          db: drizzle(env.DB, { schema })
        }
      },
      onError: ({ error }) => {
        // Change error to hide deatils from the client and log if required
        if (error.code == 'INTERNAL_SERVER_ERROR') {
          // Can log errors from here
          console.log({
            name: error.name,
            code: error.code,
            message: error.message
          })
          // Change error
          error.stack = ''
          error.message = 'Internal Server Error'
        }
        // throw Error('Will crash if thrown here')
      }
    })
  } catch (error: any) {
    // Handle errors that occur outside of tRPC
    console.log(error)
    return new Response('Internal Server Error: ', { status: 500 })
  }
}
