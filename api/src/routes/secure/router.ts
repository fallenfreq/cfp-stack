import { z } from 'zod'
import { router, secureProcedure } from '../../config/trpc.js'

const secureRouter = router({
	test: secureProcedure.input(z.string()).query(async (opt) => {
		console.log('opt.input:', opt.input)
		return { secure: opt.ctx.secure, input: opt.input }
	}),
})

export { secureRouter }
