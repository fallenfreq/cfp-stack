import { Extension } from '@tiptap/vue-3'
import type { FloatingToolbarOptions } from './types'

export const FloatingToolbarExtension = Extension.create<FloatingToolbarOptions>({
	name: 'floatingToolbar',

	addOptions() {
		return { items: [] }
	},
})
