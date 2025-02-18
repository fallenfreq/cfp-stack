import { Node } from '@tiptap/vue-3'

const Div = Node.create({
  name: 'div',
  inline: false,
  group: 'block',
  // when content is set, clicking a div will select the content istead of the div
  content: 'block*',
  selectable: true,
  draggable: true,
  addAttributes() {
    return { 'data-container': { default: '' } }
  },
  // https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#render-html
  parseHTML() {
    return [{ tag: 'div[data-container]' }]
  },
  renderHTML({ HTMLAttributes }) {
    // The last elements in the array are the children and 0 is the default content
    return ['div', { ...HTMLAttributes }, 0]
  }
})

export default Div
