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

// The copy without an inline block at its start (side -1) or end (1) that it holds nothing of,
// and how deep it's still open there: a selection from inside an icon's end, where a click just
// after it puts the cursor, copies the icon empty and open into it.
const withoutEmptyEdge = (content: Fragment, open: number, side: -1 | 1): [Fragment, number] => {
	const index = side < 0 ? 0 : content.childCount - 1
	const node = open ? content.maybeChild(index) : null
	if (!node) return [content, 0]
	if (node.isText) return [content, open]
	// Inside first: a span block holding only an empty icon is left empty too.
	const [inner, innerOpen] = withoutEmptyEdge(node.content, open - 1, side)
	if (node.isInline && !inner.size)
		return [
			side < 0 ? content.cut(node.nodeSize) : content.cut(0, content.size - node.nodeSize),
			0,
		]
	return [content.replaceChild(index, node.copy(inner)), innerOpen + 1]
}

// The copy closed where it's open into an inline block (a span block): ProseMirror puts in only
// the text of one cut at either end, so the block's words would paste without it.
const closedAtInlineBlocks = (slice: Slice) => {
	const open = (side: -1 | 1) => {
		let content = slice.content
		const depth = side < 0 ? slice.openStart : slice.openEnd
		for (let at = 0; at < depth; at++) {
			const node = side < 0 ? content.firstChild : content.lastChild
			if (!node || node.isInline) return at
			content = node.content
		}
		return depth
	}
	return new Slice(slice.content, open(-1), open(1))
}

// Blocks copied whole: selected as a block, not by their text.
const copiedWhole = (slice: Slice) =>
	slice.openStart === 0 && slice.openEnd === 0 && !!slice.content.firstChild?.isBlock

// How a copy goes in at $from..$to: as text (one line beside the line's text, or a plain line
// anywhere: plain text, a line copied from inside one), as lines (blocks copied whole too), or as
// ProseMirror puts it (null: table cells, into code).
const howToPut = ($from: ResolvedPos, $to: ResolvedPos, slice: Slice): 'text' | 'lines' | null => {
	if (!$from.parent.isTextblock || !$to.parent.isTextblock) return null
	if ($from.parent.type.spec.code || $to.parent.type.spec.code) return null
	if (!slice.content.firstChild?.isBlock) return null
	if (copiedWhole(slice)) return 'lines'
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

// A block of items: a list, of any kind.
const isList = (block: PMNode) =>
	block.childCount > 0 && block.content.content.every((child) => ITEMS.includes(child.type.name))

// The items a copied block gives a list: an item copied whole, or a list's items copied by their
// text. A list copied whole is a block of its own.
const itemsOf = (block: PMNode, whole: boolean) =>
	ITEMS.includes(block.type.name)
		? Fragment.from(block)
		: !whole && isList(block)
			? block.content
			: null

// Where the transaction's last step put what it put in.
const lastPut = (tr: Transaction): [number, number] => {
	let put: [number, number] = [0, 0]
	tr.mapping.maps.at(-1)?.forEach((_from, _to, start, end) => (put = [start, end]))
	return put
}

// A new empty line at the page's end, the cursor in it: the line after a picture that ends the
// page, which the editor adds anyway once the paste is in (TipTap's trailing node).
const newLastLine = (tr: Transaction) => {
	const end = tr.doc.content.size
	tr.insert(end, tr.doc.type.contentMatch.defaultType!.create())
	return TextSelection.create(tr.doc, end + 1)
}

// Where the last line put in at from..to ends: -1 when what's put in ends with no line (a picture).
const lastLineEnd = (doc: PMNode, from: number, to: number) => {
	let end = -1
	doc.nodesBetween(from, to, (node, pos) => {
		if (pos + node.nodeSize > to) return
		if (node.isTextblock) end = pos + node.nodeSize - 1
		else if (node.isBlock && node.isLeaf) end = -1
		return !node.isTextblock
	})
	return end
}

// An item copied with its line's text and the list it holds: an item and its sub-items.
const withSubItems = (item: PMNode) =>
	!!item.firstChild?.isTextblock
	&& item.firstChild.content.size > 0
	&& item.content.content.some(isList)

// The copy without the blocks its text sat in, open at both ends around all it holds (a Card, a
// Stack, a quote, an item whose sub-items alone are copied). ProseMirror copies them too, and
// pasted they came in around the lines: in a list, a Card in the item, holding the copied items. A
// list of the items copied stays, as does one of an item copied with its sub-items, which nest.
const withoutAround = (slice: Slice) => {
	let { content, openStart, openEnd } = slice
	while (content.childCount === 1 && openStart > 1 && openEnd > 1) {
		const node = content.firstChild!
		if (
			node.isTextblock
			|| node.type.spec.isolating
			|| (isList(node) && (node.childCount > 1 || withSubItems(node.firstChild!)))
		)
			break
		content = node.content
		openStart--
		openEnd--
	}
	return new Slice(content, openStart, openEnd)
}

// What a copy holds: what's selected, without the blocks around it (withoutAround). Text from
// inside one line is copied as a plain line's text, without the line's kind or settings.
// ProseMirror copies the line around it, so pasted at a line's start or into an empty line it made
// that line a heading, a list or a quote, its own settings gone. Still a line, open on both sides:
// ProseMirror marks it as its own copy (`data-pm-slice`), and reads it back as written, spaces and
// all, where it would read bare text as another app's.
const copiedText = (copied: Slice) => {
	const [start, openStart] = withoutEmptyEdge(copied.content, copied.openStart, -1)
	const [content, openEnd] = withoutEmptyEdge(start, copied.openEnd, 1)
	const slice = withoutAround(new Slice(content, openStart, openEnd))
	const line = oneLine(slice)
	// A code block's text across its lines is its lines.
	if (!line || line.textContent.includes('\n')) return slice
	const plain = line.type.schema.topNodeType.contentMatch.defaultType
	if (!plain) return slice
	return new Slice(Fragment.from(plain.create(null, line.content)), 1, 1)
}

// What a copy holds and where it goes, for paste and drop alike. Text joins the line it lands in,
// which keeps its kind and settings. Copied lines, and blocks copied whole, go in as they were: in
// the middle of a line, the line splits as Enter splits it and they go between the halves, the
// first and last, when cut, joining the text beside them; at its start they go above it, at its
// end below, and in place of an empty line, never what holds it. In a list a plain line becomes an
// item, as typing it with Enter would, and copied items become items of the list's kind; anything
// else keeps its kind, under the line.
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

		// Blocks put in a list at `at`, between its items, as typing them with Enter would: a plain
		// line in a new item made as Enter makes one from `item`; the items of a list copied by their
		// text as this list's items, its kind. Anything else (a block an item can't start with, a list
		// copied whole) keeps its kind, inside the item before. Returns where they start and end.
		const putInList = (
			tr: Transaction,
			at: number,
			blocks: Fragment,
			item: PMNode,
			whole: boolean,
		): [number, number] => {
			let pos = at
			let start = -1
			const add = (node: PMNode) => {
				if (start < 0) start = pos
				tr.insert(pos, node)
				pos += node.nodeSize
			}
			const inside = (block: PMNode) => {
				const before = tr.doc.resolve(pos).nodeBefore
				if (
					before?.canReplace(before.childCount, before.childCount, Fragment.from(block))
				) {
					if (start < 0) start = pos - 1
					tr.insert(pos - 1, block)
					pos += block.nodeSize
					return
				}
				if (start < 0) start = pos
				const steps = tr.steps.length
				tr.replaceRange(pos, pos, new Slice(Fragment.from(block), 0, 0))
				pos = tr.mapping.slice(steps).map(pos, 1)
			}
			blocks.forEach((block) => {
				const items = itemsOf(block, whole)
				if (items)
					items.forEach((child) => {
						// An item with no line to start it (its line joined the text before, or the copy
						// starts inside a block it holds): what it holds goes in the item before.
						if (item.type.validContent(child.content))
							add(item.type.create(child.attrs, child.content, child.marks))
						else child.forEach(inside)
					})
				else if (item.type.validContent(Fragment.from(block)))
					add(item.type.create(carried(item), block))
				else inside(block)
			})
			return [start < 0 ? at : start, pos]
		}

		// The copy in an empty item: the author's (`own`), or the one Enter made above or below the
		// line. A plain line fills the item's line, as does, in the author's item, the line of the
		// first item copied. In Enter's item, copied items take its place (above the line, when the
		// first starts with a line), and below the line anything else does, going in the item above;
		// otherwise the item stays, the copy under its empty line. What the item holds after its line
		// (a nested list, more lines: Enter carries them into the item it makes) goes at the end of
		// the item the copy ends in, as typing the copy with Enter would carry it.
		const putInEmptyItem = (
			tr: Transaction,
			$line: ResolvedPos,
			rest: Slice,
			place: 'own' | 'above' | 'below',
			whole: boolean,
		): [number, number] => {
			const item = $line.node(-1)
			const itemPos = $line.before(-1)
			let blocks = rest.content
			const first = blocks.firstChild
			if (!first) return [itemPos, itemPos]
			const held = item.content.cut($line.after() - $line.before())
			if (held.size) tr.delete($line.after(), itemPos + item.nodeSize - 1)
			const itemEnd = itemPos + item.nodeSize - held.size
			const starts = (line: PMNode) =>
				line.isTextblock && item.type.contentMatch.matchType(line.type)
			// The first item the copy gives, and its line: the copy can start inside a block it holds.
			const firstItem = itemsOf(first, whole)?.firstChild
			const line =
				firstItem && item.type.validContent(firstItem.content) ? firstItem.firstChild : null
			const goes = place === 'below' ? !starts(first) : place === 'above' && !!line
			let put: [number, number]
			if (goes) {
				tr.delete(itemPos, itemEnd)
				put = putInList(tr, itemPos, blocks, item, whole)
			} else {
				const steps = tr.steps.length
				let filled = true
				if (starts(first)) {
					tr.replaceWith($line.before(), $line.after(), first)
					blocks = blocks.cut(first.nodeSize)
				} else if (line) {
					tr.insert($line.pos, line.content)
					// In its list, or the item copied whole.
					blocks = withoutLine(blocks, firstItem === first ? 2 : 3, -1)[0]
				} else filled = false
				const after = tr.mapping.slice(steps).map(itemEnd)
				const [start, end] = putInList(tr, after, blocks, item, whole)
				// The item's line is put in only when the copy fills it.
				put = [filled ? itemPos : start, end]
			}
			const [from, end] = put
			if (!held.size) return [from, end]
			const last = tr.doc.resolve(end).nodeBefore
			if (last && ITEMS.includes(last.type.name)) tr.insert(end - 1, held)
			else tr.replaceRange(end, end, new Slice(held, 0, 0))
			return [from, end - 1]
		}

		// The lines between the halves, where they meet: in a list as putInList puts them (the second
		// half is the item Enter made), elsewhere as they are, or as ProseMirror fits them.
		const putBetween = (
			tr: Transaction,
			firstEnd: number,
			secondStart: number,
			rest: Slice,
			whole: boolean,
		): [number, number] => {
			const $second = tr.doc.resolve(secondStart)
			const depth = tr.doc.resolve(firstEnd).sharedDepth(secondStart) + 1
			const gap = $second.before(depth)
			const second = $second.node(depth)
			if (ITEMS.includes(second.type.name))
				return putInList(tr, gap, rest.content, second, whole)
			const $gap = tr.doc.resolve(gap)
			// An item the copy cut can have no line to start it (its line joined to the text before, or
			// the copy started inside its sub-items): as ProseMirror fits it.
			const list = rest.content.firstChild
			const cut = list && isList(list) ? list.firstChild! : null
			const lineless = !!cut && !cut.type.validContent(cut.content)
			if (!lineless && $gap.parent.canReplace($gap.index(), $gap.index(), rest.content)) {
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
			const whole = copiedWhole(slice)
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
					// What's put in ends with no line (a picture): the cursor goes to the line after it, not a
					// picture there, which typing would replace; at the page's end, a new one.
					let lineAfter = false
					if (rest.content.size) {
						const placing = tr.steps.length
						const empty = (
							at: number,
							place: 'own' | 'above' | 'below',
						): [number, number] => {
							const $line = tr.doc.resolve(at)
							const inItem =
								$line.depth >= 2
								&& ITEMS.includes($line.node(-1).type.name)
								&& $line.index(-1) === 0
							if (inItem) return putInEmptyItem(tr, $line, rest, place, whole)
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
								? empty(pos, 'own')
								: !before
									? empty(firstEnd, 'above')
									: !after
										? empty(secondStart, 'below')
										: putBetween(tr, firstEnd, secondStart, rest, whole)
						if (!head) start = from
						if (tail) end = tr.mapping.slice(placing).map(end)
						else {
							const lastEnd = lastLineEnd(tr.doc, from, to)
							end = lastEnd < 0 ? to : lastEnd
							lineAfter = lastEnd < 0
						}
					}
					if (head) {
						const heading = tr.steps.length
						tr.insert(firstEnd, head.content)
						end = tr.mapping.slice(heading).map(end)
					}
					const $end = tr.doc.resolve(end)
					if (uiEvent === 'drop')
						tr.setSelection(TextSelection.between(tr.doc.resolve(start), $end))
					else if (!lineAfter) tr.setSelection(TextSelection.near($end, -1))
					else tr.setSelection(TextSelection.findFrom($end, 1, true) ?? newLastLine(tr))
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
					transformPasted: closedAtInlineBlocks,
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
						if ($pos.parent.type.spec.code) {
							if (copiedWhole(slice)) return false
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
