import { isPlacementClass } from '@somefreq-app/shared/placementClasses'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Extension } from '@tiptap/vue-3'

// A class that says where a block sits (sl-row, sl-pin-*, sl-hide-below-*…) belongs on the box
// its parent places. A block a component renders is a wrapper around the component, and the
// author's classes land on the component; a node decoration puts the placement classes on the
// node's outer box too (TipTap binds a Vue node view wrapper's class to its decorations). In
// the editor and on published pages; never saved. The list is the stylesheet's own
// (shared/placementClasses.js).

const placementClassesKey = new PluginKey<DecorationSet>('placementClasses')

function placementDecorations(doc: PMNode): DecorationSet {
	const decorations: Decoration[] = []
	doc.descendants((node, pos) => {
		const classAttr: unknown = node.attrs.class
		if (typeof classAttr !== 'string') return
		const placement = classAttr.split(/\s+/).filter(isPlacementClass)
		if (placement.length > 0)
			decorations.push(
				Decoration.node(pos, pos + node.nodeSize, { class: placement.join(' ') }),
			)
	})
	return DecorationSet.create(doc, decorations)
}

export const PlacementClasses = Extension.create({
	name: 'placementClasses',

	addProseMirrorPlugins() {
		return [
			new Plugin<DecorationSet>({
				key: placementClassesKey,
				state: {
					init: (_, { doc }) => placementDecorations(doc),
					apply: (tr, previous) =>
						tr.docChanged ? placementDecorations(tr.doc) : previous,
				},
				props: {
					decorations: (state) => placementClassesKey.getState(state),
				},
			}),
		]
	},
})
