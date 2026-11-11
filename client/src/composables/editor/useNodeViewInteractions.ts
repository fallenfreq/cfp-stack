import { useEditorStore } from '@/stores/editorStore'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

export function useNodeViewInteractions() {
	const editorStore = useEditorStore()
	const { editor } = storeToRefs(editorStore)

	const onEditorSelectionUpdate = () => {
		if (!editor.value) return
		const { state } = editor.value
		const nodeType = state.doc.nodeAt(state.selection.anchor)?.type.name

		if (nodeType === 'text') {
			editor.value.commands.focus()
		}
	}

	watch(
		editor,
		(current, _, onCleanup) => {
			if (!current) return
			current.on('selectionUpdate', onEditorSelectionUpdate)
			onCleanup(() => current.off('selectionUpdate', onEditorSelectionUpdate))
		},
		{ immediate: true },
	)
}
