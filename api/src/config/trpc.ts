import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'
import type { RequestSession } from '../auth/index.js'
import { SessionUnavailable } from '../auth/sessions.js'
import type { Db } from '../db.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'

interface Context {
	db: Db
	session: RequestSession
}

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	// No answer carries a stack trace: tRPC adds one unless NODE_ENV is 'production', which
	// Workers don't set.
	isDev: false,
	// Errors the user can act on go out with their message: domain errors (domainErrors
	// below), errors a route throws on purpose and tRPC's checks of the request. An input the
	// check refused also sends its issues, field by field (zodError), for the client to word.
	// Anything else is INTERNAL_SERVER_ERROR and says only "Internal Server Error"; onError in
	// [[trpc]].ts logs it in full.
	errorFormatter: ({ shape, error }) => ({
		...shape,
		message: error.code === 'INTERNAL_SERVER_ERROR' ? 'Internal Server Error' : shape.message,
		data: {
			...shape.data,
			zodError:
				error.code === 'BAD_REQUEST' && error.cause instanceof z.ZodError
					? z.flattenError(error.cause)
					: null,
		},
	}),
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
// INTERNAL_SERVER_ERROR, which the errorFormatter above hides.
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

export { accountProcedure, adminProcedure, publicProcedure, router, secureProcedure, type Context }
