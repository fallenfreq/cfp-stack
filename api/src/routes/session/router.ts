import { publicProcedure, router } from '../../config/trpc.js'

const sessionRouter = router({
	// Who you are, or null: public, as being signed out isn't an error (docs/auth.md, "Client").
	get: publicProcedure.query(async ({ ctx }) => {
		const user = await ctx.session.user()
		return user && { name: user.name, email: user.email, roles: user.roles }
	}),
})

export { sessionRouter }
