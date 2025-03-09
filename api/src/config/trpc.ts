import { TRPCError, initTRPC } from '@trpc/server'
import { type DrizzleD1Database } from 'drizzle-orm/d1'
import superjson from 'superjson'
import axios from 'axios'
import { getAllEnvs } from '../config/envs.js'

// TODO: importing schemas from ../schemas/index.js causes type issues on query
// but not if I do the same thing here. and here it breaks if I add mapMarkers

import * as user from '../schemas/user.js'
// import * as mapMarkers from '../schemas/mapMarkers.js'
import * as collection from '../schemas/collectionEntry.js'
// import * as schemas from '../schemas/index.js'

// adding mapMarkers to schemas is causing the build to fail
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schemas = { ...user, ...collection }

const { ZITADEL_INTROSPECTION_ENDPOINT, ZITADEL_CLIENT_ID, ZITADEL_CLIENT_SECRET } = getAllEnvs()
// type appDb = DrizzleD1Database<typeof schemas>
// Define the type for the context
type Context = {
  db: DrizzleD1Database<typeof schemas>
  req: Request
}

// Initialize tRPC with the correct context type
const t = initTRPC.context<Context>().create({
  transformer: superjson
})

const secure = t.middleware(async ({ next, ctx }) => {
  // test if get Authorization works
  const authHeader = ctx.req.headers.get('Authorization')
  if (!authHeader) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No authorization header provided'
    })
  }

  const token = authHeader.split(' ')[1]
  try {
    const response = await axios.post(ZITADEL_INTROSPECTION_ENDPOINT, `token=${token}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: ZITADEL_CLIENT_ID,
        password: ZITADEL_CLIENT_SECRET
      }
    })

    if (!response.data.active) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Inactive token'
      })
    }
    return next({ ctx: { secure: true } })
  } catch (error: any) {
    const message = error.response ? error.response.data : error.message
    console.error('Introspection error:', message)

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to introspect token: ${message}`,
      cause: error
    })
  }
})

const router = t.router
const publicProcedure = t.procedure
const secureProcedure = t.procedure.use(secure)

export { router, publicProcedure, secureProcedure, type Context, type schemas }
