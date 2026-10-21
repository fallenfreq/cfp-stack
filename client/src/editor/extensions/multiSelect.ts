import { findBlockAtCoords, nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import { Fragment, type Node as PMNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, TextSelection, type Transaction } from '@tiptap/pm/state'
import { ReplaceAroundStep, ReplaceStep, Transform, type Step } from '@tiptap/pm/transform'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import { Extension, type CommandProps } from '@tiptap/vue-3'

export interface MultiSelectState {
	positions: NodePos[]
}

type MultiSelectAction =
	| { action: 'add'; positions: NodePos[] }
	| { action: 'remove'; pos: NodePos }
	| { action: 'clear' }

// A change asked for partway through a transaction: its positions are in the document as it was
// then (after `at` steps), and the steps after map them as they map the rest.
interface MultiSelectRequest {
	at: number
	action: MultiSelectAction
}

export const multiSelectPluginKey = new PluginKey<MultiSelectState>('multiSelect')

// The one way to change which blocks are selected together: the commands below use it, and so
// does dropping several blocks. Requests in one transaction apply in the order asked.
const askMultiSelect = (tr: Transaction, action: MultiSelectAction): Transaction => {
	const asked: MultiSelectRequest[] = tr.getMeta(multiSelectPluginKey) ?? []
	return tr.setMeta(multiSelectPluginKey, [...asked, { at: tr.steps.length, action }])
}

const applyAction = (positions: NodePos[], action: MultiSelectAction): NodePos[] => {
	if (action.action === 'add') return [...new Set([...positions, ...action.positions])]
	if (action.action === 'remove') return positions.filter((p) => p !== action.pos)
	return []
}

declare module '@tiptap/vue-3' {
	interface Commands<ReturnType> {
		multiSelect: {
			/** Adds blocks, by their positions, to the blocks selected together. */
			addToMultiSelect: (positions: NodePos[]) => ReturnType
			removeFromMultiSelect: (pos: NodePos) => ReturnType
			clearMultiSelect: () => ReturnType
		}
	}
}

// Whether a step changes the block at pos in place, as a change to its attributes or type does
// (a to-do ticked, a paragraph turned into a heading): it rewrites only the block's start and
// end, around its content, or swaps a block with no content (an image) for one of its type.
// Tracking its position alone counts that as deleting it.
const changedInPlace = (step: Step, pos: number, doc: PMNode): boolean => {
	if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep) || step.from !== pos)
		return false
	const node = doc.nodeAt(pos)
	const { content, openStart, openEnd } = step.slice
	const swap =
		openStart === 0 && openEnd === 0 && content.childCount === 1 ? content.firstChild : null
	if (!node || !swap || step.to !== pos + node.nodeSize) return false
	if (step instanceof ReplaceStep) return node.isLeaf && swap.type === node.type
	return (
		step.gapFrom === pos + 1
		&& step.gapTo === step.to - 1
		&& step.insert === 1
		&& swap.content.size === 0
	)
}

// The chosen blocks that move, in page order. A block and one inside it can both be chosen, but
// the one inside moves with its block: moving it again would copy it.
export const blocksToMove = (doc: PMNode, positions: NodePos[]): NodePos[] => {
	let end = -1
	return [...positions]
		.sort((a, b) => a - b)
		.filter((pos) => {
			if (pos < end) return false
			end = pos + nodeAt(doc, pos).nodeSize
			return true
		})
}

// The blocks that move to the target, or null when the target is one of them or inside one: the
// toolbar's tools and a drop both ask.
export const blocksToMoveTo = (
	doc: PMNode,
	positions: NodePos[],
	target: NodePos,
): NodePos[] | null => {
	const blocks = blocksToMove(doc, positions)
	return blocks.some((p) => target >= p && target < p + nodeAt(doc, p).nodeSize) ? null : blocks
}

// Where blocks are put: before or after a block (the Move tools), in its place (Replace), or, in a
// drag, beside it and, when they can't be there, at the end nearer the drop of a block around it.
export type MoveSide = 'before' | 'after' | 'replace' | 'nearer'

// Where blocks go, in the page as it is: in place of from–to, with what's put in there.
export interface BlockPlace {
	from: number
	to: number
	content: Fragment
}

// Where blocks put at a spot (from = to), or in place of a block (from–to), go; null when nowhere.
// The page decides what a block may hold, and putting blocks where it doesn't allow them would have
// ProseMirror split blocks or add empty lines to make them fit. So: at the spot if they fit as they
// are, else beside the nearest block around it that holds them, else where one new wrapper holds
// them all (a new list around items), as ProseMirror's own drop does (dropPoint, which here keeps a
// Move tool's side, and checks the wrapper holds every block, not just the first). Replace takes
// only blocks that fit there as they are: a wrapper would make a paragraph a list item. For a move,
// the fit is checked on the page with the blocks taken out: one taken out can be the line an item
// must start with. A move to where the blocks already are goes nowhere; a copy goes there.
export const whereBlocksGo = (
	doc: PMNode,
	blocks: NodePos[],
	from: number,
	to: number,
	side: MoveSide,
	copy = false,
): BlockPlace | null => {
	const content = Fragment.fromArray(blocks.map((p) => nodeAt(doc, p)))
	const end = (p: NodePos) => p + nodeAt(doc, p).nodeSize
	const into = new Transform(doc)
	if (!copy) for (const p of [...blocks].reverse()) into.delete(p, end(p))
	const $into = (pos: number) => into.doc.resolve(into.mapping.map(pos))
	if (side === 'replace') {
		const $a = $into(from)
		const $b = $into(to)
		return $a.sameParent($b) && $a.parent.canReplace($a.index(), $b.index(), content)
			? { from, to, content }
			: null
	}
	const together = blocks.every((p, i) => i === 0 || p === end(blocks[i - 1]!))
	const alreadyThere = (pos: number) =>
		!copy && together && pos >= blocks[0]! && pos <= end(blocks.at(-1)!)
	const $from = doc.resolve(from)
	for (const wrap of [false, true]) {
		for (let d = $from.depth; d >= 0; d--) {
			const around = d < $from.depth
			const after =
				around
				&& (side === 'after'
					|| (side === 'nearer' && from > ($from.start(d + 1) + $from.end(d + 1)) / 2))
			const pos = !around ? from : after ? $from.after(d + 1) : $from.before(d + 1)
			const $pos = $into(pos)
			const put = wrap ? wrapper($pos.parent, $pos.index(), content) : content
			if (!put || !$pos.parent.canReplace($pos.index(), $pos.index(), put)) continue
			return alreadyThere(pos) ? null : { from: pos, to: pos, content: put }
		}
	}
	return null
}

// The blocks inside the new wrapper (or wrappers: a table and a row around cells) that the parent
// takes at index i, or null when there's none or it can't hold them all.
const wrapper = (parent: PMNode, i: number, content: Fragment): Fragment | null => {
	const wrapping = parent.contentMatchAt(i).findWrapping(content.firstChild!.type)
	if (!wrapping?.length) return null
	return wrapping.reduceRight<Fragment | null>(
		(inner, type) =>
			inner && type.validContent(inner) ? Fragment.from(type.create(null, inner)) : null,
		content,
	)
}

// Moves blocksToMoveTo's blocks in one go, to where whereBlocksGo put them: takes them out, then
// puts in what it gave. Returns where they start.
export const moveBlocks = (tr: Transaction, blocks: NodePos[], place: BlockPlace): number => {
	const start = tr.steps.length
	for (const pos of [...blocks].reverse()) tr.delete(pos, pos + nodeAt(tr.doc, pos).nodeSize)
	const mapping = tr.mapping.slice(start)
	const at = mapping.map(place.from)
	tr.replaceWith(at, mapping.map(place.to), place.content)
	return at
}

// A drop of blocks dragged by the handle, moved or (Alt) copied to where whereBlocksGo puts them
// from beside the block under the pointer, with the first selected so the toolbar follows it (a
// TextSelection across a selectable: false block, which a NodeSelection can't hold). Null when
// nothing moves: let go on one of them or inside one, or where they can't go.
export const dropBlocks = (
	view: EditorView,
	event: MouseEvent,
	blocks: NodePos[],
	copy: boolean,
): Transaction | null => {
	const { doc } = view.state
	const target = findBlockAtCoords(view, event)
	const moving = target && blocksToMoveTo(doc, blocks, target.pos)
	if (!target || !moving) return null
	const spot = target.insertBefore ? target.pos : target.pos + target.node.nodeSize
	const place = whereBlocksGo(doc, moving, spot, spot, 'nearer', copy)
	if (!place) return null
	const tr = view.state.tr
	const at = copy ? place.from : moveBlocks(tr, moving, place)
	if (copy) tr.insert(at, place.content)
	const first = tr.doc.nodeAt(at)
	if (first)
		tr.setSelection(
			first.type.spec.selectable === false
				? TextSelection.create(tr.doc, at, at + first.nodeSize)
				: NodeSelection.create(tr.doc, at),
		)
	return tr
}

const MultiSelectExtension = Extension.create({
	name: 'multiSelect',

	addCommands() {
		const ask =
			(action: MultiSelectAction) =>
			({ tr, dispatch }: CommandProps) => {
				if (dispatch) askMultiSelect(tr, action)
				return true
			}
		return {
			addToMultiSelect: (positions) => ask({ action: 'add', positions }),
			removeFromMultiSelect: (pos) => ask({ action: 'remove', pos }),
			clearMultiSelect: () => ask({ action: 'clear' }),
		}
	},

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
						const asked: MultiSelectRequest[] = tr.getMeta(multiSelectPluginKey) ?? []
						let positions = prev.positions
						const applyAskedAt = (at: number) => {
							for (const { action } of asked.filter((r) => r.at === at))
								positions = applyAction(positions, action)
						}
						tr.steps.forEach((step, i) => {
							applyAskedAt(i)
							positions = positions.flatMap((pos) => {
								if (changedInPlace(step, pos, tr.docs[i]!)) return [pos]
								const result = step.getMap().mapResult(pos, 1)
								return result.deleted ? [] : [result.pos as NodePos]
							})
						})
						applyAskedAt(tr.steps.length)
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
// Positions of the blocks being dragged. Set by buildMultiDragSlice (called from the drag
// handle's dragstart), cleared on drop or dragend.
let pendingMultiDrag: NodePos[] | null = null

// The picture that follows the pointer while dragging several blocks: a floating card with
// a count and copies of the first three blocks. It's placed at the page's corner and all but
// invisible; the browser takes its snapshot from it, then it's removed.
const createMultiDragPreview = (view: EditorView, sorted: NodePos[]): HTMLElement => {
	const wrap = document.createElement('div')
	wrap.className = 'sf-depth-3 sl-stack sf-gap-xs'
	wrap.style.cssText =
		'position:fixed;top:0;left:0;pointer-events:none;opacity:0.001;overflow:hidden;max-width:480px;'

	const count = document.createElement('span')
	count.className =
		'sf-counter sf-single-line sf-size-2xs sf-text-xs sf-loudness-3 sf-variant-primary'
	count.textContent = `${sorted.length} blocks`
	count.style.alignSelf = 'start'
	wrap.appendChild(count)

	// Copies render as they do in the editor; the stack's gap spaces them, not their margins.
	const content = document.createElement('div')
	content.className = 'tiptap sl-stack sf-gap-xs'
	for (const pos of sorted.slice(0, 3)) {
		const dom = view.nodeDOM(pos) as HTMLElement | null
		if (!dom) continue
		const clone = dom.cloneNode(true) as HTMLElement
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
	const doc = view.state.doc
	const dragNode = doc.nodeAt(pos)
	if (!dragNode) return null

	// Activate if the dragged node is one that moves or is an ancestor of one (handles the case
	// where activeDepth shows a parent of the selected items). A block inside one that moves is
	// dragged on its own, chosen or not; so is one block to move.
	const sorted = blocksToMove(doc, positions)
	const isRelevant = sorted.some((p) => p === pos || (p > pos && p < pos + dragNode.nodeSize))
	if (!isRelevant || sorted.length < 2) return null
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
	// A placeholder slice: handleDrop does the drop. Alt copies, as with one block.
	return {
		slice: doc.slice(firstPos, firstPos + firstNode.nodeSize),
		move: !event.altKey,
	}
}

const multiDragPlugin = new Plugin({
	props: {
		handleDrop(view, event) {
			if (!pendingMultiDrag) return false
			const blocks = pendingMultiDrag
			pendingMultiDrag = null
			const tr = dropBlocks(view, event, blocks, view.dragging?.move === false)
			view.dragging = null
			if (tr) view.dispatch(askMultiSelect(tr, { action: 'clear' }))
			// Handled even when nothing moves: ProseMirror's own drop would put in the placeholder
			// slice, a copy of the first block.
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
