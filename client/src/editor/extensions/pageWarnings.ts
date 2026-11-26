import { componentClassesIn } from '@/editor/componentBoxes'
import type { checkPage, PageWarning } from '@/editor/pageRules'
import type { Wears } from '@/editor/readPage'
import type { Node as PMNode } from '@tiptap/pm/model'
import { type EditorState, Plugin, PluginKey, type Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { type Editor, Extension } from '@tiptap/vue-3'
import { blockWears } from './ownLook'

// Warnings on the blocks (client/src/assets/sf-system.md, "Validator and linter", "Where a rule
// shows"). After each change to the page the rules run, and each block they name wears the
// theme's `sf-is-error` for a problem or `sf-is-warning` for a suggestion, so the theme draws it,
// targeted too (`sf-on-targeted`). The editor's own, a mark is never saved,
// and the rules don't read it: a component's box is read less its decorations
// (customComponentNode.ts), a built-in block from its HTML. The rules load on their own once the
// editor is open (pageRules.ts).

interface Warnings {
	all: readonly PageWarning[]
	marks: DecorationSet
}

const key = new PluginKey<Warnings>('pageWarnings')

// What a run found, given with its transaction, as a meta isn't typed.
const given = new WeakMap<Transaction, readonly PageWarning[]>()

/** The transaction, giving the page these warnings in place of its last; not an edit to undo. */
export const withWarnings = (tr: Transaction, warnings: readonly PageWarning[]) => {
	given.set(tr, warnings)
	return tr.setMeta('addToHistory', false)
}

/** The classes each block always wears, a component's as its box is drawn in this editor. */
export const blockWearsIn = ({
	extensionManager,
	view,
}: Pick<Editor, 'extensionManager' | 'view'>) =>
	blockWears(extensionManager.extensions, componentClassesIn(view))

/** The page's warnings. */
export const pageWarnings = (state: EditorState): readonly PageWarning[] =>
	key.getState(state)?.all ?? []

// The line an inline piece (a span) is in: the nearest block of text around it. None for a block.
const lineOf = (doc: PMNode, pos: number) => {
	const $pos = doc.resolve(pos)
	for (let depth = $pos.depth; depth > 0; depth--)
		if ($pos.node(depth).isTextblock) return $pos.before(depth)
	return undefined
}

/**
 * The warnings shown on the block at `pos`: its own, and on a line those of the inline pieces in
 * it, as the toolbar is mostly on the line.
 */
export const warningsOn = (state: EditorState, pos: number) =>
	pageWarnings(state).filter(({ blocks }) =>
		blocks.some((block) => block === pos || lineOf(state.doc, block) === pos),
	)

/** The next block after the selection with a warning, an inline piece's line for the piece. */
export const nextWarned = (state: EditorState): number | undefined => {
	const shown = new Set(
		pageWarnings(state).flatMap(({ blocks }) =>
			blocks.map((block) => lineOf(state.doc, block) ?? block),
		),
	)
	const inOrder = [...shown].sort((a, b) => a - b)
	return inOrder.find((pos) => pos > state.selection.from) ?? inOrder[0]
}

// How each type shows: a problem as the theme's error, a suggestion as its warning, on a block
// (its mark) and on what points to it (a control's colour).
const howEachTypeShows = {
	problem: { mark: 'sf-is-error', variant: 'danger' },
	suggestion: { mark: 'sf-is-warning', variant: 'warning' },
} as const satisfies Record<PageWarning['type'], { mark: string; variant: string }>

// Where several meet, on a block or on what points to blocks, a problem outranks suggestions.
const howShown = (warnings: readonly PageWarning[]) => {
	const first = warnings.find(({ type }) => type === 'problem') ?? warnings[0]
	return first && howEachTypeShows[first.type]
}

/** The colour of a control pointing to these warnings, as their blocks' lines; none for none. */
export const warningVariantOf = (warnings: readonly PageWarning[]) => howShown(warnings)?.variant

const marksFor = (doc: PMNode, warnings: readonly PageWarning[]) => {
	// Each block's warnings, gathered in one pass: this runs after every change.
	const onBlock = new Map<number, PageWarning[]>()
	for (const warning of warnings)
		for (const block of warning.blocks)
			onBlock.set(block, [...(onBlock.get(block) ?? []), warning])
	return DecorationSet.create(
		doc,
		[...onBlock].flatMap(([pos, named]) => {
			const node = doc.nodeAt(pos)
			const shown = howShown(named)
			return node && shown
				? [Decoration.node(pos, pos + node.nodeSize, { class: shown.mark })]
				: []
		}),
	)
}

/** The plugin; `wearsOf` gives what each block always wears, asked once the page is drawn. */
export const pageWarningsPlugin = (wearsOf: () => Wears) =>
	new Plugin<Warnings>({
		key,
		state: {
			init: () => ({ all: [], marks: DecorationSet.empty }),
			apply(tr, warnings) {
				const found = given.get(tr)
				if (found) return { all: found, marks: marksFor(tr.doc, found) }
				if (!tr.docChanged) return warnings
				// Where each block has gone, until the rules run again straight after.
				return {
					all: warnings.all.map((warning) => ({
						...warning,
						blocks: warning.blocks.map((block) => tr.mapping.map(block)),
					})),
					marks: warnings.marks.map(tr.mapping, tr.doc),
				}
			},
		},
		props: { decorations: (state) => key.getState(state)?.marks },
		view(view) {
			let check: typeof checkPage | undefined
			let wears: Wears | undefined
			let queued = false
			let gone = false
			// After the change's own dispatch, so once it's drawn: a component's own classes are
			// read from its drawn box. Once for any number of changes made together.
			const run = () => {
				queued = false
				if (gone || !check) return
				wears ??= wearsOf()
				view.dispatch(withWarnings(view.state.tr, check(view.state.doc, wears)))
			}
			const queue = () => {
				if (queued) return
				queued = true
				queueMicrotask(run)
			}
			void import('@/editor/pageRules').then((rules) => {
				check = rules.checkPage
				queue()
			})
			return {
				update: (_, before) => {
					if (view.state.doc !== before.doc) queue()
				},
				destroy: () => {
					gone = true
				},
			}
		},
	})

export const PageWarnings = Extension.create({
	name: 'pageWarnings',

	addProseMirrorPlugins() {
		const { editor } = this
		return [pageWarningsPlugin(() => blockWearsIn(editor))]
	},
})
