// composables/useNodeViewInteractions.ts
import { onMounted, onUnmounted } from 'vue'
import { type Editor } from '@tiptap/vue-3'

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

export function useNodeViewInteractions(editor: Editor | null) {
  const onSelectionChange = () => {
    if (!editor) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const isCollapsed = range.collapsed

    const caretPos = getNativeCaretPosition()
    if (!caretPos) return

    const p = posFromDomPos(editor, caretPos)
    if (!p) return

    const textNode = caretPos.node
    const nodeView = textNode.parentElement?.closest('[data-node-view-wrapper]')
    const contentEl = nodeView?.querySelector('[data-node-view-content]')
    if (!contentEl) return

    if (contentEl.contains(textNode)) {
      if (isCollapsed) {
        editor.commands.setTextSelection(p)
      }
    }
  }

  const onEditorSelectionUpdate = () => {
    if (!editor) return
    const { state } = editor
    const nodeType = state.doc.nodeAt(state.selection.anchor)?.type.name

    if (nodeType === 'text') {
      editor.commands.focus()
    }
  }

  const onEditorFocusIn = (event: FocusEvent) => {
    if (!editor) return
    const focusedElement = event.target as HTMLElement
    if (!focusedElement) return

    const nodeView = focusedElement.closest('[data-node-view-wrapper]')
    const contentEl = nodeView?.querySelector('[data-node-view-content]')

    if (nodeView && (!contentEl || !contentEl.contains(focusedElement))) {
      moveSelectionToNodeView(editor, nodeView)
    }
  }

  onMounted(() => {
    if (!editor) return

    document.addEventListener('selectionchange', onSelectionChange)
    editor.on('selectionUpdate', onEditorSelectionUpdate)
    editor.view.dom.addEventListener('focusin', onEditorFocusIn)
  })

  onUnmounted(() => {
    document.removeEventListener('selectionchange', onSelectionChange)
    editor?.off('selectionUpdate', onEditorSelectionUpdate)
    editor?.view.dom.removeEventListener('focusin', onEditorFocusIn)
  })
}
