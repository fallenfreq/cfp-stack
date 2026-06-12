import ToolbarIcon from '@/components/editor/toolbar/ToolbarIcon.vue'
import ToolbarNodePicker, {
	type NodePickerItem,
} from '@/components/editor/toolbar/ToolbarNodePicker.vue'
import { multiSelectPluginKey, type MultiSelectAction } from '@/editor/extensions/multiSelect'
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
import { defineComponent, h } from 'vue'
import { blockNodeEntries, icon } from './defaultItemsShared'
import { toolbarButtonItem, toolbarCustomItem } from './toolbarItemFactory'
import type { ToolbarItemContext } from './types'

const selDispatch = (editor: Editor, action: MultiSelectAction) =>
	editor.view.dispatch(editor.state.tr.setMeta(multiSelectPluginKey, action))

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

const selMoveBefore = (editor: Editor, ctx: ToolbarItemContext) => {
	const nodePos = ctx.nodePos
	if (nodePos === null) return
	const positions = useMultiSelectStore().positions
	if (positions.includes(nodePos)) return
	const sorted = [...positions].sort((a, b) => a - b)
	const content = Fragment.fromArray(sorted.map((p) => nodeAt(editor.state.doc, p)))
	let tr = editor.state.tr
	for (const pos of [...sorted].reverse()) {
		const node = nodeAt(tr.doc, pos)
		tr = tr.delete(pos, pos + node.nodeSize)
	}
	tr = tr.insert(tr.mapping.map(nodePos), content)
	editor.view.dispatch(tr.setMeta(multiSelectPluginKey, { action: 'clear' }))
}

const selMoveAfter = (editor: Editor, ctx: ToolbarItemContext) => {
	const nodePos = ctx.nodePos
	if (nodePos === null) return
	const positions = useMultiSelectStore().positions
	if (positions.includes(nodePos)) return
	const sorted = [...positions].sort((a, b) => a - b)
	const content = Fragment.fromArray(sorted.map((p) => nodeAt(editor.state.doc, p)))
	const targetNode = nodeAt(editor.state.doc, nodePos)
	let tr = editor.state.tr
	for (const pos of [...sorted].reverse()) {
		const node = nodeAt(tr.doc, pos)
		tr = tr.delete(pos, pos + node.nodeSize)
	}
	const insertAt = tr.mapping.map(nodePos + targetNode.nodeSize)
	tr = tr.insert(insertAt, content)
	editor.view.dispatch(tr.setMeta(multiSelectPluginKey, { action: 'clear' }))
}

const selReplace = (editor: Editor, ctx: ToolbarItemContext) => {
	const nodePos = ctx.nodePos
	if (nodePos === null) return
	const positions = useMultiSelectStore().positions
	if (positions.includes(nodePos)) return
	const sorted = [...positions].sort((a, b) => a - b)
	const content = Fragment.fromArray(sorted.map((p) => nodeAt(editor.state.doc, p)))
	const targetNode = nodeAt(editor.state.doc, nodePos)
	let tr = editor.state.tr
	for (const pos of [...sorted].reverse()) {
		const node = nodeAt(tr.doc, pos)
		tr = tr.delete(pos, pos + node.nodeSize)
	}
	tr = tr.replaceWith(
		tr.mapping.map(nodePos),
		tr.mapping.map(nodePos + targetNode.nodeSize),
		content,
	)
	editor.view.dispatch(tr.setMeta(multiSelectPluginKey, { action: 'clear' }))
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
	editor.view.dispatch(
		editor.state.tr
			.replaceWith(firstPos, lastPos + nodeAt(doc, lastPos).nodeSize, wrapper)
			.setMeta(multiSelectPluginKey, { action: 'clear' }),
	)
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
			const positions = useMultiSelectStore().positions
			selDispatch(
				editor,
				positions.includes(nodePos)
					? { action: 'remove', pos: nodePos }
					: { action: 'add', pos: nodePos },
			)
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
			if (pos !== null) selDispatch(editor, { action: 'add', pos })
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
			if (pos !== null) selDispatch(editor, { action: 'add', pos })
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
			if (toAdd.length) selDispatch(editor, { action: 'addMany', positions: toAdd })
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
			if (childPositions.length)
				selDispatch(editor, { action: 'addMany', positions: childPositions })
		},
	}),

	toolbarCustomItem(
		'sel-count',
		() => useMultiSelectStore().positions.length > 0,
		defineComponent({
			inheritAttrs: false,
			setup() {
				const store = useMultiSelectStore()
				return () => h('span', { class: 'sel-count' }, `${store.positions.length} selected`)
			},
		}),
	),

	toolbarButtonItem({
		id: 'sel-move-before',
		tooltip: 'Move before target',
		label: icon('vertical_align_top'),
		show: () => useMultiSelectStore().positions.length > 0,
		disabled: (_, ctx) =>
			ctx.nodePos === null || useMultiSelectStore().positions.includes(ctx.nodePos),
		action: selMoveBefore,
	}),

	toolbarButtonItem({
		id: 'sel-move-after',
		tooltip: 'Move after target',
		label: icon('vertical_align_bottom'),
		show: () => useMultiSelectStore().positions.length > 0,
		disabled: (_, ctx) =>
			ctx.nodePos === null || useMultiSelectStore().positions.includes(ctx.nodePos),
		action: selMoveAfter,
	}),

	toolbarButtonItem({
		id: 'sel-replace',
		tooltip: 'Replace target',
		label: icon('find_replace'),
		show: () => useMultiSelectStore().positions.length > 0,
		disabled: (_, ctx) =>
			ctx.nodePos === null || useMultiSelectStore().positions.includes(ctx.nodePos),
		action: selReplace,
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
			const positions = useMultiSelectStore().positions
			let tr = editor.state.tr
			for (const pos of [...positions].sort((a, b) => b - a)) {
				const node = nodeAt(tr.doc, pos)
				tr = tr.delete(pos, pos + node.nodeSize)
			}
			editor.view.dispatch(tr.setMeta(multiSelectPluginKey, { action: 'clear' }))
		},
	}),

	toolbarButtonItem({
		id: 'sel-clear',
		tooltip: 'Clear selection',
		label: icon('close'),
		show: () => useMultiSelectStore().positions.length > 0,
		action: (editor) => selDispatch(editor, { action: 'clear' }),
	}),
]
