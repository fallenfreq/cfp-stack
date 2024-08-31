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
      }
    })
  } catch (error: any) {
    return new Response(error.toString(), { status: 500 })
  }
}
