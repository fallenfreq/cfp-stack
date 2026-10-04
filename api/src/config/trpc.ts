import { TRPCError, initTRPC } from '@trpc/server'
import { type DrizzleD1Database } from 'drizzle-orm/d1'
import superjson from 'superjson'
import type { RequestSession } from '../auth/index.js'
import { SessionUnavailable } from '../auth/sessions.js'
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

interface Context {
	db: DrizzleD1Database<typeof schemas>
	session: RequestSession
}

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	// Answers never carry a stack trace. tRPC adds one to every error unless NODE_ENV is
	// 'production', which Workers don't set, so live sent them too.
	isDev: false,
})

// Signed in, vouched for by the provider in the last 10 minutes (docs/auth.md, "Re-checking
// with the provider"), so a user the provider has ended loses access within them.
const signedIn = t.middleware(async ({ next, ctx }) =>
	next({ ctx: { user: required(await ctx.session.checkedUser()) } }),
)

// Admins, vouched for the same way.
const admin = t.middleware(async ({ next, ctx }) => {
	const user = required(await ctx.session.checkedUser())
	if (!user.roles.includes('admin'))
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
	return next({ ctx: { user } })
})

// Your own account at the provider, with the session's token ("Adding account features").
const account = t.middleware(async ({ next, ctx }) =>
	next({ ctx: required(await ctx.session.account()) }),
)

function required<T>(signedInAs: T | null): T {
	if (signedInAs === null)
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please sign in to continue' })
	return signedInAs
}

function domainErrorCode(error: unknown) {
	if (error instanceof ValidationError) return 'BAD_REQUEST'
	if (error instanceof NotFoundError) return 'NOT_FOUND'
	if (error instanceof ConflictError) return 'CONFLICT'
	return undefined
}

// Domain errors are written for the user, so they go out with their message and a matching
// code; a sign-in that can't be checked just now asks you to try again. Anything else stays
// INTERNAL_SERVER_ERROR, which onError in [[trpc]].ts hides.
const domainErrors = t.middleware(async ({ next }) => {
	const result = await next()
	if (result.ok) return result
	const { cause } = result.error
	if (cause instanceof SessionUnavailable) {
		console.warn('Sign-in not checked:', cause.message)
		throw new TRPCError({
			code: 'TIMEOUT',
			message: "Your sign-in couldn't be checked just now. Please try again.",
			cause,
		})
	}
	const code = domainErrorCode(cause)
	if (code) throw new TRPCError({ code, message: result.error.message, cause })
	return result
})

const router = t.router
const publicProcedure = t.procedure.use(domainErrors)
const secureProcedure = publicProcedure.use(signedIn)
const adminProcedure = publicProcedure.use(admin)
const accountProcedure = publicProcedure.use(account)

export {
	accountProcedure,
	adminProcedure,
	publicProcedure,
	router,
	secureProcedure,
	type Context,
	type schemas,
}
