import { findBlockAtCoords, nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import { Fragment } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
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

						const meta = tr.getMeta(multiSelectPluginKey) as MultiSelectAction | undefined
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
							return Decoration.node(pos, pos + node.nodeSize, { class: 'node-selected' })
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

export const buildMultiDragSlice = (view: EditorView, pos: number) => {
	const positions = multiSelectPluginKey.getState(view.state)?.positions ?? []
	if (positions.length < 2) return null

	const doc = view.state.doc
	const dragNode = doc.nodeAt(pos)
	if (!dragNode) return null

	// Activate if the dragged node is selected or is an ancestor of a selected node
	// (handles the case where activeDepth shows a parent of the selected items)
	const isRelevant = positions.some(
		(p) => p === pos || (p > pos && p < pos + dragNode.nodeSize),
	)
	if (!isRelevant) return null

	const sorted = [...positions].sort((a, b) => a - b)
	const [firstPos] = sorted
	if (firstPos === undefined) return null

	pendingMultiDrag = sorted
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
			if (!target || sorted.includes(target.pos)) return false

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
