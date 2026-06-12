import { blockItems } from './defaultItemsBlock'
import { mediaItems } from './defaultItemsMedia'
import { multiSelectItems } from './defaultItemsMultiSelect'
import { styleItems } from './defaultItemsStyle'

export const defaultToolbarItems = [
	...blockItems,
	...mediaItems,
	...styleItems,
	...multiSelectItems,
]
