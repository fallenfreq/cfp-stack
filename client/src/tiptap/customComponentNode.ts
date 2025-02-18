import {
  nodeViewProps,
  NodeViewContent,
  VueNodeViewRenderer,
  Node,
  mergeAttributes,
  NodeViewWrapper
} from '@tiptap/vue-3'
import { defineComponent, h } from 'vue'
import { type ComponentData } from './editorComponents'

// Utility function to create a Tiptap node for Vue components
export function createVueNode(
  componentName: string,
  { component, content, props, contentAs, contenteditable = true }: ComponentData
) {
  return Node.create({
    name: componentName,
    group: 'block', // Group for layout purposes
    content,
    selectable: true,
    atom: false, // Allow content inside the component (not atom)

    addAttributes() {
      return {
        ...props
      }
    },

    // Parse HTML to convert it into the node with attributes
    parseHTML() {
      return [{ tag: componentName }]
    },

    // Render HTML and allow content inside the component
    renderHTML({ HTMLAttributes }) {
      // '0' means content goes inside
      return [componentName, mergeAttributes(HTMLAttributes), 0]
    },

    // Add node view for rendering Vue components inside the editor
    addNodeView() {
      return VueNodeViewRenderer(
        defineComponent({
          props: nodeViewProps,
          setup(props) {
            return () =>
              // tabindex='-1' is required to make the none-editable node focusable for copying text
              h(
                NodeViewWrapper,
                { contenteditable: false, tabindex: '-1' },
                {
                  default: () => [
                    h(
                      component,
                      { ...props.node.attrs },
                      {
                        default: () =>
                          h(NodeViewContent, {
                            ...(contentAs ? { as: contentAs } : {}),
                            contenteditable
                          })
                      }
                    )
                  ]
                }
              )
          }
        }),
        {
          // stopEvent: (event) => {
          //   console.log('stopEvent: ', event)
          //   return true
          // }
        }
      )
    }
  })
}
