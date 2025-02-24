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
  { component, content, props, contentAs, contenteditable = true, atom = false }: ComponentData
) {
  return Node.create({
    name: componentName,
    group: 'block',
    content,
    selectable: true,
    atom,

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
            const wrapperRef = ref<typeof NodeViewWrapper | null>(null)

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
              // selectionEl === wrapperEl when clicking the NodeView content with inline content
              if (
                !(
                  selectionEl === contentEl ||
                  contentEl.contains(selectionEl) ||
                  selectionEl === wrapperEl
                )
              ) {
                editor.off('selectionUpdate', onSelectionUpdate) // Remove the listener
                wrapperEl.setAttribute('contenteditable', 'false')
              }
            }

            onUnmounted(() => {
              editor.off('selectionUpdate', onSelectionUpdate)
            })

            return () =>
              h(
                NodeViewWrapper,
                {
                  // tabindex='-1' is required to make the none-editable node focusable for copying text
                  tabindex: '-1',
                  contenteditable: false,
                  ref: wrapperRef,
                  onFocusin: (event: FocusEvent) => {
                    const target = event.target
                    const wrapper = wrapperRef.value?.$el
                    const content = wrapper?.querySelector('[data-node-view-content]')
                    // If the focus was inside NodeViewContent, enable editing
                    if (wrapper && content && content.contains(target)) {
                      // Manages focus transitions within the NodeView. The `selectionUpdate` event, set up in the editor,
                      // is used to reset the editor state when focus leaves the NodeView.  Focus changes within the
                      // editable content of the NodeView are handled by the `onFocusin` handler.
                      wrapper.setAttribute('contenteditable', 'true')
                      editor.on('selectionUpdate', onSelectionUpdate)
                    } else {
                      wrapper.setAttribute('contenteditable', 'false')
                      editor.off('selectionUpdate', onSelectionUpdate)
                    }
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
