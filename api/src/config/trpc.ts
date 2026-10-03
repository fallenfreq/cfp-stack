import { TRPCError, initTRPC } from '@trpc/server'
import axios from 'axios'
import { type DrizzleD1Database } from 'drizzle-orm/d1'
import superjson from 'superjson'
import { getAllEnvs } from '../config/envs.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'

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

interface Context {
	db: DrizzleD1Database<typeof schemas>
	req: Request
	roles?: string[]
}

const t = initTRPC.context<Context>().create({
	transformer: superjson,
})

const secure = t.middleware(async ({ next, ctx }) => {
	const authHeader = ctx.req.headers.get('Authorization')
	if (!authHeader) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Please log in to continue',
		})
	}

	const token = authHeader.split(' ')[1]
	try {
		const response = await axios.post<{
			active: boolean
			// Zitadel project roles: { [roleKey]: { [orgId]: orgDomain } }
			'urn:zitadel:iam:org:project:roles'?: Record<string, Record<string, string>>
		}>(ZITADEL_INTROSPECTION_ENDPOINT, `token=${token}`, {
			adapter: 'fetch',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${btoa(`${ZITADEL_CLIENT_ID}:${ZITADEL_CLIENT_SECRET}`)}`,
			},
		})
		if (!response.data.active) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'Session expired, please log in again',
			})
		}
		const rolesObj = response.data['urn:zitadel:iam:org:project:roles']
		const roles = rolesObj ? Object.keys(rolesObj) : []
		return next({ ctx: { secure: true, roles } })
	} catch (error: any) {
		if (error instanceof TRPCError) throw error
		// Network or Zitadel HTTP error — server-side problem, not a client auth failure.
		// onError in [[trpc]].ts logs this and replaces the message before sending to client.
		const message = error.response ? JSON.stringify(error.response.data) : error.message
		console.error('Introspection error:', message)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: `Introspection failed: ${message}`,
		})
	}
})

const adminMiddleware = t.middleware(({ next, ctx }) => {
	if (!ctx.roles?.includes('admin')) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
	}
	return next()
})

function domainErrorCode(error: unknown) {
	if (error instanceof ValidationError) return 'BAD_REQUEST'
	if (error instanceof NotFoundError) return 'NOT_FOUND'
	if (error instanceof ConflictError) return 'CONFLICT'
	return undefined
}

// Domain errors are written for the user, so they go out with their message and a matching
// code. Anything else stays INTERNAL_SERVER_ERROR, which onError in [[trpc]].ts hides.
const domainErrors = t.middleware(async ({ next }) => {
	const result = await next()
	if (result.ok) return result
	const { cause } = result.error
	const code = domainErrorCode(cause)
	if (code) throw new TRPCError({ code, message: result.error.message, cause })
	return result
})

const router = t.router
const publicProcedure = t.procedure.use(domainErrors)
const secureProcedure = publicProcedure.use(secure)
const adminProcedure = secureProcedure.use(adminMiddleware)

export { adminProcedure, publicProcedure, router, secureProcedure, type Context, type schemas }
