import * as collectionEntry from './collectionEntry.js'
import * as mapMarker from './mapMarker.js'
import * as user from './user.js'

const schemas = { ...user, ...mapMarker, ...collectionEntry }
export { schemas }
