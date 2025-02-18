import { type Editor } from '@tiptap/vue-3'

const focusToSelect = (editor: Editor) => {
  editor.view.dom.addEventListener('focusin', (event) => {
    const { view } = editor

    const focusedElement = event.target as HTMLElement
    if (!focusedElement) return

    // Only find the closest node-view-wrapper view if the focused element is not the nodes content
    if (focusedElement.hasAttribute('data-node-view-content')) {
      const pos = view.posAtDOM(focusedElement, 0)
      // Plus 2, 1 is used to get the next node and 1 to get the next node's content
      // This needs to be done because of the way contenteditable and tabindex: '-1' are used in the node view
      editor.commands.setTextSelection(pos + 2)
      return
    }

    const nodeView = focusedElement.closest('[data-node-view-wrapper]')
    if (!nodeView) return

    const parentNode = nodeView.parentElement
    if (!parentNode) return

    const childIndex = [...parentNode.children].indexOf(nodeView)
    if (childIndex === -1) return

    const pos = view.posAtDOM(parentNode, childIndex)
    if (pos == null) return

    editor.commands.setTextSelection(pos)
  })
}

export { focusToSelect }
