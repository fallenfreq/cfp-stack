import { useEditorStore } from '@/stores/editorStore'
import type { Editor } from '@tiptap/vue-3'
import { onUnmounted, watch } from 'vue'

export function useEditorReady(callback: (editor: Editor) => void) {
	const store = useEditorStore()
	if (store.editor) {
		callback(store.editor)
		return
	}
	const stop = watch(
		() => store.editor,
		(e) => {
			if (e) {
				stop()
				callback(e)
			}
		},
	)
	onUnmounted(stop)
}
