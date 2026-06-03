import { type ComponentData } from '@/config/editor/editorComponents'
import {
	Node,
	NodeViewContent,
	NodeViewWrapper,
	VueNodeViewRenderer,
	mergeAttributes,
	nodeViewProps,
} from '@tiptap/vue-3'
import { defineComponent, h, onUnmounted, ref } from 'vue'

// Utility function to create a Tiptap node for Vue components
export function createVueNode(
	componentName: string,
	{
		component,
		content,
		props,
		contentAs,
		contenteditable = true,
		atom = false,
		decorative = false,
	}: ComponentData,
) {
	return Node.create({
		name: componentName,
		group: 'block',
		content,
		selectable: false,
		atom,

		addAttributes() {
			return {
				...props,
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
						const { editor } = props
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
							const selectionEl =
								view.nodeDOM(anchor) || view.nodeDOM(startPosition - 1)

							// selectionEl === wrapperEl when clicking the NodeView content with inline content
							if (
								selectionEl !== contentEl
								&& !contentEl.contains(selectionEl)
								&& selectionEl !== wrapperEl
							) {
								editor.off('selectionUpdate', onSelectionUpdate)
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
									ref: wrapperRef,
									onMousedown: (event: MouseEvent) => {
										const target = event.target as Element
										const wrapper = wrapperRef.value?.$el
										const content = wrapper?.querySelector(
											'[data-node-view-content]',
										)
										if (!wrapper || !content || content.contains(target)) return
										// Stop ProseMirror from processing this mousedown.
										// PM's own handler calls view.focus() for selectable nodes,
										// which on mobile focuses the contenteditable editor and
										// eventually opens the keyboard.
										event.stopPropagation()
									},
									// `decorative: true` opts the wrapper into contenteditable=false at rest
									// so non-editable Vue decorations can't have a cursor placed in them.
									// The focus toggle below flips it true while editing the content and
									// back to false when the selection leaves.
									//
									// FUTURE: replace this focus-based toggle with a `selectstart` listener
									// at the document level (flips this wrapper to contenteditable=true)
									// plus a `selectionchange` listener that flips back when the selection
									// collapses, and a `beforeinput` listener on the wrapper that
									// preventDefaults when the target ranges escape contentDOM.  That
									// would fix mobile cold-drag-in (focusin is reactive; selectstart
									// fires before the selection extends) without letting delete/paste/
									// type damage the decoration DOM during the transient editable window.
									...(decorative
										? {
												contenteditable: false,
												onFocusin: (event: FocusEvent) => {
													const target = event.target
													const wrapper = wrapperRef.value?.$el
													const content = wrapper?.querySelector(
														'[data-node-view-content]',
													)
													if (wrapper && content && content.contains(target)) {
														wrapper.setAttribute('contenteditable', 'true')
														editor.on('selectionUpdate', onSelectionUpdate)
													} else {
														wrapper.setAttribute('contenteditable', 'false')
														editor.off('selectionUpdate', onSelectionUpdate)
													}
												},
											}
										: {}),
								},
								{
									default: () => [
										h(
											component,
											{ ...props.node.attrs },
											{
												default: () =>
													h(NodeViewContent, {
														...(contentAs ? { as: contentAs } : {}),
														contenteditable,
														// makes sure the onfocus target is the content if clicked when contenteditable is already true
														tabindex: '-1',
													}),
											},
										),
									],
								},
							)
					},
				}),
			)
		},
	})
}
