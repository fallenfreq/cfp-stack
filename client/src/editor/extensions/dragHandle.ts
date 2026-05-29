import { type Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import { type EditorView } from '@tiptap/pm/view'
import { Extension } from '@tiptap/vue-3'
import './dragHandle.css'

const dragHandlePluginKey = new PluginKey<DragHandleState>('dragHandle')

interface DragHandleOptions {
	dragHandleClass: string
	shouldShowHandle: (node: ProseMirrorNode, depth: number) => boolean
}

interface DragHandleState {
	activePos: number | null
}

interface FadeLogic {
	handle: HTMLElement | null
	timer: ReturnType<typeof setTimeout> | null
	lock: () => void
	unlock: (view: EditorView) => void
	destroy: () => void
}

interface MatchResult {
	node: ProseMirrorNode
	pos: number
}

function findClosestDraggableParent(
	state: EditorView['state'],
	pos: number,
	options: DragHandleOptions,
): MatchResult | null {
	const $pos = state.doc.resolve(pos)

	// Atoms and non-editable NodeViews both resolve just *outside* the node via
	// posAtCoords (the browser can't place a cursor inside contenteditable=false).
	// posAtCoords therefore returns a position at the parent depth, causing the
	// depth walk to miss the node entirely.  Detect the node via $pos.nodeAfter /
	// $pos.nodeBefore before the walk fires and return it directly.
	// — Atoms (Image, HR…): always return regardless of activeDepth.
	// — Non-atom blocks (custom NodeViews with content): return only when
	//   shouldShowHandle approves the depth, so activeDepth is still respected.
	// Text nodes are isLeaf(→isAtom) but not draggable; hardBreak has
	// selectable:false — both excluded by the guards below.
	const adjacent = $pos.nodeAfter ?? $pos.nodeBefore
	if (adjacent && !adjacent.isText && adjacent.type.spec.selectable !== false) {
		const adjacentDepth = $pos.depth + 1
		if (adjacent.isAtom || options.shouldShowHandle(adjacent, adjacentDepth)) {
			const nodePos = $pos.nodeAfter ? pos : pos - adjacent.nodeSize
			return { node: adjacent, pos: nodePos }
		}
	}

	for (let depth = $pos.depth; depth >= 1; depth--) {
		const node = $pos.node(depth)
		if (node.type.spec.selectable === false) continue
		if (options.shouldShowHandle(node, depth)) {
			return { node, pos: $pos.before(depth) }
		}
	}

	return null
}

function findNodeDOM(view: EditorView, pos: number): HTMLElement | null {
	const nodeDOM = view.nodeDOM(pos)
	if (nodeDOM && nodeDOM.nodeType === Node.ELEMENT_NODE) {
		return nodeDOM as HTMLElement
	}
	return null
}

function positionHandle(view: EditorView, pos: number, handle: HTMLElement): void {
	const nodeDOM = findNodeDOM(view, pos)
	if (!nodeDOM) {
		handle.style.display = 'none'
		return
	}
	const nodeRect = nodeDOM.getBoundingClientRect()
	const editorRect = view.dom.getBoundingClientRect()
	handle.style.top = `${nodeRect.top - 2}px`
	handle.style.left = `${editorRect.left - 28}px`
	handle.style.display = 'flex'
}

function createEventHandlers(view: EditorView, handle: HTMLElement) {
	const mousedown = (_event: MouseEvent) => {
		if (view.composing) return
		const pos = dragHandlePluginKey.getState(view.state)?.activePos
		if (typeof pos !== 'number') return
		view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)))
	}

	const dragstart = (event: DragEvent) => {
		if (view.composing) return
		const pos = dragHandlePluginKey.getState(view.state)?.activePos
		if (typeof pos !== 'number') return

		view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)))

		const nodeDOM = findNodeDOM(view, pos)
		if (nodeDOM && event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move'
			event.dataTransfer.setDragImage(nodeDOM, 0, 0)
		}

		view.dragging = { slice: view.state.selection.content(), move: !event.altKey }
		handle.classList.add('dragging')
	}

	const dragend = () => {
		handle.classList.remove('dragging')
		// Clear drag state in case the drop landed outside the editor, where
		// ProseMirror's own dragend listener won't fire.
		view.dragging = null
	}

	return { mousedown, dragstart, dragend }
}

const DragHandle = Extension.create<DragHandleOptions>({
	name: 'dragHandle',

	addOptions() {
		return {
			dragHandleClass: 'drag-handle',
			shouldShowHandle: (node, depth) => depth === 1 && node.isBlock,
		}
	},

	addProseMirrorPlugins() {
		const options = this.options
		let rafPending = false

		const fadeLogic: FadeLogic = {
			handle: null,
			timer: null,

			lock() {
				if (this.timer) {
					clearTimeout(this.timer)
					this.timer = null
				}
				this.handle?.classList.remove('fading')
			},

			unlock(view) {
				if (this.timer) return
				this.handle?.classList.add('fading')

				this.timer = setTimeout(() => {
					view.dispatch(view.state.tr.setMeta('updateDragHandle', { action: 'remove' }))
					this.timer = null
				}, 2000)
			},

			destroy() {
				if (this.timer) {
					clearTimeout(this.timer)
					this.timer = null
				}
			},
		}

		return [
			new Plugin<DragHandleState>({
				key: dragHandlePluginKey,

				state: {
					init() {
						return { activePos: null }
					},

					apply(tr, prev) {
						const meta = tr.getMeta('updateDragHandle') as
							| { action: 'remove' }
							| { pos: number }
							| undefined

						if (meta && 'action' in meta && meta.action === 'remove') {
							return { activePos: null }
						}

						if (meta && 'pos' in meta) {
							return { activePos: meta.pos }
						}

						return {
							activePos:
								prev.activePos != null ? tr.mapping.map(prev.activePos) : null,
						}
					},
				},

				view(initialView) {
					let currentView = initialView

					const handle = document.createElement('div')
					handle.className = options.dragHandleClass
					handle.contentEditable = 'false'
					handle.draggable = true
					handle.innerHTML = `
						<svg width="10" height="16" viewBox="0 0 10 16">
							<circle cx="2" cy="2" r="1.5" fill="currentColor"/>
							<circle cx="2" cy="8" r="1.5" fill="currentColor"/>
							<circle cx="2" cy="14" r="1.5" fill="currentColor"/>
							<circle cx="8" cy="2" r="1.5" fill="currentColor"/>
							<circle cx="8" cy="8" r="1.5" fill="currentColor"/>
							<circle cx="8" cy="14" r="1.5" fill="currentColor"/>
						</svg>
					`
					document.body.appendChild(handle)
					fadeLogic.handle = handle

					const handlers = createEventHandlers(initialView, handle)
					handle.addEventListener('mousedown', handlers.mousedown)
					handle.addEventListener('dragstart', handlers.dragstart)
					handle.addEventListener('dragend', handlers.dragend)

					const mouseenter = () => fadeLogic.lock()
					const mouseleave = () => fadeLogic.unlock(currentView)
					handle.addEventListener('mouseenter', mouseenter)
					handle.addEventListener('mouseleave', mouseleave)

					const reposition = () => {
						const pos = dragHandlePluginKey.getState(currentView.state)?.activePos
						if (pos != null) positionHandle(currentView, pos, handle)
					}
					window.addEventListener('scroll', reposition, { capture: true, passive: true })
					window.addEventListener('resize', reposition, { passive: true })

					return {
						update(view, prevState) {
							currentView = view

							// Reposition the overlay whenever activePos changes
							const pos = dragHandlePluginKey.getState(view.state)?.activePos
							const prevPos = dragHandlePluginKey.getState(prevState)?.activePos
							if (pos !== prevPos) {
								if (pos != null) {
									positionHandle(view, pos, handle)
									handle.dataset.depth = String(
										view.state.doc.resolve(pos).depth + 1,
									)
								} else {
									handle.style.display = 'none'
									delete handle.dataset.depth
								}
							}

							// Selection-change: find and dispatch the new handle position
							if (view.state.selection.eq(prevState.selection)) return
							if (view.composing) return
							// Defer so the browser finishes cursor/focus handling before
							// dispatching.  Re-read state at fire time so stale captures
							// from rapid moves don't matter.
							requestAnimationFrame(() => {
								const { selection } = view.state
								// NodeSelection: use the selected node directly. The depth walk
								// fails for top-level nodes (anchor resolves at depth 0) and
								// returns the wrong node for nested ones.
								const match: MatchResult | null =
									selection instanceof NodeSelection
									&& selection.node.type.spec.selectable !== false
										? { node: selection.node, pos: selection.from }
										: findClosestDraggableParent(
												view.state,
												selection.anchor,
												options,
											)
								if (match) {
									fadeLogic.lock()
									const state = dragHandlePluginKey.getState(view.state)
									if (state?.activePos !== match.pos) {
										view.dispatch(
											view.state.tr.setMeta('updateDragHandle', {
												pos: match.pos,
											}),
										)
									}
								} else {
									fadeLogic.unlock(view)
								}
							})
						},

						destroy() {
							handle.removeEventListener('mousedown', handlers.mousedown)
							handle.removeEventListener('dragstart', handlers.dragstart)
							handle.removeEventListener('dragend', handlers.dragend)
							handle.removeEventListener('mouseenter', mouseenter)
							handle.removeEventListener('mouseleave', mouseleave)
							handle.remove()
							window.removeEventListener('scroll', reposition, { capture: true })
							window.removeEventListener('resize', reposition)
							fadeLogic.destroy()
						},
					}
				},

				props: {
					handleDOMEvents: {
						mousemove(view, event) {
							if (view.composing || !view.hasFocus()) return false
							// Touch-synthesised mousemove fires before mousedown commits the
							// cursor.  The rAF below can land between those two events and
							// position the handle while cursor placement is still pending,
							// which disrupts it.  The view() hook handles touch instead.
							const isTouch = (event as any).sourceCapabilities?.firesTouchEvents
							if (isTouch) return false

							if (rafPending) return false
							rafPending = true

							requestAnimationFrame(() => {
								rafPending = false

								const coords = view.posAtCoords({
									left: event.clientX,
									top: event.clientY,
								})
								const match = coords
									? findClosestDraggableParent(view.state, coords.pos, options)
									: null

								if (match) {
									fadeLogic.lock()
									const state = dragHandlePluginKey.getState(view.state)
									if (state?.activePos !== match.pos) {
										view.dispatch(
											view.state.tr.setMeta('updateDragHandle', {
												pos: match.pos,
											}),
										)
									}
								} else {
									fadeLogic.unlock(view)
								}
							})

							return false
						},

						mouseleave(view, event) {
							const to = (event as MouseEvent).relatedTarget as Element | null
							if (to?.closest('.node-path')) return false
							fadeLogic.unlock(view)
							return false
						},
					},
				},
			}),
		]
	},
})

export { DragHandle }
