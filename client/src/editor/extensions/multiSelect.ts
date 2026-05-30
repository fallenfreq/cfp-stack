import { nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
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

export { MultiSelectExtension }
