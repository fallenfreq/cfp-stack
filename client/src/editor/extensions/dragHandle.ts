import { findBlockAtCoords, type NodePos } from '@/utils/editor/editorUtils'
import type { Node as ProseMirrorNode, Slice } from '@tiptap/pm/model'
import { NodeSelection, Plugin, TextSelection } from '@tiptap/pm/state'
import { dropPoint } from '@tiptap/pm/transform'
import { type EditorView } from '@tiptap/pm/view'
import { Extension } from '@tiptap/vue-3'

// Source pos of an in-flight single-node drag from the unified drag handle.
// Set by the handle's onDragstart, consumed (and cleared) by handleDrop when the
// drop lands inside the editor, or by a window 'dragend' listener if the drop
// went outside.  Mirrors the pendingMultiDrag pattern in multiSelect.ts.
let pendingDrag: { pos: number } | null = null

const setPendingDrag = (pos: number): void => {
	pendingDrag = { pos }
}

const clearPendingDrag = (): void => {
	pendingDrag = null
}

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
	// Called from the single-drag branch of handleDrop, BEFORE dispatch.  Wires
	// to clearing isDragging/frozenTargetPos so the handle doesn't render with
	// a stale frozen pos for the brief window between drop and dragend.
	onSingleDropConsumed?: () => void
}

interface DragHandleTarget {
	node: ProseMirrorNode
	pos: NodePos
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
			const nodePos = ($pos.nodeAfter ? pos : pos - adjacent.nodeSize) as NodePos
			return { node: adjacent, pos: nodePos, depth: adjacentDepth }
		}
	}

	for (let depth = $pos.depth; depth >= 1; depth--) {
		const node = $pos.node(depth)
		if (options.shouldShowHandle(node, depth)) {
			return { node, pos: $pos.before(depth) as NodePos, depth }
		}
	}

	return null
}

// Maps the editor's current selection to the position the drag handle should
// target.  Used by FloatingToolbar so the toolbar resolves to the same node
// the hover plugin (via posAtCoords + the same depth/adjacent walk) would.
function resolveDragHandleTargetFromSelection(
	state: EditorView['state'],
	options: DragHandleOptions,
): DragHandleTarget | null {
	const { selection } = state
	// Non-leaf NodeSelection's anchor sits before the node at the parent depth;
	// pushing one step inside lets the depth walk land at the node itself.
	// Everything else (TextSelection, leaf NodeSelection, AllSelection) goes
	// through the adjacent check.
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
				view() {
					// Single-drag's source-of-truth is the module-scoped pendingDrag.  If the
					// browser releases the drag outside the editor, handleDrop never fires; this
					// window listener guarantees the pending state is cleared.  Mirrors
					// multiSelect.ts's pendingMultiDrag recovery.
					const onWindowDragEnd = () => {
						pendingDrag = null
					}
					window.addEventListener('dragend', onWindowDragEnd)
					return {
						destroy() {
							window.removeEventListener('dragend', onWindowDragEnd)
						},
					}
				},

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
							if (to?.closest('.floating-drag-handle-wrapper')) {
								clearHoverTimer()
								pendingCoords = null
								return false
							}
							pendingCoords = null
							clearHoverTimer()
							options.onHoverLost()
							return false
						},
					},

					// Two-branch drop handler.
					//
					// Branch 1 — pendingDrag set (drag started from our unified handle):
					//   we own the entire drop.  Resolve target via findBlockAtCoords,
					//   delete source, insert slice, set the new selection on the dropped
					//   node so the toolbar follows it.  PM selection was never mutated
					//   during the drag, so toolbar items couldn't shrink mid-drag.
					//
					// Branch 2 — no pendingDrag (external drop, paste, etc.):
					//   non-consuming observer.  Compute the dropped node's new depth from
					//   the drop coords (same path PM uses) and call onDrop synchronously,
					//   so activeDepth is bumped before PM's drop transaction reaches
					//   FloatingToolbar's transaction listener.
					handleDrop(view, event, slice) {
						if (pendingDrag) {
							const source = pendingDrag.pos
							pendingDrag = null

							const doc = view.state.doc
							const sourceNode = doc.nodeAt(source)
							const target = findBlockAtCoords(view, event)
							// Reject drop-on-self AND drop-inside-self (e.g. dragging a list
							// and dropping inside one of its children).  Without this guard,
							// the delete would collapse the target position into source's gap
							// and the subsequent insert/selection would land in undefined territory.
							if (
								!target
								|| !sourceNode
								|| (target.pos >= source
									&& target.pos < source + sourceNode.nodeSize)
							) {
								view.dragging = null
								options.onSingleDropConsumed?.()
								return true
							}

							const move = view.dragging?.move ?? true
							let tr = view.state.tr
							if (move) {
								tr = tr.delete(source, source + sourceNode.nodeSize)
							}
							const insertAt = target.insertBefore
								? tr.mapping.map(target.pos)
								: tr.mapping.map(target.pos + target.node.nodeSize)
							tr = tr.insert(insertAt, sourceNode)

							const inserted = tr.doc.nodeAt(insertAt)
							if (inserted) {
								const newSelection =
									inserted.type.spec.selectable === false
										? TextSelection.create(
												tr.doc,
												insertAt,
												insertAt + inserted.nodeSize,
											)
										: NodeSelection.create(tr.doc, insertAt)
								tr = tr.setSelection(newSelection)
							}

							const $insert = tr.doc.resolve(insertAt)
							const newDepth = $insert.depth + 1
							if (newDepth > 0) options.onDrop(newDepth)

							// Clear drag state BEFORE dispatch so the transaction listener
							// (updatePixelPos) sees isDragging=false and resolves the handle's
							// target from the post-drop selection, not the stale frozen source
							// pos that no longer exists after the delete.
							options.onSingleDropConsumed?.()
							view.dragging = null
							view.dispatch(tr)
							return true
						}

						const coords = view.posAtCoords({
							left: event.clientX,
							top: event.clientY,
						})
						if (!coords) return false
						const insertPos = dropPoint(view.state.doc, coords.pos, slice)
						if (insertPos === null) return false
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

export {
	clearPendingDrag,
	DragHandle,
	findNodeDOM,
	resolveDragHandleTargetFromSelection,
	setPendingDrag,
}
export type { DragHandleOptions, DragHandleTarget }
