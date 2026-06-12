import ToolbarNodePicker, {
	type NodePickerItem,
} from '@/components/editor/toolbar/ToolbarNodePicker.vue'
import { useEditorStore } from '@/stores/editorStore'
import { prettifySelectedCode } from '@/utils/editor/editorUtils'
import { Fragment } from '@tiptap/pm/model'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import {
	blockNodeEntries,
	canReplaceNodeType,
	EXCLUDED_NODE_TYPES,
	icon,
	isFormattableTextblock,
	isInTable,
	isListNode,
	isNotCodeView,
	isParagraphOrHeading,
	isTextblock,
	LIST_ITEM_MAP,
	NODE_META,
	replaceNodeType,
	resolveActivePos,
} from './defaultItemsShared'
import { toolbarButtonItem, toolbarCustomItem } from './toolbarItemFactory'
import type { ToolbarItemContext } from './types'

// TipTap's toggleList fast-path uses setNodeMarkup when validContent passes — this only works
// when both lists share the same item type (listItem for bullet/ordered). For taskList the item
// type is taskItem, so the check fails and the fallback doesn't convert item types either.
// This function rewrites each item node to the target type via a direct transaction.
const switchListType = (
	editor: Editor,
	ctx: ToolbarItemContext,
	targetListTypeName: string,
	targetItemTypeName: string,
) => {
	const { state, view } = editor
	const { schema } = state
	const targetListType = schema.nodes[targetListTypeName]
	const targetItemType = schema.nodes[targetItemTypeName]
	if (!targetListType || !targetItemType) return

	const { $pos, depth } = resolveActivePos(editor, ctx)
	if (depth === 0) return
	const listNode = $pos.node(depth)
	const listPos = $pos.before(depth)

	const newItems: ReturnType<typeof targetItemType.create>[] = []
	listNode.forEach((item) => {
		newItems.push(
			targetItemType.create(
				targetItemTypeName === 'taskItem' ? { checked: false } : {},
				item.content,
			),
		)
	})

	const cursorOffset = state.selection.from - listPos
	const tr = state.tr.replaceWith(
		listPos,
		listPos + listNode.nodeSize,
		targetListType.create({}, newItems),
	)
	tr.setSelection(TextSelection.near(tr.doc.resolve(listPos + cursorOffset)))
	view.dispatch(tr)
}

// Same pattern as canReplaceNodeType but for wrapping: parent accepts wrapType and
// wrapType accepts the active node as its sole child.
const canWrapNodeInType = (editor: Editor, ctx: ToolbarItemContext, typeName: string): boolean => {
	const wrapType = editor.state.schema.nodes[typeName]
	if (!wrapType) return false
	const { $pos, depth } = resolveActivePos(editor, ctx)
	if (depth === 0) return false
	const node = $pos.node(depth)
	const parent = $pos.node(depth - 1)
	const index = $pos.index(depth - 1)
	return (
		parent.canReplaceWith(index, index + 1, wrapType)
		&& wrapType.validContent(Fragment.from(node))
	)
}

const wrapNodeInType = (editor: Editor, ctx: ToolbarItemContext, typeName: string): void => {
	const wrapType = editor.state.schema.nodes[typeName]
	if (!wrapType) return
	const { $pos, depth } = resolveActivePos(editor, ctx)
	if (depth === 0) return
	const node = $pos.node(depth)
	const nodePos = $pos.before(depth)
	// ProseMirror maps the selection through the transaction automatically.
	editor.view.dispatch(
		editor.state.tr.replaceWith(
			nodePos,
			nodePos + node.nodeSize,
			wrapType.create(null, Fragment.from(node)),
		),
	)
}

const getTurnIntoItems = (editor: Editor, ctx: ToolbarItemContext): NodePickerItem[] => {
	const items: NodePickerItem[] = []
	const sourceItemType = LIST_ITEM_MAP[ctx.activeNode.type.name]
	for (const { typeName, attrs, label, iconName } of blockNodeEntries(editor)) {
		const hasAttrs = Object.keys(attrs).length > 0
		// setNode is cursor-based — only use it when the active node IS the textblock
		// the cursor is in, otherwise it would convert the inner paragraph instead.
		const canSet = ctx.activeNode.type.isTextblock && editor.can().setNode(typeName, attrs)
		const canReplace = !canSet && canReplaceNodeType(editor, ctx, typeName, attrs)
		// Cross-item-type list switch (taskList ↔ bulletList/orderedList) — needs
		// switchListType because canReplaceNodeType's validContent check rejects
		// converting between listItem+ and taskItem+ content.
		const targetItemType = LIST_ITEM_MAP[typeName]
		const isListSwitch =
			!hasAttrs && !!sourceItemType && !!targetItemType && sourceItemType !== targetItemType
		if (!canSet && !canReplace && !isListSwitch) continue
		items.push({
			label,
			iconName,
			active: hasAttrs ? editor.isActive(typeName, attrs) : editor.isActive(typeName),
			action: () => {
				if (canSet) editor.chain().focus().setNode(typeName, attrs).run()
				else if (canReplace) replaceNodeType(editor, ctx, typeName, attrs)
				else if (isListSwitch) switchListType(editor, ctx, typeName, targetItemType!)
			},
		})
	}
	return items
}

const getWrapInItems = (editor: Editor, ctx: ToolbarItemContext): NodePickerItem[] => {
	const { selection } = editor.state
	const isInlineContext =
		!selection.empty
		&& !(selection instanceof NodeSelection)
		&& selection.$from.parent.inlineContent

	if (isInlineContext) {
		const items: NodePickerItem[] = []
		for (const [typeName, type] of Object.entries(editor.schema.nodes)) {
			if (EXCLUDED_NODE_TYPES.has(typeName) || !type.isInline || type.isLeaf) continue
			const meta = NODE_META[typeName] ?? { label: typeName, iconName: 'widgets' }
			items.push({
				label: meta.label,
				iconName: meta.iconName,
				active: editor.isActive(typeName),
				action: () => {
					const { from, to } = editor.state.selection
					const content = editor.state.doc.slice(from, to).content
					const nodeType = editor.state.schema.nodes[typeName]
					if (!nodeType) return
					const node = nodeType.create({}, content)
					editor.view.dispatch(editor.state.tr.replaceWith(from, to, node))
				},
			})
		}
		return items
	}

	const { $pos, depth } = resolveActivePos(editor, ctx)
	const items: NodePickerItem[] = []
	for (const { typeName, label, iconName } of blockNodeEntries(editor)) {
		if (!canWrapNodeInType(editor, ctx, typeName)) continue
		items.push({
			label,
			iconName,
			active: depth > 0 && $pos.node(depth - 1).type.name === typeName,
			action: () => wrapNodeInType(editor, ctx, typeName),
		})
	}
	return items
}

const getInsertIntoItems = (editor: Editor, ctx: ToolbarItemContext): NodePickerItem[] => {
	const { $pos, depth } = resolveActivePos(editor, ctx)
	if (depth === 0) return []
	const node = $pos.node(depth)
	const match = node.type.contentMatch.matchFragment(node.content)
	if (!match) return []

	return blockNodeEntries(editor)
		.filter(({ type }) => match.matchType(type) !== null)
		.map(({ type, attrs, label, iconName }) => ({
			label,
			iconName,
			active: false,
			action: () => {
				const { $pos: p, depth: d } = resolveActivePos(editor, ctx)
				if (d === 0) return
				const n = p.node(d)
				const nPos = p.before(d)
				const insertPos = nPos + n.nodeSize - 1
				const newNode = type.createAndFill(attrs)
				if (!newNode) return
				const tr = editor.state.tr.insert(insertPos, newNode)
				tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)))
				editor.view.dispatch(tr.scrollIntoView())
			},
		}))
}

export const blockItems = [
	// --- Undo / Redo ---
	toolbarButtonItem({
		id: 'undo',
		tooltip: 'Undo',
		label: icon('undo'),
		show: isNotCodeView,
		disabled: (editor) => !editor.can().undo(),
		action: (editor) => editor.chain().focus().undo().run(),
	}),
	toolbarButtonItem({
		id: 'redo',
		tooltip: 'Redo',
		label: icon('redo'),
		show: isNotCodeView,
		disabled: (editor) => !editor.can().redo(),
		action: (editor) => editor.chain().focus().redo().run(),
	}),

	// --- Inline marks (any textblock) ---
	toolbarButtonItem({
		id: 'bold',
		tooltip: 'Bold',
		label: icon('format_bold'),
		show: isFormattableTextblock,
		active: (editor) => editor.isActive('bold'),
		action: (editor) => editor.chain().focus().toggleBold().run(),
	}),
	toolbarButtonItem({
		id: 'italic',
		tooltip: 'Italic',
		label: icon('format_italic'),
		show: isFormattableTextblock,
		active: (editor) => editor.isActive('italic'),
		action: (editor) => editor.chain().focus().toggleItalic().run(),
	}),
	toolbarButtonItem({
		id: 'strike',
		tooltip: 'Strikethrough',
		label: icon('format_strikethrough'),
		show: isFormattableTextblock,
		active: (editor) => editor.isActive('strike'),
		action: (editor) => editor.chain().focus().toggleStrike().run(),
	}),
	toolbarButtonItem({
		id: 'inline-code',
		tooltip: 'Inline Code',
		label: icon('code'),
		show: isFormattableTextblock,
		active: (editor) => editor.isActive('code'),
		action: (editor) => editor.chain().focus().toggleCode().run(),
	}),

	// --- Block conversions (paragraph or heading) ---
	toolbarButtonItem({
		id: 'code-block',
		tooltip: 'Code Block',
		label: icon('data_object'),
		show: isTextblock,
		active: (editor) => editor.isActive('codeBlock'),
		action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
	}),
	toolbarButtonItem({
		id: 'heading-1',
		tooltip: 'Heading 1',
		label: icon('format_h1'),
		show: isParagraphOrHeading,
		active: (_editor, ctx) =>
			ctx.activeNode.type.name === 'heading' && ctx.activeNode.attrs.level === 1,
		action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
	}),
	toolbarButtonItem({
		id: 'heading-2',
		tooltip: 'Heading 2',
		label: icon('format_h2'),
		show: isParagraphOrHeading,
		active: (_editor, ctx) =>
			ctx.activeNode.type.name === 'heading' && ctx.activeNode.attrs.level === 2,
		action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
	}),
	toolbarButtonItem({
		id: 'heading-3',
		tooltip: 'Heading 3',
		label: icon('format_h3'),
		show: isParagraphOrHeading,
		active: (_editor, ctx) =>
			ctx.activeNode.type.name === 'heading' && ctx.activeNode.attrs.level === 3,
		action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
	}),
	toolbarButtonItem({
		id: 'blockquote',
		tooltip: 'Blockquote',
		label: icon('format_quote'),
		show: isParagraphOrHeading,
		active: (editor, ctx) => {
			const { $pos, depth } = resolveActivePos(editor, ctx)
			return depth > 0 && $pos.node(depth - 1).type.name === 'blockquote'
		},
		action: (editor) => editor.chain().focus().toggleBlockquote().run(),
	}),
	toolbarButtonItem({
		id: 'bullet-list',
		tooltip: 'Bullet List',
		label: icon('format_list_bulleted'),
		show: isParagraphOrHeading,
		active: (editor, ctx) => {
			const { $pos, depth } = resolveActivePos(editor, ctx)
			// listItem sits between bulletList and the paragraph; check up to 2 levels
			return (
				(depth > 0 && $pos.node(depth - 1).type.name === 'bulletList')
				|| (depth > 1 && $pos.node(depth - 2).type.name === 'bulletList')
			)
		},
		action: (editor) => editor.chain().focus().toggleBulletList().run(),
	}),
	toolbarButtonItem({
		id: 'ordered-list',
		tooltip: 'Numbered List',
		label: icon('format_list_numbered'),
		show: isParagraphOrHeading,
		active: (editor, ctx) => {
			const { $pos, depth } = resolveActivePos(editor, ctx)
			return (
				(depth > 0 && $pos.node(depth - 1).type.name === 'orderedList')
				|| (depth > 1 && $pos.node(depth - 2).type.name === 'orderedList')
			)
		},
		action: (editor) => editor.chain().focus().toggleOrderedList().run(),
	}),

	// --- Insert / Turn into / Wrap in / Unwrap / Delete ---
	toolbarCustomItem(
		'insert',
		(_e, ctx) =>
			ctx.activeDepth > 0
			&& !ctx.activeNode.type.isLeaf
			&& !ctx.activeNode.type.isTextblock
			&& isNotCodeView(),
		ToolbarNodePicker,
		{ props: { iconName: 'add', getItems: getInsertIntoItems }, tooltip: 'Insert' },
	),
	toolbarCustomItem(
		'turn-into',
		// !isLeaf: for a leaf NodeSelection resolveActivePos resolves to the parent, giving wrong results
		(_e, ctx) =>
			ctx.activeDepth > 0 && !ctx.activeNode.type.isLeaf && !useEditorStore().isCodeView,
		ToolbarNodePicker,
		{
			props: { iconName: 'change_circle', getItems: getTurnIntoItems },
			tooltip: 'Change Type',
		},
	),
	toolbarCustomItem(
		'wrap-in',
		(editor, ctx) =>
			!useEditorStore().isCodeView
			&& (ctx.nodePos !== null
				|| (!editor.state.selection.empty
					&& editor.state.selection.$from.parent.inlineContent)),
		ToolbarNodePicker,
		{ props: { iconName: 'frame_source', getItems: getWrapInItems }, tooltip: 'Wrap In' },
	),
	toolbarButtonItem({
		id: 'unwrap-node',
		tooltip: 'Unwrap',
		label: icon('move_up'),
		show: (editor, ctx) => {
			if (ctx.activeNode.type.isTextblock || ctx.activeNode.type.isLeaf) return false
			if (ctx.activeNode.childCount === 0) return false
			const { $pos, depth } = resolveActivePos(editor, ctx)
			if (depth === 0) return false
			const parent = $pos.node(depth - 1)
			const index = $pos.index(depth - 1)
			return parent.canReplace(index, index + 1, ctx.activeNode.content)
		},
		action: (editor, ctx) => {
			const { $pos, depth } = resolveActivePos(editor, ctx)
			if (depth === 0) return
			const nodePos = $pos.before(depth)
			const node = $pos.node(depth)
			const tr = editor.state.tr.replaceWith(nodePos, nodePos + node.nodeSize, node.content)
			editor.view.dispatch(tr)
		},
	}),
	toolbarButtonItem({
		id: 'delete-node',
		tooltip: 'Delete Node',
		label: icon('delete'),
		show: (_e, ctx) => ctx.activeNode.type.name !== 'doc',
		action: (editor, ctx) => {
			const { selection } = editor.state
			if (selection instanceof NodeSelection) {
				editor.chain().focus().deleteSelection().run()
				return
			}
			const { $pos, depth } = resolveActivePos(editor, ctx)
			if (depth === 0) return
			editor.chain().focus().setNodeSelection($pos.before(depth)).deleteSelection().run()
		},
	}),

	// --- Code block controls ---
	toolbarButtonItem({
		id: 'format',
		tooltip: 'Format Code',
		label: icon('auto_fix_high'),
		show: (_editor, ctx) => ctx.activeNode.type.name === 'codeBlock',
		action: (editor) => prettifySelectedCode(editor),
	}),

	// --- List switching (when active node is a list wrapper) ---
	toolbarButtonItem({
		id: 'list-bullet',
		tooltip: 'Bullet List',
		label: icon('format_list_bulleted'),
		show: isListNode,
		active: (_editor, ctx) => ctx.activeNode.type.name === 'bulletList',
		action: (editor, ctx) =>
			ctx.activeNode.type.name === 'taskList'
				? switchListType(editor, ctx, 'bulletList', 'listItem')
				: editor.chain().focus().toggleBulletList().run(),
	}),
	toolbarButtonItem({
		id: 'list-ordered',
		tooltip: 'Numbered List',
		label: icon('format_list_numbered'),
		show: isListNode,
		active: (_editor, ctx) => ctx.activeNode.type.name === 'orderedList',
		action: (editor, ctx) =>
			ctx.activeNode.type.name === 'taskList'
				? switchListType(editor, ctx, 'orderedList', 'listItem')
				: editor.chain().focus().toggleOrderedList().run(),
	}),
	toolbarButtonItem({
		id: 'list-task',
		tooltip: 'Task List',
		label: icon('checklist'),
		show: isListNode,
		active: (_editor, ctx) => ctx.activeNode.type.name === 'taskList',
		action: (editor, ctx) =>
			ctx.activeNode.type.name !== 'taskList'
				? switchListType(editor, ctx, 'taskList', 'taskItem')
				: editor.chain().focus().toggleTaskList().run(),
	}),

	// --- Table controls ---
	toolbarButtonItem({
		id: 'table-add-row-before',
		label: '+ Row ↑',
		show: isInTable,
		disabled: (editor) => !editor.can().addRowBefore(),
		action: (editor) => editor.chain().focus().addRowBefore().run(),
	}),
	toolbarButtonItem({
		id: 'table-add-row-after',
		label: '+ Row ↓',
		show: isInTable,
		disabled: (editor) => !editor.can().addRowAfter(),
		action: (editor) => editor.chain().focus().addRowAfter().run(),
	}),
	toolbarButtonItem({
		id: 'table-delete-row',
		label: 'Del Row',
		show: isInTable,
		disabled: (editor) => !editor.can().deleteRow(),
		action: (editor) => editor.chain().focus().deleteRow().run(),
	}),
	toolbarButtonItem({
		id: 'table-add-col-before',
		label: '+ Col ←',
		show: isInTable,
		disabled: (editor) => !editor.can().addColumnBefore(),
		action: (editor) => editor.chain().focus().addColumnBefore().run(),
	}),
	toolbarButtonItem({
		id: 'table-add-col-after',
		label: '+ Col →',
		show: isInTable,
		disabled: (editor) => !editor.can().addColumnAfter(),
		action: (editor) => editor.chain().focus().addColumnAfter().run(),
	}),
	toolbarButtonItem({
		id: 'table-delete-col',
		label: 'Del Col',
		show: isInTable,
		disabled: (editor) => !editor.can().deleteColumn(),
		action: (editor) => editor.chain().focus().deleteColumn().run(),
	}),
]
