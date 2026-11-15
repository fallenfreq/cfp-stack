import { Extension } from '@tiptap/vue-3'

// On @tiptap/core, where TipTap declares its types, as multiSelect.ts does.
declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		updateAttributesAt: {
			/** Changes settings of the block at pos in place: it stays selected and keeps the rest. */
			updateAttributesAt: (pos: number, attributes: Record<string, unknown>) => ReturnType
		}
	}
}

// TipTap's own ways (`updateAttributes`, `$pos(…).setAttribute`) write the block anew
// (`setNodeMarkup`), replacing its start and end. A block selected whole then counts as deleted,
// and the selection falls to the nearest text; one given an id another block has looks like a
// copy, and the editor takes the id off (allowAttributesExtension.ts). `setNodeAttribute` changes
// one setting and moves nothing. Only settings that differ are written, so a pick that changes
// nothing is no Undo step; one the block doesn't have is skipped, as ProseMirror would drop it
// anyway. False when there's no block at pos.
export const UpdateAttributesAt = Extension.create({
	name: 'updateAttributesAt',

	addCommands() {
		return {
			updateAttributesAt:
				(pos, attributes) =>
				({ tr, dispatch }) => {
					const node = tr.doc.nodeAt(pos)
					if (!node || node.isInline) return false
					if (dispatch)
						for (const [key, value] of Object.entries(attributes))
							if (key in node.attrs && node.attrs[key] !== value)
								tr.setNodeAttribute(pos, key, value)
					return true
				},
		}
	},
})
