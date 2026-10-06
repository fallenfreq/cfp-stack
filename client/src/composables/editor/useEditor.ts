import { Editor, type EditorOptions } from '@tiptap/vue-3'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

// An editor made and closed with its component: TipTap's useEditor, except that closing leaves a
// still copy of the page in the editor's box. TipTap's empties the box at once, so a sheet sliding
// away showed nothing; Vue removes the copy with the box.
export const useEditor = (options: Partial<EditorOptions> = {}) => {
	const editor = shallowRef<Editor>()
	onMounted(() => {
		editor.value = new Editor(options)
	})
	onBeforeUnmount(() => {
		const closing = editor.value
		if (!closing) return
		// Only an editor with a view has a page to copy (isDestroyed is also true without one).
		if (!closing.isDestroyed) {
			const page = closing.view.dom
			const still = page.cloneNode(true) as HTMLElement
			still.inert = true
			page.replaceWith(still)
		}
		closing.destroy()
	})
	return editor
}
