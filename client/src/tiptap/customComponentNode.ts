import {
  nodeViewProps,
  NodeViewContent,
  VueNodeViewRenderer,
  Node,
  mergeAttributes,
  NodeViewWrapper
} from '@tiptap/vue-3'
import { defineComponent, h, onUnmounted, ref } from 'vue'
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
            const { editor, node } = props
            const wrapperRef = ref<typeof NodeViewWrapper | null>(null) // Store wrapper reference

            const onSelectionUpdate = () => {
              const { state, view } = editor
              const selection = state.selection
              const { anchor } = selection
              const wrapperEl = wrapperRef.value?.$el
              const contentEl = wrapperEl?.querySelector('[data-node-view-content]')
              if (!wrapperEl || !contentEl) return

              const resolvedPos = state.doc.resolve(anchor)
              const startPosition = resolvedPos.start(resolvedPos.depth)
              const selectionEl = view.nodeDOM(anchor) || view.nodeDOM(startPosition - 1)

              // if the selectionEl is not the contentEl and not inside the contentEl, disable editing
              if (!(selectionEl === contentEl || contentEl.contains(selectionEl))) {
                editor.off('selectionUpdate', onSelectionUpdate) // Remove the listener
                wrapperEl.setAttribute('contenteditable', 'false')
              }
            }

            onUnmounted(() => {
              editor.off('selectionUpdate')
            })

            return () =>
              h(
                NodeViewWrapper,
                {
                  contenteditable: false,
                  // tabindex='-1' is required to make the none-editable node focusable for copying text
                  tabindex: '-1',
                  ref: wrapperRef,
                  onFocusin: (event: FocusEvent) => {
                    const target = event.target
                    const wrapper = wrapperRef.value?.$el
                    const content = wrapper?.querySelector('[data-node-view-content]')
                    // If the focus was inside NodeViewContent, enable editing
                    if (wrapper && content && content.contains(target)) {
                      // This transfers control to the editor so selectionUpdate event in setup is used to reset on
                      // focus out of the NodeView. Focus out of content - yet still in nodeView - is handled in onFocusin still
                      wrapper.setAttribute('contenteditable', 'true')
                      editor.on('selectionUpdate', onSelectionUpdate) // Attach listener
                    } else {
                      wrapper.setAttribute('contenteditable', 'false')
                      editor.off('selectionUpdate', onSelectionUpdate) // Remove the listener
                    }
                  },
                  onFocus: (event: any) => {
                    console.log('onfocus of wrapper', event)
                  }
                },
                {
                  default: () => [
                    h(
                      component,
                      { ...node.attrs },
                      {
                        default: () =>
                          h(NodeViewContent, {
                            ...(contentAs ? { as: contentAs } : {}),
                            contenteditable,
                            // makes sure the onfocus target is the content if clicked when contenteditable is already true
                            tabindex: '-1'
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
          //   return false
          // }
        }
      )
    }
  })
}
