import type { Node as ProseMirrorNode, Slice } from '@tiptap/pm/model'
import { NodeSelection, Plugin, TextSelection } from '@tiptap/pm/state'
import { dropPoint } from '@tiptap/pm/transform'
import { type EditorView } from '@tiptap/pm/view'
import { Extension } from '@tiptap/vue-3'

interface DragHandleOptions {
	shouldShowHandle: (node: ProseMirrorNode, depth: number) => boolean
	buildDragSlice?: (
		view: EditorView,
		pos: number,
		event: DragEvent,
	) => { slice: Slice; move: boolean } | null
	setHoverPos: (pos: number) => void
	onHoverLost: () => void
	// Fired from the plugin's handleDrop, before PM dispatches the drop
	// transaction.  Depth is computed from the drop coordinates via the same
	// dropPoint utility PM uses internally — wire this to setActiveDepth so the
	// toolbar follows the dragged node when its depth changes on drop.
	onDrop: (depth: number) => void
}

interface DragHandleTarget {
	node: ProseMirrorNode
	pos: number
	depth: number
}

const HOVER_UPDATE_DELAY = 300

function findClosestDraggableParent(
	state: EditorView['state'],
	pos: number,
	options: DragHandleOptions,
): DragHandleTarget | null {
	const $pos = state.doc.resolve(pos)

	// Atoms and non-editable NodeViews both resolve just *outside* the node via
	// posAtCoords (the browser can't place a cursor inside contenteditable=false).
	// posAtCoords therefore returns a position at the parent depth, causing the
	// depth walk to miss the node entirely.  Detect the node via $pos.nodeAfter /
	// $pos.nodeBefore before the walk fires and return it through the same
	// shouldShowHandle gate the depth walk uses, so activeDepth is respected
	// uniformly — atoms (image, HR) at deeper depths fall through to the walk
	// and the handle lands on the nearest ancestor that satisfies the cap.
	// Text nodes are isLeaf(→isAtom) but not draggable; hardBreak has
	// selectable:false — both excluded by the guards below.
	//
	// This branch also covers the drag-handle mousedown path:
	// selectNodeForDrag dispatches TextSelection(doc, pos, pos+nodeSize) for
	// selectable:false wrappers, leaving the anchor *before* the wrapper.
	// $pos.nodeAfter resolves to the wrapper here, keeping the handle on it.
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
		if (options.shouldShowHandle(adjacent, adjacentDepth)) {
			const nodePos = $pos.nodeAfter ? pos : pos - adjacent.nodeSize
			return { node: adjacent, pos: nodePos, depth: adjacentDepth }
		}
	}

	for (let depth = $pos.depth; depth >= 1; depth--) {
		const node = $pos.node(depth)
		if (options.shouldShowHandle(node, depth)) {
			return { node, pos: $pos.before(depth), depth }
		}
	}

	return null
}

// Maps the editor's current selection to the position the drag handle should
// target.  Used by both hover (via posAtCoords + the same depth/adjacent walk)
// and selection-driven UI (the floating toolbar's inline handle) so the two
// always agree on which node owns the handle for any given state.
function resolveDragHandleTargetFromSelection(
	state: EditorView['state'],
	options: DragHandleOptions,
): DragHandleTarget | null {
	const { selection } = state
	// Non-leaf NodeSelection's anchor sits before the node at the parent depth;
	// pushing one step inside lets the depth walk land at the node itself.
	// Everything else (TextSelection — including the selectNodeForDrag span —
	// leaf NodeSelection, AllSelection) goes through the adjacent check.
	const startPos =
		selection instanceof NodeSelection && !selection.node.isLeaf
			? selection.from + 1
			: selection.anchor
	return findClosestDraggableParent(state, startPos, options)
}

function findNodeDOM(view: EditorView, pos: number): HTMLElement | null {
	const nodeDOM = view.nodeDOM(pos)
	if (nodeDOM && nodeDOM.nodeType === Node.ELEMENT_NODE) {
		return nodeDOM as HTMLElement
	}
	return null
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

const DragHandle = Extension.create<DragHandleOptions>({
	name: 'dragHandle',

	addOptions() {
		const noop = () => {
			/* default: caller wires real callbacks via .configure() */
		}
		return {
			shouldShowHandle: (node, depth) => depth === 1 && node.isBlock,
			setHoverPos: noop,
			onHoverLost: noop,
			onDrop: noop,
		}
	},

	addProseMirrorPlugins() {
		const options = this.options
		let hoverTimer: ReturnType<typeof setTimeout> | null = null
		let pendingCoords: { left: number; top: number } | null = null

		const clearHoverTimer = () => {
			if (!hoverTimer) return
			clearTimeout(hoverTimer)
			hoverTimer = null
		}

		const queueHoverUpdate = (view: EditorView) => {
			if (hoverTimer) return
			hoverTimer = setTimeout(() => {
				hoverTimer = null
				const coords = pendingCoords
				pendingCoords = null
				if (!coords) return
				const pos = view.posAtCoords(coords)
				const match = pos ? findClosestDraggableParent(view.state, pos.pos, options) : null
				if (match) options.setHoverPos(match.pos)
				else options.onHoverLost()
			}, HOVER_UPDATE_DELAY)
		}

		return [
			new Plugin({
				props: {
					handleDOMEvents: {
						mousemove(view, event) {
							if (view.composing || !view.hasFocus()) return false
							// Touch-synthesised mousemove fires before mousedown commits the
							// cursor.  The delayed hover update below can land between those two events
							// and disrupt cursor placement.  Skip touch entirely; we have no hover
							// concept on touch devices.
							const isTouch = (
								event as MouseEvent & {
									sourceCapabilities?: { firesTouchEvents?: boolean }
								}
							).sourceCapabilities?.firesTouchEvents
							if (isTouch) return false

							pendingCoords = { left: event.clientX, top: event.clientY }
							queueHoverUpdate(view)
							return false
						},

						mouseleave(_view, event) {
							const to = (event as MouseEvent).relatedTarget as Element | null
							// Don't fade when crossing into NodePath or the floating handle
							// itself — both are legitimate places the pointer can land while
							// still "interacting" with the same node.
							if (to?.closest('.node-path')) return false
							if (to?.closest('.floating-drag-handle-wrapper')) return false
							pendingCoords = null
							clearHoverTimer()
							options.onHoverLost()
							return false
						},
					},

					// Fires before PM dispatches the drop transaction.  We compute the
					// dropped node's new depth from the event's coordinates (same path
					// PM uses internally to position its drop preview line) and call
					// onDrop synchronously — by the time the drop transaction reaches
					// FloatingToolbar's listener, activeDepth has already been bumped,
					// so the toolbar's first re-resolve lands on the dropped node.
					handleDrop(view, event, slice) {
						const coords = view.posAtCoords({
							left: event.clientX,
							top: event.clientY,
						})
						if (!coords) return false
						const insertPos = dropPoint(view.state.doc, coords.pos, slice)
						if (insertPos === null) return false
						// dropPoint returns the parent position; the slice's top-level
						// node sits one depth inside it.  Closed slices (which the drag
						// handle always produces — Fragment.from(node) for non-selectable,
						// NodeSelection.content() for selectable) put their root node
						// exactly there.
						const $insert = view.state.doc.resolve(insertPos)
						const newDepth = $insert.depth + 1
						if (newDepth > 0) options.onDrop(newDepth)
						return false
					},
				},
			}),
		]
	},
})

export { DragHandle, findNodeDOM, resolveDragHandleTargetFromSelection, selectNodeForDrag }
export type { DragHandleOptions, DragHandleTarget }
