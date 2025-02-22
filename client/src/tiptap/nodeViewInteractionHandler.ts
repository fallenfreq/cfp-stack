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
  return editor.view?.posAtDOM(node, offset) // Converts DOM node to ProseMirror position
}
const nodeViewInteractionHandler = (editor: Editor) => {
  const onSelectionChange = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const isCollapsed = range.collapsed // True if it's just a caret, false if there's a selection range

    const caretPos = getNativeCaretPosition()
    if (!caretPos) return

    const p = posFromDomPos(editor, caretPos)
    if (!p) return

    const textNode = caretPos.node
    const nodeView = textNode.parentElement?.closest('[data-node-view-wrapper]')
    const contentEl = nodeView?.querySelector('[data-node-view-content]')

    if (!contentEl) return

    if (contentEl.contains(textNode)) {
      // Only update if there's no range selection, to avoid overriding it
      if (isCollapsed) {
        editor.commands.setTextSelection(p)
      }
    } else if (nodeView) {
      const parentNode = nodeView.parentElement
      if (!parentNode) return

      const childIndex = [...parentNode.children].indexOf(nodeView)
      if (childIndex === -1) return

      const pos = editor.view.posAtDOM(parentNode, childIndex)
      if (pos == null) return
      // TextSelection endpoint not pointing into a node with inline content (doc)
      // Technically an error but this is doing what we want because of how the nave positions itself
      editor.commands.setTextSelection(pos)
    }
  }

  document.addEventListener('selectionchange', onSelectionChange)

  editor.on('selectionUpdate', () => {
    const { state } = editor
    const nodeType = state.doc.nodeAt(state.selection.anchor)?.type.name

    if (nodeType === 'text') {
      editor.commands.focus()
    }
  })

  return () => document.removeEventListener('selectionchange', onSelectionChange)
}

export { nodeViewInteractionHandler }
