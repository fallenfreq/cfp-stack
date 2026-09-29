import { findBlockAtCoords, nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import { Fragment } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import { Extension } from '@tiptap/vue-3'

export interface MultiSelectState {
	positions: NodePos[]
}

export type MultiSelectAction =
	| { action: 'add'; pos: NodePos }
	| { action: 'addMany'; positions: NodePos[] }
	| { action: 'remove'; pos: NodePos }
	| { action: 'clear' }

export const multiSelectPluginKey = new PluginKey<MultiSelectState>('multiSelect')

const MultiSelectExtension = Extension.create({
	name: 'multiSelect',

	addProseMirrorPlugins() {
		return [
			multiDragPlugin,
			new Plugin<MultiSelectState>({
				key: multiSelectPluginKey,

				state: {
					init() {
						return { positions: [] }
					},

					apply(tr, prev) {
						let positions = prev.positions
							.map((pos) => tr.mapping.mapResult(pos, 1))
							.filter((result) => !result.deleted)
							.map((result) => result.pos as NodePos)

						const meta = tr.getMeta(multiSelectPluginKey) as
							| MultiSelectAction
							| undefined
						if (meta) {
							if (meta.action === 'add' && !positions.includes(meta.pos)) {
								positions = [...positions, meta.pos]
							} else if (meta.action === 'addMany') {
								positions = [...new Set([...positions, ...meta.positions])]
							} else if (meta.action === 'remove') {
								positions = positions.filter((p) => p !== meta.pos)
							} else if (meta.action === 'clear') {
								positions = []
							}
						}

						return { positions }
					},
				},

				props: {
					decorations(state) {
						const pluginState = multiSelectPluginKey.getState(state)
						if (!pluginState?.positions.length) return DecorationSet.empty
						const decorations = pluginState.positions.map((pos) => {
							const node = nodeAt(state.doc, pos)
							return Decoration.node(pos, pos + node.nodeSize, {
								class: 'sf-on-selected',
							})
						})
						return DecorationSet.create(state.doc, decorations)
					},
				},
			}),
		]
	},
})

// --- Multi-drag ---
// Positions of the nodes being dragged. Set by buildMultiDragSlice (called from the drag
// handle's dragstart), cleared on drop or dragend.
let pendingMultiDrag: NodePos[] | null = null

// The picture that follows the pointer while dragging several nodes: a floating card with
// a count and copies of the first three nodes. It's placed at the page's corner and all but
// invisible; the browser takes its snapshot from it, then it's removed.
const createMultiDragPreview = (view: EditorView, sorted: NodePos[]): HTMLElement => {
	const wrap = document.createElement('div')
	wrap.className = 'sf-depth-3 sl-stack sf-gap-xs'
	wrap.style.cssText =
		'position:fixed;top:0;left:0;pointer-events:none;opacity:0.001;overflow:hidden;max-width:480px;'

	const count = document.createElement('span')
	count.className =
		'sf-counter sf-single-line sf-size-2xs sf-text-xs sf-loudness-3 sf-variant-primary'
	count.textContent = `${sorted.length} nodes`
	count.style.alignSelf = 'start'
	wrap.appendChild(count)

	// Copies render as they do in the editor; the stack's gap spaces them, not their margins.
	const content = document.createElement('div')
	content.className = 'tiptap sl-stack sf-gap-xs'
	for (const pos of sorted.slice(0, 3)) {
		const dom = view.nodeDOM(pos) as HTMLElement | null
		if (!dom) continue
		const clone = dom.cloneNode(true) as HTMLElement
		clone.style.margin = '0'
		content.appendChild(clone)
	}
	if (sorted.length > 3) {
		const more = document.createElement('p')
		more.className = 'sf-text-xs sf-loudness-1'
		more.textContent = `+${sorted.length - 3} more…`
		content.appendChild(more)
	}
	wrap.appendChild(content)
	return wrap
}

export const buildMultiDragSlice = (view: EditorView, pos: number, event: DragEvent) => {
	const positions = multiSelectPluginKey.getState(view.state)?.positions ?? []
	if (positions.length < 2) return null

	const doc = view.state.doc
	const dragNode = doc.nodeAt(pos)
	if (!dragNode) return null

	// Activate if the dragged node is selected or is an ancestor of a selected node
	// (handles the case where activeDepth shows a parent of the selected items)
	const isRelevant = positions.some((p) => p === pos || (p > pos && p < pos + dragNode.nodeSize))
	if (!isRelevant) return null

	const sorted = [...positions].sort((a, b) => a - b)
	const [firstPos] = sorted
	if (firstPos === undefined) return null

	pendingMultiDrag = sorted

	if (event.dataTransfer) {
		const preview = createMultiDragPreview(view, sorted)
		document.body.appendChild(preview)
		event.dataTransfer.setDragImage(preview, 0, 0)
		requestAnimationFrame(() => preview.remove())
	}

	const firstNode = nodeAt(doc, firstPos)
	// Placeholder slice — handleDrop overrides the actual operation
	return {
		slice: doc.slice(firstPos, firstPos + firstNode.nodeSize),
		move: false as const,
	}
}

const multiDragPlugin = new Plugin({
	props: {
		handleDrop(view, event) {
			if (!pendingMultiDrag) return false
			const sorted = pendingMultiDrag
			pendingMultiDrag = null

			const target = findBlockAtCoords(view, event)
			// Return true to consume the event without inserting — prevents PM's own drop
			// handler from inserting the placeholder slice (phantom copy of the first node).
			if (!target || sorted.includes(target.pos)) return true

			const { pos: targetPos, node: targetNode, insertBefore } = target
			const doc = view.state.doc
			const content = Fragment.fromArray(sorted.map((p) => nodeAt(doc, p)))
			let tr = view.state.tr
			for (const p of [...sorted].reverse()) {
				const node = tr.doc.nodeAt(p)!
				tr = tr.delete(p, p + node.nodeSize)
			}
			const insertAt = insertBefore
				? tr.mapping.map(targetPos)
				: tr.mapping.map(targetPos + targetNode.nodeSize)
			tr = tr.insert(insertAt, content)
			// Mirror native single-drag behavior: select the first dropped node so the
			// toolbar repositions to it.  NodeSelection for selectable nodes (gives the
			// "node-selected" outline); TextSelection spanning the node for
			// selectable:false wrappers (NodeSelection.create would throw).
			const firstInserted = tr.doc.nodeAt(insertAt)
			if (firstInserted) {
				const newSelection =
					firstInserted.type.spec.selectable === false
						? TextSelection.create(tr.doc, insertAt, insertAt + firstInserted.nodeSize)
						: NodeSelection.create(tr.doc, insertAt)
				tr = tr.setSelection(newSelection)
			}
			tr = tr.setMeta(multiSelectPluginKey, { action: 'clear' })
			view.dragging = null
			view.dispatch(tr)
			return true
		},
	},

	view() {
		const onDragEnd = () => {
			pendingMultiDrag = null
		}
		window.addEventListener('dragend', onDragEnd)
		return {
			destroy() {
				window.removeEventListener('dragend', onDragEnd)
			},
		}
	},
})

export { MultiSelectExtension }
