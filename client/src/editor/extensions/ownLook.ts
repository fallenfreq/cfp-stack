import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type DecorationAttrs } from '@tiptap/pm/view'
import {
	Extension,
	getExtensionField,
	Node,
	type NodeConfig,
	type ParentConfig,
} from '@tiptap/vue-3'

// On @tiptap/core, where TipTap declares its types: added through @tiptap/vue-3, which passes them
// on, they're lost when TypeScript reads a package that adds to them on core after this file.
declare module '@tiptap/core' {
	interface NodeConfig<Options, Storage> {
		/**
		 * The classes and style the block wears on the page, as a component's template draws its
		 * own: drawn only (`OwnLook`), never one of its settings, so copying, the code view and the
		 * saved page leave them out.
		 */
		ownLook?: (
			this: {
				name: string
				options: Options
				storage: Storage
				parent: ParentConfig<NodeConfig<Options, Storage>>['ownLook']
			},
			node: PMNode,
		) => DecorationAttrs | null
	}
}

// Draws each block's `ownLook`, again whenever the page changes.
export const OwnLook = Extension.create({
	name: 'ownLook',

	addProseMirrorPlugins() {
		const looks = new Map<string, (node: PMNode) => DecorationAttrs | null>()
		for (const extension of this.editor.extensionManager.extensions) {
			if (!(extension instanceof Node)) continue
			const { name, options, storage } = extension
			const look = getExtensionField<NodeConfig<unknown, unknown>['ownLook']>(
				extension,
				'ownLook',
				{ name, options, storage },
			)
			if (look) looks.set(name, look)
		}
		const draw = (doc: PMNode) => {
			const decorations: Decoration[] = []
			doc.descendants((node, pos) => {
				const attrs = looks.get(node.type.name)?.(node)
				if (attrs) decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs))
			})
			return DecorationSet.create(doc, decorations)
		}
		return [
			new Plugin<DecorationSet>({
				state: {
					init: (_, { doc }) => draw(doc),
					apply: (tr, drawn) => (tr.docChanged ? draw(tr.doc) : drawn),
				},
				props: {
					decorations(state) {
						return this.getState(state)
					},
				},
			}),
		]
	},
})
