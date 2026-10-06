import { Plugin } from '@tiptap/pm/state'
import { Extension } from '@tiptap/vue-3'
import type { FloatingToolbarOptions } from './types'

export const FloatingToolbarExtension = Extension.create<FloatingToolbarOptions>({
	name: 'floatingToolbar',

	addOptions() {
		return { items: [] }
	},

	// The page makes room at its top for the toolbar (FloatingToolbar.vue's styles). The editor
	// carries the class, so it comes and goes with the editor.
	addProseMirrorPlugins() {
		return [new Plugin({ props: { attributes: { class: 'has-floating-toolbar' } } })]
	},
})
