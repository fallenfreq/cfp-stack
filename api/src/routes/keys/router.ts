import { getEnv } from '../../config/envs.js'
import { router, secureProcedure } from '../../config/trpc.js'

const keysRouter = router({
	googleMapsApiKey: secureProcedure.query(async () => {
		return getEnv('GOOGLE_MAPS_API_KEY')
	}),
})

export { keysRouter }
