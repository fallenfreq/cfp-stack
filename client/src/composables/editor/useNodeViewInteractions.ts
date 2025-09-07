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
		position: { node: globalThis.Node; offset: number } | null
	) => {
		if (!position) return
		const { node, offset } = position
		return editor.view?.posAtDOM(node, offset)
	}

	const moveSelectionToNodeView = (editor: Editor, nodeView: Element) => {
		const parentNode = nodeView.parentElement
		if (!parentNode) return

		const childIndex = [...parentNode.children].indexOf(nodeView)
		if (childIndex === -1) return

		const pos = editor.view.posAtDOM(parentNode, childIndex)
		if (pos == null) return

		editor.commands.setTextSelection(pos)
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

	const onEditorFocusIn = (event: FocusEvent) => {
		if (!editor.value) return
		const focusedElement = event.target as HTMLElement
		if (!focusedElement) return

		const nodeView = focusedElement.closest('[data-node-view-wrapper]')
		const contentEl = nodeView?.querySelector('[data-node-view-content]')

		if (nodeView && (!contentEl || !contentEl.contains(focusedElement))) {
			moveSelectionToNodeView(editor.value, nodeView)
		}
	}

	watch(
		editor,
		(newEditor, oldEditor) => {
			if (oldEditor) {
				oldEditor.off('selectionUpdate', onEditorSelectionUpdate)
				oldEditor.view.dom.removeEventListener('focusin', onEditorFocusIn)
			}
			if (newEditor) {
				newEditor.on('selectionUpdate', onEditorSelectionUpdate)
				newEditor.view.dom.addEventListener('focusin', onEditorFocusIn)
			}
		},
		{ immediate: true }
	)

	onMounted(() => {
		document.addEventListener('selectionchange', onSelectionChange)
	})

	onBeforeUnmount(() => {
		document.removeEventListener('selectionchange', onSelectionChange)

		if (editor.value) {
			editor.value.off('selectionUpdate', onEditorSelectionUpdate)
			editor.value.view.dom.removeEventListener('focusin', onEditorFocusIn)
		}
	})
}
