import { type ComponentData } from '@/config/editor/editorComponents'
import {
	Node,
	NodeViewContent,
	VueNodeViewRenderer,
	mergeAttributes,
	nodeViewProps,
} from '@tiptap/vue-3'
import { defineComponent, h, onMounted, onUnmounted, ref } from 'vue'

// Utility function to create a Tiptap node for Vue components
export function createVueNode({
	uuid,
	alias,
	component,
	content,
	props,
	contentAs,
	contenteditable = true,
	atom = false,
}: ComponentData) {
	return Node.create({
		name: uuid,
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
			return [{ tag: alias }]
		},

		// Render HTML and allow content inside the component
		renderHTML({ HTMLAttributes }) {
			// '0' means content goes inside
			return [alias, mergeAttributes(HTMLAttributes), 0]
		},

		// Add node view for rendering Vue components inside the editor
		addNodeView() {
			return VueNodeViewRenderer(
				defineComponent({
					props: nodeViewProps,
					setup(props) {
						const { editor } = props
						const boxRef = ref<{ $el: HTMLElement } | null>(null)

						// The block's own parts: all its component draws beside its slot (headings, text,
						// buttons). They aren't editable; the box and slot belong to the editor, so the slot
						// edits like the page. Found and marked when the block appears and when they change;
						// a layout, which draws only a box around its slot, has none.
						let ownParts = false
						const markOwnParts = () => {
							const boxEl = boxRef.value?.$el as HTMLElement | undefined
							const contentEl = boxEl?.querySelector('[data-node-view-content]')
							if (!boxEl || !contentEl) return
							let found = false
							const mark = (el: Element) => {
								for (const child of el.childNodes) {
									if (child === contentEl) continue
									if (child instanceof Text) found ||= !!child.data.trim()
									else if (!(child instanceof Element)) continue
									else if (child.contains(contentEl)) mark(child)
									else {
										found = true
										// A part the component makes editable itself (a field of its own) stays so.
										if (!child.hasAttribute('contenteditable'))
											child.setAttribute('contenteditable', 'false')
									}
								}
							}
							mark(boxEl)
							ownParts = found
						}

						// While you work with the block's own parts the whole box is locked: a drag runs across
						// them like page text (text beside the slot too), and typing does nothing. A press in the
						// slot or the cursor leaving this whole block unlocks it, even once the parts are gone.
						const setLocked = (locked: boolean) => {
							const boxEl = boxRef.value?.$el as HTMLElement | undefined
							if (!boxEl) return
							if (locked && editor.isEditable)
								boxEl.setAttribute('contenteditable', 'false')
							else boxEl.removeAttribute('contenteditable')
						}
						const isLocked = () =>
							boxRef.value?.$el?.getAttribute('contenteditable') === 'false'
						const wholeBlockSelected = () => {
							const pos = props.getPos()
							const { from, to } = editor.state.selection
							return (
								typeof pos === 'number'
								&& from === pos
								&& to === pos + props.node.nodeSize
							)
						}
						const unlockOffBlock = () => {
							if (isLocked() && !wholeBlockSelected()) setLocked(false)
						}
						// In the locked box, copy, cut and paste reach the editor only for the selected block you
						// see; otherwise copying words highlighted in its own parts is the browser's and cut and
						// paste do nothing, as on a page. A text box or field of the component's keeps its own.
						const leaveToBrowser = (event: ClipboardEvent) => {
							const boxEl = boxRef.value?.$el as HTMLElement | undefined
							if (!boxEl || !isLocked()) return
							const target = event.target as HTMLElement
							if (target !== boxEl && target.isContentEditable) return
							if (target.closest('input, textarea, select')) return
							const contentEl = boxEl.querySelector('[data-node-view-content]')
							const selection = window.getSelection()
							const from =
								selection?.isCollapsed === false ? selection.anchorNode : null
							const highlightedHere =
								!!from && boxEl.contains(from) && !contentEl?.contains(from)
							if (!highlightedHere && wholeBlockSelected()) return
							event.stopPropagation()
							if (event.type !== 'copy') event.preventDefault()
						}

						// Where the last press began: a click that ends a drag isn't a click on the block. A
						// touch that moves selects or scrolls without a click, so a tap may wobble.
						let pressedAt: { x: number; y: number; touch: boolean } | null = null

						let observer: MutationObserver | undefined
						onMounted(() => {
							markOwnParts()
							// Changes inside the slot are the page's, not the component's.
							observer = new MutationObserver((records) => {
								const contentEl = boxRef.value?.$el?.querySelector(
									'[data-node-view-content]',
								)
								if (records.some((record) => !contentEl?.contains(record.target)))
									markOwnParts()
							})
							observer.observe(boxRef.value!.$el, {
								childList: true,
								characterData: true,
								subtree: true,
							})
						})
						editor.on('selectionUpdate', unlockOffBlock)
						onUnmounted(() => {
							observer?.disconnect()
							editor.off('selectionUpdate', unlockOffBlock)
						})

						// The component's own box is the block's box, as a plain block is one box. It wears
						// TipTap's marker, and draws the editor's classes on the block (its decorations) and
						// the selection outline, which ProseMirror and TipTap add by hand and a redraw removes.
						return () =>
							h(
								component,
								{
									...props.node.attrs,
									'data-node-view-wrapper': '',
									class: [
										props.node.attrs.class,
										...props.decorations.map((d) => d.type.attrs.class),
										{ 'ProseMirror-selectednode': props.selected },
									],
									// Focusable, so a press on the block's own parts puts focus on its locked box,
									// where typing does nothing.
									tabindex: '-1',
									ref: boxRef,
									// Tap outside the editable content selects the whole node so the
									// floating toolbar and drag handle position over it.  Works even
									// with selectable:false — NodeSelection.create does not enforce
									// the selectable flag (only Selection.near / drag-select paths do).
									// The click's path, not its target: a button of the block's own may be gone
									// from the page by now (redrawn by its own click).
									onClick: (event: MouseEvent) => {
										const box = boxRef.value?.$el
										const content = box?.querySelector(
											'[data-node-view-content]',
										)
										const from = pressedAt
										pressedAt = null
										if (
											!box
											|| !content
											|| event.composedPath().includes(content)
										)
											return
										if (props.selected) return
										const dragged =
											from
											&& !from.touch
											&& Math.hypot(
												event.clientX - from.x,
												event.clientY - from.y,
											) > 4
										if (dragged) return
										const pos = props.getPos()
										if (typeof pos === 'number') {
											props.editor.commands.setNodeSelection(pos)
										}
									},
									// A press (pointerdown: a phone's touch sends it at once, mousedown only once
									// lifted) in the slot unlocks the box; one on the block's own parts locks it
									// before the browser starts a selection.
									onPointerdown: (event: PointerEvent) => {
										pressedAt = {
											x: event.clientX,
											y: event.clientY,
											touch: event.pointerType === 'touch',
										}
										const box = boxRef.value?.$el as HTMLElement | undefined
										const content = box?.querySelector(
											'[data-node-view-content]',
										)
										if (!box || !content) return
										const onOwnParts =
											ownParts && !content.contains(event.target as Element)
										setLocked(onOwnParts)
										// A pressed button takes no focus in Safari, which then types where the page's
										// last caret was: drop a caret left outside the block (text pressed sets anew).
										const selection = window.getSelection()
										const caret = selection?.anchorNode
										if (onOwnParts && caret && !box.contains(caret))
											selection.removeAllRanges()
									},
									// A press on the block's own parts stops at the block; the editor ignores it in
									// any case (TipTap's stopEvent).
									onMousedown: (event: MouseEvent) => {
										if (!ownParts) return
										const target = event.target as Element
										const box = boxRef.value?.$el
										const content = box?.querySelector(
											'[data-node-view-content]',
										)
										if (!box || !content || content.contains(target)) return
										event.stopPropagation()
									},
									onCopy: leaveToBrowser,
									onCut: leaveToBrowser,
									onPaste: leaveToBrowser,
								},
								{
									default: () =>
										h(NodeViewContent, {
											...(contentAs ? { as: contentAs } : {}),
											contenteditable: props.editor.isEditable
												? contenteditable
												: false,
											// makes sure the onfocus target is the content if clicked when contenteditable is already true
											tabindex: '-1',
										}),
								},
							)
					},
				}),
				{
					// A redraw for every change, decorations too: TipTap passes on new decorations only
					// when the block itself changes, and the box draws them.
					update: ({ oldNode, newNode, updateProps }) => {
						if (newNode.type !== oldNode.type) return false
						updateProps()
						return true
					},
				},
			)
		},
	})
}
