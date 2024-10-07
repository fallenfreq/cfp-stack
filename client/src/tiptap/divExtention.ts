import { Node } from '@tiptap/vue-3'

const Div = Node.create({
  name: 'div',
  inline: false,
  group: 'block',
  content: 'block*',
  addAttributes() {
    return {}
  },
  // https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#render-html
  parseHTML() {
    return [{ tag: 'div' }]
  },
  renderHTML({ HTMLAttributes }) {
    // The last elements in the array are the children and 0 is the default content
    return ['div', { ...HTMLAttributes }, 0]
  }
})

export default Div
