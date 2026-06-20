import * as collectionEntry from './collectionEntry.js'
import * as layout from './layout.js'
import * as mapMarker from './mapMarker.js'
import * as page from './page.js'
import * as pageTag from './pageTag.js'
import * as tag from './tag.js'
import * as theme from './theme.js'
import * as user from './user.js'

const schemas = {
	...user,
	...mapMarker,
	...collectionEntry,
	...page,
	...tag,
	...pageTag,
	...theme,
	...layout,
}
export { schemas }
