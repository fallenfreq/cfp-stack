import { Node } from '@tiptap/vue-3'

// Todo: Make the div selectable so when we click it, "selection.anchor" can be used to get div dom element
const Div = Node.create({
  name: 'div',
  inline: false,
  group: 'block',
  content: 'block*',
  draggable: true,
  selectable: true,
  addAttributes() {
    return {}
  },
  // https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#render-html
  parseHTML() {
    return [
      {
        tag: 'div',
        getAttrs: (node) => {
          // ProseMirror expects null or undefined if the check is successful.
          return node.getAttribute('data-youtube-video') !== '' && null
        }
      }
    ]
  },
  renderHTML({ HTMLAttributes }) {
    // The last elements in the array are the children and 0 is the default content
    return ['div', { ...HTMLAttributes }, 0]
  }
})

export default Div
