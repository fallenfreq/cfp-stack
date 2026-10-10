import { findBlockAtCoords, nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import { Fragment, type Node as PMNode } from '@tiptap/pm/model'
import { NodeSelection, Plugin, PluginKey, TextSelection, type Transaction } from '@tiptap/pm/state'
import { ReplaceAroundStep, ReplaceStep, type Step } from '@tiptap/pm/transform'
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
// Positions of the nodes being dragged. Set by buildMultiDragSlice (called from the drag
// handle's dragstart), cleared on drop or dragend.
let pendingMultiDrag: NodePos[] | null = null

// The picture that follows the pointer while dragging several nodes: a floating card with
// a count and copies of the first three nodes. It's placed at the page's corner and all but
// invisible; the browser takes its snapshot from it, then it's removed.
const createMultiDragPreview = (view: EditorView, sorted: NodePos[]): HTMLElement => {
	const wrap = document.createElement('div')
	wrap.className = 'sf-depth-3 sl-stack sf-gap-xs'
	wrap.style.cssText =
		'position:fixed;top:0;left:0;pointer-events:none;opacity:0.001;overflow:hidden;max-width:480px;'

	const count = document.createElement('span')
	count.className =
		'sf-counter sf-single-line sf-size-2xs sf-text-xs sf-loudness-3 sf-variant-primary'
	count.textContent = `${sorted.length} nodes`
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
	if (positions.length < 2) return null

	const doc = view.state.doc
	const dragNode = doc.nodeAt(pos)
	if (!dragNode) return null

	// Activate if the dragged node is selected or is an ancestor of a selected node
	// (handles the case where activeDepth shows a parent of the selected items)
	const isRelevant = positions.some((p) => p === pos || (p > pos && p < pos + dragNode.nodeSize))
	if (!isRelevant) return null

	const sorted = [...positions].sort((a, b) => a - b)
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
			// Return true to consume the event without inserting — prevents PM's own drop
			// handler from inserting the placeholder slice (phantom copy of the first node).
			if (!target || sorted.includes(target.pos)) return true

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
			// Mirror native single-drag behavior: select the first dropped node so the
			// toolbar repositions to it.  NodeSelection for selectable nodes (gives the
			// "node-selected" outline); TextSelection spanning the node for
			// selectable:false wrappers (NodeSelection.create would throw).
			const firstInserted = tr.doc.nodeAt(insertAt)
			if (firstInserted) {
				const newSelection =
					firstInserted.type.spec.selectable === false
						? TextSelection.create(tr.doc, insertAt, insertAt + firstInserted.nodeSize)
						: NodeSelection.create(tr.doc, insertAt)
				tr = tr.setSelection(newSelection)
			}
			tr = askMultiSelect(tr, { action: 'clear' })
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
