import ToolbarIcon from '@/components/editor/toolbar/ToolbarIcon.vue'
import ToolbarNodePicker, {
	type NodePickerItem,
} from '@/components/editor/toolbar/ToolbarNodePicker.vue'
import {
	blocksToMove,
	blocksToMoveTo,
	moveBlocks,
	whereBlocksGo,
	type MoveSide,
} from '@/editor/extensions/multiSelect'
import { useMultiSelectStore } from '@/stores/multiSelectStore'
import {
	allAreSiblings,
	getChildBlockPositions,
	getSiblingPositions,
	nodeAt,
	type NodePos,
} from '@/utils/editor/editorUtils'
import { Fragment } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/vue-3'
import { h } from 'vue'
import { blockNodeEntries, icon } from './defaultItemsShared'
import { toolbarButtonItem, toolbarCustomItem, toolbarItem } from './toolbarItemFactory'
import type { ToolbarItemContext } from './types'

const selPrevUnselected = (editor: Editor, ctx: ToolbarItemContext): NodePos | null => {
	if (ctx.nodePos === null) return null
	const positions = useMultiSelectStore().positions
	const siblings = getSiblingPositions(editor.state.doc, ctx.nodePos)
	const idx = siblings.indexOf(ctx.nodePos)
	for (let i = idx - 1; i >= 0; i--) {
		const p = siblings[i]
		if (p !== undefined && !positions.includes(p)) return p
	}
	return null
}

const selNextUnselected = (editor: Editor, ctx: ToolbarItemContext): NodePos | null => {
	if (ctx.nodePos === null) return null
	const positions = useMultiSelectStore().positions
	const siblings = getSiblingPositions(editor.state.doc, ctx.nodePos)
	const idx = siblings.indexOf(ctx.nodePos)
	for (let i = idx + 1; i < siblings.length; i++) {
		const p = siblings[i]
		if (p !== undefined && !positions.includes(p)) return p
	}
	return null
}

// The chosen blocks that move before the target, after it, or in its place, and where they go; null
// when they can't (the target is one of them or inside one, or they don't fit or are there already:
// whereBlocksGo), and the tool is greyed out.
const selMovePlace = (
	editor: Editor,
	ctx: ToolbarItemContext,
	where: Exclude<MoveSide, 'nearer'>,
) => {
	const nodePos = ctx.nodePos
	if (nodePos === null) return null
	const doc = editor.state.doc
	const blocks = blocksToMoveTo(doc, useMultiSelectStore().positions, nodePos)
	if (!blocks) return null
	const end = nodePos + nodeAt(doc, nodePos).nodeSize
	const from = where === 'after' ? end : nodePos
	const to = where === 'before' ? nodePos : end
	const place = whereBlocksGo(doc, blocks, from, to, where)
	return place && { blocks, place }
}

// Moves the chosen blocks before the target, after it, or in its place. Asked first: a chain sends
// its change whatever its commands return, and would clear the chosen blocks with nothing moved.
const selMove = (editor: Editor, ctx: ToolbarItemContext, where: Exclude<MoveSide, 'nearer'>) => {
	const move = selMovePlace(editor, ctx, where)
	if (!move) return
	editor
		.chain()
		.command(({ tr }) => {
			moveBlocks(tr, move.blocks, move.place)
			return true
		})
		.clearMultiSelect()
		.run()
}

const canWrapSiblingsInType = (editor: Editor, positions: NodePos[], typeName: string): boolean => {
	const wrapType = editor.state.schema.nodes[typeName]
	if (!wrapType) return false
	const doc = editor.state.doc
	const sorted = [...positions].sort((a, b) => a - b)
	const [firstPos] = sorted
	if (firstPos === undefined) return false
	const $first = doc.resolve(firstPos)
	const startIndex = $first.index()
	return (
		$first.parent.canReplaceWith(startIndex, startIndex + sorted.length, wrapType)
		&& wrapType.validContent(Fragment.fromArray(sorted.map((p) => nodeAt(doc, p))))
	)
}

const wrapSiblingsInType = (editor: Editor, positions: NodePos[], typeName: string): void => {
	const wrapType = editor.state.schema.nodes[typeName]
	if (!wrapType) return
	const doc = editor.state.doc
	const sorted = [...positions].sort((a, b) => a - b)
	const [firstPos] = sorted
	if (firstPos === undefined) return
	const lastPos = sorted[sorted.length - 1] ?? firstPos
	const wrapper = wrapType.create(null, Fragment.fromArray(sorted.map((p) => nodeAt(doc, p))))
	editor
		.chain()
		.command(({ tr }) => {
			tr.replaceWith(firstPos, lastPos + nodeAt(doc, lastPos).nodeSize, wrapper)
			return true
		})
		.clearMultiSelect()
		.run()
}

const getSelWrapItems = (editor: Editor, _ctx: ToolbarItemContext): NodePickerItem[] => {
	const positions = useMultiSelectStore().positions
	const items: NodePickerItem[] = []
	for (const { typeName, label, iconName } of blockNodeEntries(editor)) {
		if (!canWrapSiblingsInType(editor, positions, typeName)) continue
		items.push({
			label,
			iconName,
			active: false,
			action: () => wrapSiblingsInType(editor, positions, typeName),
		})
	}
	return items
}

export const multiSelectItems = [
	// --- Virtual selection ---

	toolbarButtonItem({
		id: 'sel-add',
		tooltip: 'Toggle selection',
		label: (_, ctx) => {
			const inSel =
				ctx.nodePos !== null && useMultiSelectStore().positions.includes(ctx.nodePos)
			return h(ToolbarIcon, null, () => (inSel ? 'check_box' : 'check_box_outline_blank'))
		},
		show: (_, ctx) => ctx.nodePos !== null,
		active: (_, ctx) =>
			ctx.nodePos !== null && useMultiSelectStore().positions.includes(ctx.nodePos),
		action: (editor, ctx) => {
			const nodePos = ctx.nodePos
			if (nodePos === null) return
			if (useMultiSelectStore().positions.includes(nodePos))
				editor.commands.removeFromMultiSelect(nodePos)
			else editor.commands.addToMultiSelect([nodePos])
		},
	}),

	toolbarButtonItem({
		id: 'sel-prev',
		tooltip: 'Add previous sibling',
		label: icon('keyboard_arrow_up'),
		show: (editor, ctx) =>
			useMultiSelectStore().positions.length > 0
			&& ctx.nodePos !== null
			&& selPrevUnselected(editor, ctx) !== null,
		action: (editor, ctx) => {
			const pos = selPrevUnselected(editor, ctx)
			if (pos !== null) editor.commands.addToMultiSelect([pos])
		},
	}),

	toolbarButtonItem({
		id: 'sel-next',
		tooltip: 'Add next sibling',
		label: icon('keyboard_arrow_down'),
		show: (editor, ctx) =>
			useMultiSelectStore().positions.length > 0
			&& ctx.nodePos !== null
			&& selNextUnselected(editor, ctx) !== null,
		action: (editor, ctx) => {
			const pos = selNextUnselected(editor, ctx)
			if (pos !== null) editor.commands.addToMultiSelect([pos])
		},
	}),

	toolbarButtonItem({
		id: 'sel-all-siblings',
		tooltip: 'Add all siblings',
		label: icon('select_all'),
		show: (editor, ctx) => {
			if (useMultiSelectStore().positions.length === 0 || ctx.nodePos === null) return false
			const positions = useMultiSelectStore().positions
			return getSiblingPositions(editor.state.doc, ctx.nodePos).some(
				(p) => p !== ctx.nodePos && !positions.includes(p),
			)
		},
		action: (editor, ctx) => {
			if (ctx.nodePos === null) return
			const positions = useMultiSelectStore().positions
			const toAdd = getSiblingPositions(editor.state.doc, ctx.nodePos).filter(
				(p) => !positions.includes(p),
			)
			if (toAdd.length) editor.commands.addToMultiSelect(toAdd)
		},
	}),

	toolbarButtonItem({
		id: 'sel-all-children',
		tooltip: 'Add all children',
		label: icon('unfold_more'),
		show: (editor, ctx) =>
			useMultiSelectStore().positions.length > 0
			&& ctx.nodePos !== null
			&& getChildBlockPositions(editor.state.doc, ctx.nodePos).length > 0,
		action: (editor, ctx) => {
			if (ctx.nodePos === null) return
			const childPositions = getChildBlockPositions(editor.state.doc, ctx.nodePos)
			if (childPositions.length) editor.commands.addToMultiSelect(childPositions)
		},
	}),

	// Not a button: how many blocks are selected.
	toolbarItem(
		'sel-count',
		() => useMultiSelectStore().positions.length > 0,
		() =>
			h(
				'span',
				{ class: 'sel-count sf-loudness-1 sf-single-line sf-text-xs' },
				`${useMultiSelectStore().positions.length} selected`,
			),
	),

	toolbarButtonItem({
		id: 'sel-move-before',
		tooltip: 'Move before target',
		label: icon('vertical_align_top'),
		show: () => useMultiSelectStore().positions.length > 0,
		disabled: (editor, ctx) => !selMovePlace(editor, ctx, 'before'),
		action: (editor, ctx) => selMove(editor, ctx, 'before'),
	}),

	toolbarButtonItem({
		id: 'sel-move-after',
		tooltip: 'Move after target',
		label: icon('vertical_align_bottom'),
		show: () => useMultiSelectStore().positions.length > 0,
		disabled: (editor, ctx) => !selMovePlace(editor, ctx, 'after'),
		action: (editor, ctx) => selMove(editor, ctx, 'after'),
	}),

	toolbarButtonItem({
		id: 'sel-replace',
		tooltip: 'Replace target',
		label: icon('find_replace'),
		show: () => useMultiSelectStore().positions.length > 0,
		disabled: (editor, ctx) => !selMovePlace(editor, ctx, 'replace'),
		action: (editor, ctx) => selMove(editor, ctx, 'replace'),
	}),

	toolbarCustomItem(
		'sel-wrap',
		(editor) => {
			const positions = useMultiSelectStore().positions
			return positions.length > 0 && allAreSiblings(editor.state.doc, positions)
		},
		ToolbarNodePicker,
		{ props: { iconName: 'wrap_text', getItems: getSelWrapItems }, tooltip: 'Wrap selection' },
	),

	toolbarButtonItem({
		id: 'sel-delete',
		tooltip: 'Delete selected',
		label: icon('delete'),
		show: () => useMultiSelectStore().positions.length > 0,
		action: (editor) => {
			const blocks = blocksToMove(editor.state.doc, useMultiSelectStore().positions)
			editor
				.chain()
				.command(({ tr }) => {
					// As the Delete key takes each (tr.deleteRange): a list or quote left empty goes
					// too. Last first, and a block inside a chosen one goes with it: deleted first, it
					// would take its emptied block, then what came next in that block's place.
					for (const pos of [...blocks].reverse())
						tr.deleteRange(pos, pos + nodeAt(tr.doc, pos).nodeSize)
					return true
				})
				.clearMultiSelect()
				.run()
		},
	}),

	toolbarButtonItem({
		id: 'sel-clear',
		tooltip: 'Clear selection',
		label: icon('close'),
		show: () => useMultiSelectStore().positions.length > 0,
		action: (editor) => editor.commands.clearMultiSelect(),
	}),
]
