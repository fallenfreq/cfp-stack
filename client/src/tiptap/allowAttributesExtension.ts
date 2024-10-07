import { Extension } from '@tiptap/vue-3'
import { editorComponents } from './editorComponents'
const componentNodeTypes = Object.keys(editorComponents)

// List the nodes that you want to extend with `style` support
const nodesWithStyle = [
  'blockquote',
  'bulletList',
  'codeBlock',
  'document',
  'hardBreak',
  'heading',
  'horizontalRule',
  'listItem',
  'orderedList',
  'paragraph',
  // custom nodes
  'span'
]

const AllowAttributesExtension = Extension.create({
  addGlobalAttributes() {
    return [
      {
        types: [...nodesWithStyle, ...componentNodeTypes],
        attributes: {
          style: {
            default: null,
            // The values returned from parseHTML will be passed to renderHTML
            parseHTML: (element) => element.getAttribute('style'),
            renderHTML: (attributes) => {
              return { style: attributes.style }
            }
          },
          class: {
            default: null,
            parseHTML: (element) => element.classList.value || null,
            renderHTML: (attributes) => ({ class: attributes.class })
          },
          id: {
            default: null,
            parseHTML: (element) => element.getAttribute('id'),
            renderHTML: (attributes) => ({ id: attributes.id })
          }
        }
      }
    ]
  }
})

export { AllowAttributesExtension }
