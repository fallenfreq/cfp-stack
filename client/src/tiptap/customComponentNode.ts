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
      return [componentName, mergeAttributes(HTMLAttributes)]
    },

    // Add node view for rendering Vue components inside the editor
    addNodeView() {
      return VueNodeViewRenderer(
        defineComponent({
          props: nodeViewProps,
          setup(props) {
            return () =>
              h(NodeViewWrapper, { contenteditable }, [
                h(component, props.node.attrs, {
                  default: () => h(NodeViewContent, { ...(contentAs ? { as: contentAs } : {}) })
                })
              ])
          }
        })
      )
    }
  })
}
