import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { AccountChange } from '../../auth/provider.js'
import { signedInRecently } from '../../auth/sessions.js'
import { accountProcedure, router } from '../../config/trpc.js'

// Your account at the provider, changed through our server (docs/auth.md, "Adding account
// features"). Your user comes from the session, never from input.

const profileChanges = z.object({
	firstName: z.string().trim().min(1).max(200),
	lastName: z.string().trim().min(1).max(200),
	displayName: z.string().trim().max(200),
	nickname: z.string().trim().max(200),
	language: z.string().max(10),
	gender: z.enum(['female', 'male', 'diverse']).nullable(),
})

// The provider didn't accept the input: said to you as `refusal`, which the page shows as it is.
function done(change: AccountChange, refusal: string) {
	if (change === 'refused')
		throw new TRPCError({ code: 'UNPROCESSABLE_CONTENT', message: refusal })
}

const accountRouter = router({
	profile: accountProcedure.query(({ ctx }) => ctx.account.profile()),

	updateProfile: accountProcedure
		.input(profileChanges)
		.mutation(async ({ ctx, input }) =>
			done(
				await ctx.account.updateProfile(input),
				"Your profile wasn't saved: check its fields.",
			),
		),

	// Whoever changes the email can take over the account, so it needs a recent sign-in.
	changeEmail: accountProcedure
		.input(z.object({ email: z.string().trim().email().max(200) }))
		.mutation(async ({ ctx, input }) => {
			if (!signedInRecently(ctx.user))
				throw new TRPCError({
					code: 'PRECONDITION_FAILED',
					message: 'Confirm it’s you to change your email.',
				})
			done(await ctx.account.changeEmail(input.email), "That email address can't be used.")
		}),

	resendEmailCode: accountProcedure.mutation(async ({ ctx }) =>
		done(await ctx.account.resendEmailCode(), "The code wasn't sent. Please try again."),
	),

	verifyEmail: accountProcedure
		.input(z.object({ code: z.string().trim().min(1).max(20) }))
		.mutation(async ({ ctx, input }) =>
			done(
				await ctx.account.verifyEmail(input.code),
				'Invalid or expired code. Please check and try again.',
			),
		),
})

export { accountRouter }
