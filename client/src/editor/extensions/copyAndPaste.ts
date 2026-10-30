import { Fragment, Slice, type Node as PMNode, type ResolvedPos } from '@tiptap/pm/model'
import { Plugin, TextSelection, type Transaction } from '@tiptap/pm/state'
import { dropPoint } from '@tiptap/pm/transform'
import { Extension, getSplittedAttributes, type ChainedCommands } from '@tiptap/vue-3'

// The kinds of item whose line Enter splits as the item (TipTap's `splitListItem`).
const ITEMS = ['listItem', 'taskItem']

// The line a copy holds the text of, when it's text from inside one line: one line, cut on both
// sides.
const oneLine = (slice: Slice): PMNode | null => {
	let node = slice.content.childCount === 1 ? slice.content.firstChild : null
	let depth = 1
	while (node && !node.isTextblock) {
		node = node.childCount === 1 ? node.firstChild : null
		depth++
	}
	return node && slice.openStart === depth && slice.openEnd === depth ? node : null
}

// The copy's first (side -1) or last (1) line, when the copy cut it: open into it, through no
// table cell (a cell's lines stay in their table).
const cutLine = (slice: Slice, side: -1 | 1): PMNode | null => {
	const open = side < 0 ? slice.openStart : slice.openEnd
	let content = slice.content
	for (let depth = 1; depth <= open; depth++) {
		const node = side < 0 ? content.firstChild : content.lastChild
		if (!node || node.type.spec.isolating) return null
		if (node.isTextblock) return depth === open ? node : null
		content = node.content
	}
	return null
}

// The first line in the content, through no table cell, and how deep it is.
const firstLine = (content: Fragment): [PMNode, number] | null => {
	let node = content.firstChild
	let depth = 1
	while (node && !node.isTextblock) {
		if (node.type.spec.isolating) return null
		node = node.firstChild
		depth++
	}
	return node ? [node, depth] : null
}

// The content without its line `depth` levels down at the start (side -1) or end (1), a block it
// leaves empty going too, and how deep it's still open on that side.
const withoutLine = (content: Fragment, depth: number, side: -1 | 1): [Fragment, number] => {
	const index = side < 0 ? 0 : content.childCount - 1
	const node = content.child(index)
	const rest =
		side < 0 ? content.cut(node.nodeSize) : content.cut(0, content.size - node.nodeSize)
	if (depth === 1) return [rest, 0]
	const [inner, open] = withoutLine(node.content, depth - 1, side)
	if (!inner.childCount) return [rest, 0]
	return [content.replaceChild(index, node.copy(inner)), open + 1]
}

// How a copy goes in at $from..$to: as text (one line beside the line's text, or a plain line
// anywhere: plain text, a line copied from inside one), as lines, or as ProseMirror puts it (null:
// blocks copied whole, table cells, into code).
const howToPut = ($from: ResolvedPos, $to: ResolvedPos, slice: Slice): 'text' | 'lines' | null => {
	if (!$from.parent.isTextblock || !$to.parent.isTextblock) return null
	if ($from.parent.type.spec.code || $to.parent.type.spec.code) return null
	if (!slice.content.firstChild?.isBlock) return null
	if (!cutLine(slice, -1) && !cutLine(slice, 1)) return null
	const line = oneLine(slice)
	if (!line) return 'lines'
	const beside = $from.parentOffset > 0 || $to.parentOffset < $to.parent.content.size
	return beside || isPlainLine(slice, line) ? 'text' : 'lines'
}

// A copy that's one line of the page's plain kind (a paragraph), in nothing: it has no kind or
// settings to bring.
const isPlainLine = (slice: Slice, line: PMNode) =>
	slice.content.firstChild === line
	&& line.type === line.type.schema.topNodeType.contentMatch.defaultType

// A block of blocks, as a list is of its items: not a line, nor a picture with nothing in it.
const isList = (block: PMNode) => !block.isTextblock && block.childCount > 0

// Where the transaction's last step put what it put in.
const lastPut = (tr: Transaction): [number, number] => {
	let put: [number, number] = [0, 0]
	tr.mapping.maps.at(-1)?.forEach((_from, _to, start, end) => (put = [start, end]))
	return put
}

const lastTextblockEnd = (doc: PMNode, from: number, to: number) => {
	let end = -1
	doc.nodesBetween(from, to, (node, pos) => {
		if (node.isTextblock && pos + node.nodeSize <= to) end = pos + node.nodeSize - 1
	})
	return end
}

// What a copy holds: text from inside one line is copied as a plain line's text, without the
// line's kind or settings. ProseMirror copies the line around it, so pasted at a line's start or
// into an empty line it made that line a heading, a list or a quote, its own settings gone. Still a
// line, open on both sides: ProseMirror marks it as its own copy (`data-pm-slice`), and reads it
// back as written, spaces and all, where it would read bare text as another app's.
const copiedText = (slice: Slice) => {
	const line = oneLine(slice)
	// A code block's text across its lines is its lines.
	if (!line || line.textContent.includes('\n')) return slice
	const plain = line.type.schema.topNodeType.contentMatch.defaultType
	if (!plain) return slice
	return new Slice(Fragment.from(plain.create(null, line.content)), 1, 1)
}

// What a copy holds and where it goes, for paste and drop alike. Text joins the line it lands in,
// which keeps its kind and settings. Copied lines go in as they were: in the middle of a line, the
// line splits as Enter splits it and they go between the halves, the first and last, when cut,
// joining the text beside them; at its start they go above it, at its end below, and in place of
// an empty line. In a list each becomes an item, as typing them with Enter would.
export const CopyAndPaste = Extension.create({
	name: 'copyAndPaste',
	// After every other paste and drop, so a block's own goes first: code pasted from VS Code is a
	// code block.
	priority: 1,

	addProseMirrorPlugins() {
		const editor = this.editor
		// What Enter carries over to a new item: its class and style, not its id.
		const carried = (item: PMNode) =>
			getSplittedAttributes(editor.extensionManager.attributes, item.type.name, item.attrs)

		// Marked as ProseMirror marks a paste or a drop; a paste is scrolled to.
		const marked = (tr: Transaction, uiEvent: 'paste' | 'drop') => {
			tr.setMeta('uiEvent', uiEvent)
			if (uiEvent === 'paste') tr.setMeta('paste', true).scrollIntoView()
			return true
		}

		// Blocks put in a list at `at`, between its items, as typing them with Enter would: a line in a
		// new item made as Enter makes one from `item`, a copied list's items as they were. A block an
		// item can't start with goes inside the item before. Returns where they end.
		const putInList = (tr: Transaction, at: number, blocks: Fragment, item: PMNode) => {
			let pos = at
			blocks.forEach((block) => {
				const $pos = tr.doc.resolve(pos)
				const index = $pos.index()
				let put: Fragment | null = null
				if (isList(block) && $pos.parent.canReplace(index, index, block.content))
					put = block.content
				else if (item.type.validContent(Fragment.from(block)))
					put = Fragment.from(item.type.create(carried(item), block))
				if (put) {
					tr.insert(pos, put)
					pos += put.size
					return
				}
				const before = $pos.nodeBefore
				if (
					before?.canReplace(before.childCount, before.childCount, Fragment.from(block))
				) {
					tr.insert(pos - 1, block)
					pos += block.nodeSize
					return
				}
				const steps = tr.steps.length
				tr.replaceRange(pos, pos, new Slice(Fragment.from(block), 0, 0))
				pos = tr.mapping.slice(steps).map(pos, 1)
			})
			return pos
		}

		// The copy in an empty item, the author's (`own`) or the one Enter made: its first line in the
		// item's line (that line's text, when an item can't start with it), the rest after the item.
		// In Enter's item, a copied list gives its items in place of it, as they were.
		const putInEmptyItem = (
			tr: Transaction,
			$line: ResolvedPos,
			rest: Slice,
			own: boolean,
		): [number, number] => {
			const item = $line.node(-1)
			const itemPos = $line.before(-1)
			const $item = tr.doc.resolve(itemPos)
			let blocks = rest.content
			const first = blocks.firstChild
			if (!first) return [itemPos, itemPos]
			const steps = tr.steps.length
			const index = $item.index()
			const starts = first.isTextblock && item.type.contentMatch.matchType(first.type)
			const found = starts ? null : firstLine(blocks)
			// Enter's item, with nothing to start it: a copied list's items, or a block with no line to
			// give (a picture), in place of it.
			const fits = isList(first)
				? $item.parent.canReplace(index, index + 1, first.content)
				: !found
			if (!own && !starts && fits) {
				tr.delete(itemPos, itemPos + item.nodeSize)
				return [itemPos, putInList(tr, itemPos, blocks, item)]
			}
			if (starts) {
				tr.replaceWith($line.before(), $line.after(), first)
				blocks = blocks.cut(first.nodeSize)
			} else if (found) {
				tr.insert($line.pos, found[0].content)
				blocks = withoutLine(blocks, found[1], -1)[0]
			}
			const afterItem = tr.mapping.slice(steps).map(itemPos + item.nodeSize)
			return [itemPos, putInList(tr, afterItem, blocks, item)]
		}

		// The lines between the halves, where they meet: in a list as putInList puts them (the second
		// half is the item Enter made), elsewhere as they are, or as ProseMirror fits them.
		const putBetween = (
			tr: Transaction,
			firstEnd: number,
			secondStart: number,
			rest: Slice,
		): [number, number] => {
			const $second = tr.doc.resolve(secondStart)
			const depth = tr.doc.resolve(firstEnd).sharedDepth(secondStart) + 1
			const gap = $second.before(depth)
			const second = $second.node(depth)
			if (ITEMS.includes(second.type.name))
				return [gap, putInList(tr, gap, rest.content, second)]
			const $gap = tr.doc.resolve(gap)
			if ($gap.parent.canReplace($gap.index(), $gap.index(), rest.content)) {
				tr.insert(gap, rest.content)
				return [gap, gap + rest.content.size]
			}
			tr.replaceRange(gap, gap, rest)
			return lastPut(tr)
		}

		// The copy's lines, in a chain with the place selected (a cursor, or text it replaces): the
		// selection goes, and the line splits as Enter splits it, giving an empty line above at its
		// start and below at its end. The cut first line's text goes at the end of the first half and
		// the cut last line's at the start of the second, when that half has text; the rest where the
		// halves meet, or in place of the empty half or the empty line. Then the cursor goes after
		// what's put in, or for a drop it's selected, as ProseMirror does.
		const putLines = (chain: ChainedCommands, slice: Slice, uiEvent: 'paste' | 'drop') => {
			let pos = 0
			let steps = 0
			let before = false
			let after = false
			return chain
				.command(({ tr }) => {
					tr.deleteSelection()
					const { $from } = tr.selection
					pos = $from.pos
					before = $from.parentOffset > 0
					after = $from.parentOffset < $from.parent.content.size
					steps = tr.steps.length
					return true
				})
				.command(
					({ commands }) =>
						(!before && !after)
						|| ITEMS.some((name) => commands.splitListItem(name))
						|| commands.splitBlock(),
				)
				.command(({ tr }) => {
					const split = tr.mapping.slice(steps)
					// Every line on the page splits; one that didn't would leave nothing to put the copy
					// between, and the chain sends its change anyway: as ProseMirror pastes it.
					if ((before || after) && !split.maps.length) {
						tr.replaceRange(pos, pos, slice)
						tr.setSelection(TextSelection.near(tr.doc.resolve(lastPut(tr)[1]), -1))
						return true
					}
					const firstEnd = split.map(pos, -1)
					const secondStart = split.map(pos, 1)
					const lineType = tr.doc.resolve(firstEnd).parent.type
					const joins = (line: PMNode | null) =>
						line && lineType.validContent(line.content) ? line : null
					let rest = slice
					const head = before ? joins(cutLine(slice, -1)) : null
					if (head) {
						const [content, open] = withoutLine(rest.content, rest.openStart, -1)
						rest = new Slice(content, open, content.size ? rest.openEnd : 0)
					}
					const tail = after && rest.content.size ? joins(cutLine(rest, 1)) : null
					if (tail) {
						const [content, open] = withoutLine(rest.content, rest.openEnd, 1)
						rest = new Slice(content, content.size ? rest.openStart : 0, open)
					}
					// From the last place back, so each place is still where it was.
					if (tail) tr.insert(secondStart, tail.content)
					let start = firstEnd
					let end = tail ? secondStart + tail.content.size : firstEnd
					if (rest.content.size) {
						const placing = tr.steps.length
						const empty = (at: number, own: boolean): [number, number] => {
							const $line = tr.doc.resolve(at)
							const inItem =
								$line.depth >= 2
								&& ITEMS.includes($line.node(-1).type.name)
								&& $line.index(-1) === 0
							if (inItem) return putInEmptyItem(tr, $line, rest, own)
							// Put in after the empty line, which then goes: replaced, the line would take with
							// it a Card or Stack it's alone in (replaceRange widens to what it fills).
							tr.replaceRange($line.after(), $line.after(), rest)
							const [from, to] = lastPut(tr)
							const deleting = tr.steps.length
							tr.delete($line.before(), $line.after())
							const map = tr.mapping.slice(deleting)
							return [map.map(from), map.map(to)]
						}
						const [from, to] =
							!before && !after
								? empty(pos, true)
								: !before
									? empty(firstEnd, false)
									: !after
										? empty(secondStart, false)
										: putBetween(tr, firstEnd, secondStart, rest)
						if (!head) start = from
						if (tail) end = tr.mapping.slice(placing).map(end)
						else {
							const lastEnd = lastTextblockEnd(tr.doc, from, to)
							end = lastEnd < 0 ? to : lastEnd
						}
					}
					if (head) {
						const heading = tr.steps.length
						tr.insert(firstEnd, head.content)
						end = tr.mapping.slice(heading).map(end)
					}
					const $end = tr.doc.resolve(end)
					tr.setSelection(
						uiEvent === 'drop'
							? TextSelection.between(tr.doc.resolve(start), $end)
							: TextSelection.near($end, -1),
					)
					return true
				})
				.command(({ tr }) => marked(tr, uiEvent))
				.run()
		}

		// One line's text, beside the line's text: in at the cursor, as text.
		const putText = (chain: ChainedCommands, line: PMNode, uiEvent: 'paste' | 'drop') =>
			chain
				.command(({ tr }) => {
					const from = tr.selection.from
					tr.replaceSelection(new Slice(line.content, 0, 0))
					if (uiEvent === 'drop')
						tr.setSelection(TextSelection.create(tr.doc, from, tr.selection.from))
					return marked(tr, uiEvent)
				})
				.run()

		const put = (
			chain: ChainedCommands,
			slice: Slice,
			how: 'text' | 'lines',
			uiEvent: 'paste' | 'drop',
		) => {
			const line = oneLine(slice)
			if (how === 'text' && line) return putText(chain, line, uiEvent)
			return putLines(chain, slice, uiEvent)
		}

		return [
			new Plugin({
				props: {
					transformCopied: copiedText,
					handlePaste(view, _event, slice) {
						const { $from, $to } = view.state.selection
						const how = howToPut($from, $to, slice)
						if (!how) return false
						put(editor.chain(), slice, how, 'paste')
						return true
					},
					// Where ProseMirror would drop it, after the text dragged away goes.
					handleDrop(view, event, slice, moved) {
						if (!slice.content.size) return false
						const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
						if (!at) return false
						const dropAt = dropPoint(view.state.doc, at.pos, slice) ?? at.pos
						const tr = view.state.tr
						if (moved) tr.deleteSelection()
						const pos = tr.mapping.map(dropAt)
						const $pos = tr.doc.resolve(pos)
						// Into code, the copy's text, as pasting puts it; a block dragged whole goes beside it.
						const wholeBlock =
							slice.openStart === 0
							&& slice.openEnd === 0
							&& slice.content.firstChild?.isBlock
						if ($pos.parent.type.spec.code) {
							if (wholeBlock) return false
							const text = event.dataTransfer?.getData('text/plain') ?? ''
							tr.insertText(text, pos)
							tr.setSelection(TextSelection.create(tr.doc, pos, pos + text.length))
							view.dispatch(tr.setMeta('uiEvent', 'drop'))
							view.focus()
							return true
						}
						const how = howToPut($pos, $pos, slice)
						if (!how) return false
						const place = editor.chain().command(({ tr: drop }) => {
							if (moved) drop.deleteSelection()
							drop.setSelection(
								TextSelection.create(drop.doc, drop.mapping.map(dropAt)),
							)
							return true
						})
						put(place, slice, how, 'drop')
						view.focus()
						return true
					},
				},
			}),
		]
	},
})
