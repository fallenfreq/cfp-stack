import { editorComponents } from '@/config/editor/editorComponents'
import { isHistoryTransaction } from '@tiptap/pm/history'
import { Plugin, type EditorState, type Transaction } from '@tiptap/pm/state'
import { Extension } from '@tiptap/vue-3'
const componentNodeTypes = Object.values(editorComponents).map((c) => c.uuid)

// List the nodes that you want to extend with global attributes support
const nodesWithStyle = [
	'blockquote',
	'bulletList',
	'codeBlock',
	'document',
	'hardBreak',
	'heading',
	'horizontalRule',
	'listItem',
	'orderedList',
	'paragraph',
	// custom nodes
	'span',
	'div',
	// extra imported nodes
	'youtube',
	'image',
	'table',
	'tableCell',
	'tableHeader',
	'tableRow',
	'taskItem',
	'taskList',
]

// Where the changes wrote, on the page after them: each step's new content, followed through the
// steps after it. A setting changed on a block (`setNodeAttribute`) writes nothing.
const writtenRanges = (transactions: readonly Transaction[]) => {
	let ranges: [from: number, to: number][] = []
	for (const tr of transactions) {
		ranges = ranges.map(([from, to]) => [tr.mapping.map(from, 1), tr.mapping.map(to, -1)])
		tr.mapping.maps.forEach((map, i) => {
			const later = tr.mapping.slice(i + 1)
			map.forEach((_oldFrom, _oldTo, from, to) =>
				ranges.push([later.map(from, 1), later.map(to, -1)]),
			)
		})
	}
	return ranges
}

// An id is for one block. When a change leaves an id on more blocks than before, and a block
// already there still has it, the blocks the change put in go without it: a pasted or dropped
// copy, the lower half of a list, quote or Card split in two. A block is put in when the change
// writes it anew, as a move, a wrap or Change Type does too; those leave the id on as many blocks
// as before, so they keep it. When every block with the id was put in (the code view, opening a
// page), which was there first can't be told, and all keep it. Undo and redo put back what was
// there.
const idOnOneBlock = (
	transactions: readonly Transaction[],
	oldState: EditorState,
	newState: EditorState,
) => {
	if (!transactions.some((tr) => tr.docChanged) || transactions.some(isHistoryTransaction))
		return null
	const putIn = new Map<number, string>()
	for (const [from, to] of writtenRanges(transactions)) {
		if (from >= to) continue
		newState.doc.nodesBetween(from, to, (node, pos) => {
			if (pos >= from && node.attrs.id) putIn.set(pos, node.attrs.id)
		})
	}
	// Typing puts in no block, and most blocks put in have no id: the page's ids are counted only
	// when one does.
	if (!putIn.size) return null
	const ids = new Set(putIn.values())
	const before = new Map<string, number>()
	oldState.doc.descendants((node) => {
		const { id } = node.attrs
		if (ids.has(id)) before.set(id, (before.get(id) ?? 0) + 1)
	})
	const after = new Map<string, { count: number; alreadyThere: boolean }>()
	newState.doc.descendants((node, pos) => {
		const { id } = node.attrs
		if (!ids.has(id)) return
		const seen = after.get(id) ?? { count: 0, alreadyThere: false }
		after.set(id, { count: seen.count + 1, alreadyThere: seen.alreadyThere || !putIn.has(pos) })
	})
	const tr = newState.tr
	for (const [pos, id] of putIn) {
		const { count, alreadyThere } = after.get(id)!
		if (alreadyThere && count > (before.get(id) ?? 0)) tr.setNodeAttribute(pos, 'id', null)
	}
	return tr.steps.length ? tr : null
}

const AllowAttributesExtension = Extension.create({
	addGlobalAttributes() {
		return [
			{
				types: [...nodesWithStyle, ...componentNodeTypes],
				attributes: {
					style: {
						default: null,
						// The values returned from parseHTML will be passed to renderHTML
						parseHTML: (element) => element.getAttribute('style'),
						renderHTML: (attributes) => {
							return attributes.style ? { style: attributes.style } : null
						},
					},
					class: {
						default: '',
						parseHTML: (element) => element.classList.value,
						renderHTML: (attributes) => {
							return attributes.class ? { class: attributes.class } : null
						},
					},
					id: {
						default: null,
						// An id is for one block: the block Enter makes goes without it.
						keepOnSplit: false,
						parseHTML: (element) => element.getAttribute('id'),
						renderHTML: (attributes) => {
							return attributes.id ? { id: attributes.id } : null
						},
					},
				},
			},
		]
	},

	addProseMirrorPlugins() {
		return [new Plugin({ appendTransaction: idOnOneBlock })]
	},
})

export { AllowAttributesExtension }
