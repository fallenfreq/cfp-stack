import { allAreSiblings, nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import { Fragment } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { dropPoint } from '@tiptap/pm/transform'
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
	if (positions.length < 2 || !positions.some((p) => p === pos)) return null
	if (!allAreSiblings(view.state.doc, positions)) return null

	const sorted = [...positions].sort((a, b) => a - b)
	const [firstPos] = sorted
	const lastPos = sorted[sorted.length - 1]
	if (firstPos === undefined || lastPos === undefined) return null

	pendingMultiDrag = sorted
	return {
		slice: view.state.doc.slice(firstPos, lastPos + nodeAt(view.state.doc, lastPos).nodeSize),
		move: false as const,
	}
}

const multiDragPlugin = new Plugin({
	props: {
		handleDrop(view, event) {
			if (!pendingMultiDrag) return false
			const sorted = pendingMultiDrag
			pendingMultiDrag = null

			const [firstPos] = sorted
			const lastPos = sorted[sorted.length - 1]
			if (firstPos === undefined || lastPos === undefined) return false

			const doc = view.state.doc
			const endPos = lastPos + nodeAt(doc, lastPos).nodeSize
			const slice = doc.slice(firstPos, endPos)

			const rawPos = view.posAtCoords({ left: event.clientX, top: event.clientY })
			if (!rawPos) return false

			const insertPos = dropPoint(doc, rawPos.pos, slice)
			if (insertPos == null) return false
			if (insertPos > firstPos && insertPos < endPos) return false

			const content = Fragment.fromArray(sorted.map((p) => nodeAt(doc, p)))
			let tr = view.state.tr
			if (insertPos <= firstPos) {
				tr = tr.insert(insertPos, content)
				tr = tr.delete(tr.mapping.map(firstPos), tr.mapping.map(endPos))
			} else {
				tr = tr.delete(firstPos, endPos)
				tr = tr.insert(tr.mapping.map(insertPos), content)
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
