import { Fragment, Slice, type Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { type EditorView } from '@tiptap/pm/view'
import { Extension } from '@tiptap/vue-3'
import './dragHandle.css'

const dragHandlePluginKey = new PluginKey<DragHandleState>('dragHandle')

interface DragHandleOptions {
	dragHandleClass: string
	shouldShowHandle: (node: ProseMirrorNode, depth: number) => boolean
	buildDragSlice?: (
		view: EditorView,
		pos: number,
		event: DragEvent,
	) => { slice: Slice; move: boolean } | null
}

interface DragHandleState {
	activePos: number | null
	forceRefresh: boolean
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

const HANDLE_SIZE = 24
const HANDLE_GAP = 4
const HOVER_UPDATE_DELAY = 300

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
	// !isText excludes text nodes; the second clause keeps hardBreak (inline,
	// selectable:false) out while allowing our block-level selectable:false
	// nodes (custom Vue nodes, taskItem) and selectable atoms (image) through.
	if (
		adjacent
		&& !adjacent.isText
		&& (adjacent.isBlock || adjacent.type.spec.selectable !== false)
	) {
		const adjacentDepth = $pos.depth + 1
		if (adjacent.isAtom || options.shouldShowHandle(adjacent, adjacentDepth)) {
			const nodePos = $pos.nodeAfter ? pos : pos - adjacent.nodeSize
			return { node: adjacent, pos: nodePos }
		}
	}

	for (let depth = $pos.depth; depth >= 1; depth--) {
		const node = $pos.node(depth)
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
	const gutterLeft = editorRect.left - HANDLE_SIZE - HANDLE_GAP
	const nodeLeft = nodeRect.left - HANDLE_SIZE - HANDLE_GAP
	handle.style.top = `${nodeRect.top - 2}px`
	handle.style.left = `${Math.max(gutterLeft, nodeLeft)}px`
	handle.style.display = 'flex'
}

// NodeSelection.create throws on selectable:false nodes.  Span the node with a
// TextSelection instead so view.state.selection.content() still yields a slice
// containing the node for drag-and-drop.
function selectNodeForDrag(view: EditorView, pos: number): void {
	const node = view.state.doc.nodeAt(pos)
	if (!node) return
	const selection =
		node.type.spec.selectable === false
			? TextSelection.create(view.state.doc, pos, pos + node.nodeSize)
			: NodeSelection.create(view.state.doc, pos)
	view.dispatch(view.state.tr.setSelection(selection))
}

function createEventHandlers(view: EditorView, handle: HTMLElement, options: DragHandleOptions) {
	const mousedown = (_event: MouseEvent) => {
		if (view.composing) return
		const pos = dragHandlePluginKey.getState(view.state)?.activePos
		if (typeof pos !== 'number') return
		selectNodeForDrag(view, pos)
	}

	const dragstart = (event: DragEvent) => {
		if (view.composing) return
		const pos = dragHandlePluginKey.getState(view.state)?.activePos
		if (typeof pos !== 'number') return

		const nodeDOM = findNodeDOM(view, pos)
		if (nodeDOM && event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move'
			event.dataTransfer.setDragImage(nodeDOM, 0, 0)
		}

		const custom = options.buildDragSlice?.(view, pos, event)
		if (custom) {
			view.dragging = custom
		} else {
			selectNodeForDrag(view, pos)
			const node = view.state.doc.nodeAt(pos)
			// TextSelection.content() opens the slice at the parent boundary, so
			// PM can't re-insert the dragged node cleanly.  Build the slice the
			// way NodeSelection.content() does it internally.
			const slice =
				node && node.type.spec.selectable === false
					? new Slice(Fragment.from(node), 0, 0)
					: view.state.selection.content()
			view.dragging = { slice, move: !event.altKey }
		}

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
		let isPointerOverHandle = false
		let hoverUpdateTimer: ReturnType<typeof setTimeout> | null = null
		let pendingHoverCoords: { left: number; top: number } | null = null

		const clearHoverUpdateTimer = () => {
			if (!hoverUpdateTimer) return
			clearTimeout(hoverUpdateTimer)
			hoverUpdateTimer = null
		}

		const queueHoverUpdate = (view: EditorView) => {
			if (hoverUpdateTimer) return

			hoverUpdateTimer = setTimeout(() => {
				hoverUpdateTimer = null
				if (isPointerOverHandle) return

				const coords = pendingHoverCoords
				pendingHoverCoords = null
				if (!coords) return

				const pos = view.posAtCoords(coords)
				const match = pos ? findClosestDraggableParent(view.state, pos.pos, options) : null

				if (match) {
					fadeLogic.lock()
					const state = dragHandlePluginKey.getState(view.state)
					if (state?.activePos !== match.pos) {
						view.dispatch(view.state.tr.setMeta('updateDragHandle', { pos: match.pos }))
					}
				} else {
					fadeLogic.unlock(view)
				}
			}, HOVER_UPDATE_DELAY)
		}

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
						return { activePos: null, forceRefresh: false }
					},

					apply(tr, prev) {
						const meta = tr.getMeta('updateDragHandle') as
							| { action: 'remove' }
							| { pos: number }
							| undefined

						if (meta && 'action' in meta && meta.action === 'remove') {
							return { activePos: null, forceRefresh: false }
						}

						if (meta && 'pos' in meta) {
							return { activePos: meta.pos, forceRefresh: false }
						}

						return {
							activePos:
								prev.activePos != null ? tr.mapping.map(prev.activePos) : null,
							forceRefresh: !!tr.getMeta('refreshDragHandle'),
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

					const handlers = createEventHandlers(initialView, handle, options)
					handle.addEventListener('mousedown', handlers.mousedown)
					handle.addEventListener('dragstart', handlers.dragstart)
					handle.addEventListener('dragend', handlers.dragend)

					const mouseenter = () => {
						isPointerOverHandle = true
						fadeLogic.lock()
					}
					const mouseleave = () => {
						isPointerOverHandle = false
						fadeLogic.unlock(currentView)
					}
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

							// Selection-change (or explicit refresh): find and dispatch new handle position.
							// refreshDragHandle meta is set by NodePath when activeDepth changes but the
							// cursor stays put — on mobile, mousemove never fires after a tap.
							const forceRefresh = dragHandlePluginKey.getState(
								view.state,
							)?.forceRefresh
							if (!forceRefresh && view.state.selection.eq(prevState.selection))
								return
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
							clearHoverUpdateTimer()
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
							// cursor.  The delayed hover update below can land between those two events and
							// position the handle while cursor placement is still pending,
							// which disrupts it.  The view() hook handles touch instead.
							const isTouch = (event as any).sourceCapabilities?.firesTouchEvents
							if (isTouch) return false

							pendingHoverCoords = {
								left: event.clientX,
								top: event.clientY,
							}
							if (!isPointerOverHandle) queueHoverUpdate(view)

							return false
						},

						mouseleave(view, event) {
							const to = (event as MouseEvent).relatedTarget as Element | null
							if (to?.closest('.node-path')) return false
							pendingHoverCoords = null
							clearHoverUpdateTimer()
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
