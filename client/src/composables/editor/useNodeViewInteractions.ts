import { useEditorStore } from '@/stores/editorStore'
import { type Editor } from '@tiptap/vue-3'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, watch } from 'vue'

export function useNodeViewInteractions() {
	const editorStore = useEditorStore()
	const { editor } = storeToRefs(editorStore)

	const getNativeCaretPosition = () => {
		const selection = window.getSelection()
		if (!selection || selection.rangeCount === 0) return null

		const range = selection.getRangeAt(0)
		return { node: range.startContainer as globalThis.Node, offset: range.startOffset }
	}

	const posFromDomPos = (
		editor: Editor,
		position: { node: globalThis.Node; offset: number } | null,
	) => {
		if (!position) return
		const { node, offset } = position
		return editor.view?.posAtDOM(node, offset)
	}

	const onSelectionChange = () => {
		if (!editor.value) return
		const selection = window.getSelection()
		if (!selection || selection.rangeCount === 0) return

		const range = selection.getRangeAt(0)
		const isCollapsed = range.collapsed

		const caretPos = getNativeCaretPosition()
		if (!caretPos) return

		const p = posFromDomPos(editor.value, caretPos)
		if (!p) return

		const textNode = caretPos.node
		const nodeView = textNode.parentElement?.closest('[data-node-view-wrapper]')
		const contentEl = nodeView?.querySelector('[data-node-view-content]')
		if (!contentEl) return

		if (contentEl.contains(textNode) && isCollapsed) {
			editor.value.commands.setTextSelection(p)
		}
	}

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

	onMounted(() => {
		document.addEventListener('selectionchange', onSelectionChange)
	})

	onBeforeUnmount(() => {
		document.removeEventListener('selectionchange', onSelectionChange)
	})
}
