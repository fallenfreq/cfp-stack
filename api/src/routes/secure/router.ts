import { z } from 'zod'
import { router, secureProcedure } from '../../config/trpc.js'

const secureRouter = router({
	test: secureProcedure.input(z.string()).query(async (opt) => {
		console.log('opt.input:', opt.input)
		return { subject: opt.ctx.user.subject, input: opt.input }
	}),
})

export { secureRouter }
