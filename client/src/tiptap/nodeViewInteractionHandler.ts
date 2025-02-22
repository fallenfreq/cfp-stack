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
  // TextSelection endpoint not pointing into a node with inline content (doc)
  // Technically an error but this is doing what we want because of how the nave positions itself
  editor.commands.setTextSelection(pos)
}

const nodeViewInteractionHandler = (editor: Editor) => {
  const onSelectionChange = () => {
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
    // This will not cover all cases like the focusin event can
    // else if (nodeView) {
    //   moveSelectionToNodeView(editor, nodeView)
    // }
  }

  document.addEventListener('selectionchange', onSelectionChange)

  editor.on('selectionUpdate', () => {
    const { state } = editor
    const nodeType = state.doc.nodeAt(state.selection.anchor)?.type.name

    if (nodeType === 'text') {
      editor.commands.focus()
    }
  })

  // Can we find a more performant way to do this?
  // focusin fires a lot and we only need it when focusing in a nodeView, not in content and not a text node
  // or we just use this and not the moveSelectionToNodeView onSelectionChange
  editor.view.dom.addEventListener('focusin', (event) => {
    const focusedElement = event.target as HTMLElement
    if (!focusedElement) return

    // Check if the focused element is inside a node-view-wrapper but NOT in its content
    const nodeView = focusedElement.closest('[data-node-view-wrapper]')
    const contentEl = nodeView?.querySelector('[data-node-view-content]')

    if (nodeView && (!contentEl || !contentEl.contains(focusedElement))) {
      moveSelectionToNodeView(editor, nodeView)
    }
  })

  return () => document.removeEventListener('selectionchange', onSelectionChange)
}

export { nodeViewInteractionHandler }
