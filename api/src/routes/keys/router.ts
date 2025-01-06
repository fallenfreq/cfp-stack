import { secureProcedure, router } from '../../config/trpc.js'
import { getEnv } from '../../config/envs.js'

const keysRouter = router({
  googleMapsApiKey: secureProcedure.query(async () => {
    return getEnv('GOOGLE_MAPS_API_KEY')
  })
})

export { keysRouter }
