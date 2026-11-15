import ToolbarNodePicker, {
	type NodePickerItem,
} from '@/components/editor/toolbar/ToolbarNodePicker.vue'
import { languages } from '@/config/editor/lowlight'
import { getExtensionOptions, prettifySelectedCode } from '@/utils/editor/editorUtils'
import { getHeadingName, getNodeAlias } from '@/utils/editor/nodeRegistry'
import type { BulletListOptions, OrderedListOptions, TaskListOptions } from '@tiptap/extension-list'
import { Fragment, type ResolvedPos } from '@tiptap/pm/model'
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
	isParagraphOrHeading,
	isTextblock,
	NODE_ICONS,
	replaceNodeType,
	resolveActivePos,
} from './defaultItemsShared'
import { toolbarButtonItem, toolbarCustomItem } from './toolbarItemFactory'
import type { ToolbarItemContext } from './types'

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

// The type of item a list holds, as its TipTap extension has it; undefined for any other block.
const listItemType = (editor: Editor, typeName: string) =>
	getExtensionOptions<Partial<BulletListOptions | OrderedListOptions | TaskListOptions>>(
		editor,
		typeName,
	)?.itemTypeName

// The list's buttons and Change Type change the list the toolbar is on, the node path's target,
// as its other block tools do; the keys change the list the cursor is in. TipTap's list command
// acts on the selection, so the list is selected as a whole for it
// (patches/@tiptap__core@3.32.0.patch), then a cursor or text selection is put back: where the
// command wrote the list anew, its items one for one, the text is where it was. Any other
// selection ends with the list selected.
const changeTargetList = (editor: Editor, ctx: ToolbarItemContext, typeName: string) => {
	const at = ctx.nodePos
	const list = at === null ? null : editor.state.doc.nodeAt(at)
	const itemType = listItemType(editor, typeName)
	if (at === null || !list || !listItemType(editor, list.type.name) || !itemType) return
	const { selection } = editor.state
	editor
		.chain()
		.focus()
		.setNodeSelection(at)
		.toggleList(typeName, itemType)
		.command(({ tr }) => {
			if (!(selection instanceof TextSelection)) return true
			const back = ({ pos, parent }: ResolvedPos) => {
				const mapped = tr.mapping.mapResult(pos)
				if (!mapped.deleted) return mapped.pos
				return pos <= tr.doc.content.size && tr.doc.resolve(pos).parent === parent
					? pos
					: null
			}
			const anchor = back(selection.$anchor)
			const head = back(selection.$head)
			if (anchor !== null && head !== null)
				tr.setSelection(TextSelection.create(tr.doc, anchor, head))
			return true
		})
		.run()
}

const getTurnIntoItems = (editor: Editor, ctx: ToolbarItemContext): NodePickerItem[] => {
	const items: NodePickerItem[] = []
	const sourceItemType = listItemType(editor, ctx.activeNode.type.name)
	for (const { typeName, type, attrs, label, iconName } of blockNodeEntries(editor)) {
		const hasAttrs = Object.keys(attrs).length > 0
		// setNode is cursor-based — only use it when the active node IS the textblock
		// the cursor is in, otherwise it would convert the inner paragraph instead. It only
		// makes textblocks: asked about any other type it refuses with a console warning, and
		// this list is worked out on every keystroke.
		const canSet =
			ctx.activeNode.type.isTextblock
			&& type.isTextblock
			&& editor.can().setNode(typeName, attrs)
		// A list to another list, as the list's buttons do.
		const isListChange =
			!!sourceItemType
			&& !!listItemType(editor, typeName)
			&& typeName !== ctx.activeNode.type.name
		const canReplace =
			!canSet && !isListChange && canReplaceNodeType(editor, ctx, typeName, attrs)
		if (!canSet && !canReplace && !isListChange) continue
		items.push({
			label,
			iconName,
			active: hasAttrs ? editor.isActive(typeName, attrs) : editor.isActive(typeName),
			action: () => {
				if (canSet) editor.chain().focus().setNode(typeName, attrs).run()
				else if (isListChange) changeTargetList(editor, ctx, typeName)
				else if (canReplace) replaceNodeType(editor, ctx, typeName, attrs)
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
			items.push({
				label: getNodeAlias(typeName),
				iconName: NODE_ICONS[typeName] ?? 'widgets',
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

// A code block's language: plain text (none), or one the code blocks are coloured in.
const getLanguageItems = (editor: Editor, ctx: ToolbarItemContext): NodePickerItem[] => {
	const current: string | null = ctx.activeNode.attrs['language'] ?? null
	const item = (label: string, language: string | null): NodePickerItem => ({
		label,
		active: current === language,
		action: () =>
			ctx.nodePos !== null
			&& editor.chain().focus().updateAttributesAt(ctx.nodePos, { language }).run(),
	})
	return [
		item('Plain text', null),
		...Object.entries(languages).map(([language, { name }]) => item(name, language)),
	]
}

export const blockItems = [
	// --- Undo / Redo ---
	toolbarButtonItem({
		id: 'undo',
		tooltip: 'Undo',
		label: icon('undo'),
		show: () => true,
		disabled: (editor) => !editor.can().undo(),
		action: (editor) => editor.chain().focus().undo().run(),
	}),
	toolbarButtonItem({
		id: 'redo',
		tooltip: 'Redo',
		label: icon('redo'),
		show: () => true,
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
		tooltip: getNodeAlias('codeBlock'),
		label: icon('data_object'),
		show: isTextblock,
		active: (editor) => editor.isActive('codeBlock'),
		action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
	}),
	toolbarButtonItem({
		id: 'heading-1',
		tooltip: getHeadingName(1),
		label: icon('format_h1'),
		show: isParagraphOrHeading,
		active: (_editor, ctx) =>
			ctx.activeNode.type.name === 'heading' && ctx.activeNode.attrs['level'] === 1,
		action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
	}),
	toolbarButtonItem({
		id: 'heading-2',
		tooltip: getHeadingName(2),
		label: icon('format_h2'),
		show: isParagraphOrHeading,
		active: (_editor, ctx) =>
			ctx.activeNode.type.name === 'heading' && ctx.activeNode.attrs['level'] === 2,
		action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
	}),
	toolbarButtonItem({
		id: 'heading-3',
		tooltip: getHeadingName(3),
		label: icon('format_h3'),
		show: isParagraphOrHeading,
		active: (_editor, ctx) =>
			ctx.activeNode.type.name === 'heading' && ctx.activeNode.attrs['level'] === 3,
		action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
	}),
	toolbarButtonItem({
		id: 'blockquote',
		tooltip: getNodeAlias('blockquote'),
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
		tooltip: getNodeAlias('bulletList'),
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
		tooltip: getNodeAlias('orderedList'),
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
	toolbarButtonItem({
		id: 'task-list',
		tooltip: getNodeAlias('taskList'),
		label: icon('checklist'),
		show: isParagraphOrHeading,
		active: (editor, ctx) => {
			const { $pos, depth } = resolveActivePos(editor, ctx)
			return (
				(depth > 0 && $pos.node(depth - 1).type.name === 'taskList')
				|| (depth > 1 && $pos.node(depth - 2).type.name === 'taskList')
			)
		},
		action: (editor) => editor.chain().focus().toggleTaskList().run(),
	}),

	// --- Insert / Turn into / Wrap in / Unwrap / Delete ---
	toolbarCustomItem(
		'insert',
		(_e, ctx) =>
			ctx.activeDepth > 0 && !ctx.activeNode.type.isLeaf && !ctx.activeNode.type.isTextblock,
		ToolbarNodePicker,
		{ props: { iconName: 'add', getItems: getInsertIntoItems }, tooltip: 'Insert' },
	),
	toolbarCustomItem(
		'turn-into',
		// !isLeaf: for a leaf NodeSelection resolveActivePos resolves to the parent, giving wrong results
		(_e, ctx) => ctx.activeDepth > 0 && !ctx.activeNode.type.isLeaf,
		ToolbarNodePicker,
		{
			props: { iconName: 'change_circle', getItems: getTurnIntoItems },
			tooltip: 'Change Type',
		},
	),
	toolbarCustomItem(
		'wrap-in',
		(editor, ctx) =>
			ctx.nodePos !== null
			|| (!editor.state.selection.empty && editor.state.selection.$from.parent.inlineContent),
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
	toolbarCustomItem(
		'language',
		(_e, ctx) => ctx.activeNode.type.name === 'codeBlock',
		ToolbarNodePicker,
		{ props: { iconName: 'code', getItems: getLanguageItems }, tooltip: 'Language' },
	),
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
		tooltip: getNodeAlias('bulletList'),
		label: icon('format_list_bulleted'),
		show: isListNode,
		active: (_editor, ctx) => ctx.activeNode.type.name === 'bulletList',
		action: (editor, ctx) => changeTargetList(editor, ctx, 'bulletList'),
	}),
	toolbarButtonItem({
		id: 'list-ordered',
		tooltip: getNodeAlias('orderedList'),
		label: icon('format_list_numbered'),
		show: isListNode,
		active: (_editor, ctx) => ctx.activeNode.type.name === 'orderedList',
		action: (editor, ctx) => changeTargetList(editor, ctx, 'orderedList'),
	}),
	toolbarButtonItem({
		id: 'list-task',
		tooltip: getNodeAlias('taskList'),
		label: icon('checklist'),
		show: isListNode,
		active: (_editor, ctx) => ctx.activeNode.type.name === 'taskList',
		action: (editor, ctx) => changeTargetList(editor, ctx, 'taskList'),
	}),

	// --- Table controls ---
	toolbarButtonItem({
		id: 'table-add-row-before',
		label: '+ Row ↑',
		tooltip: 'Add a row above',
		show: isInTable,
		disabled: (editor) => !editor.can().addRowBefore(),
		action: (editor) => editor.chain().focus().addRowBefore().run(),
	}),
	toolbarButtonItem({
		id: 'table-add-row-after',
		label: '+ Row ↓',
		tooltip: 'Add a row below',
		show: isInTable,
		disabled: (editor) => !editor.can().addRowAfter(),
		action: (editor) => editor.chain().focus().addRowAfter().run(),
	}),
	toolbarButtonItem({
		id: 'table-delete-row',
		label: 'Del Row',
		tooltip: 'Delete row',
		show: isInTable,
		disabled: (editor) => !editor.can().deleteRow(),
		action: (editor) => editor.chain().focus().deleteRow().run(),
	}),
	toolbarButtonItem({
		id: 'table-add-col-before',
		label: '+ Col ←',
		tooltip: 'Add a column on the left',
		show: isInTable,
		disabled: (editor) => !editor.can().addColumnBefore(),
		action: (editor) => editor.chain().focus().addColumnBefore().run(),
	}),
	toolbarButtonItem({
		id: 'table-add-col-after',
		label: '+ Col →',
		tooltip: 'Add a column on the right',
		show: isInTable,
		disabled: (editor) => !editor.can().addColumnAfter(),
		action: (editor) => editor.chain().focus().addColumnAfter().run(),
	}),
	toolbarButtonItem({
		id: 'table-delete-col',
		label: 'Del Col',
		tooltip: 'Delete column',
		show: isInTable,
		disabled: (editor) => !editor.can().deleteColumn(),
		action: (editor) => editor.chain().focus().deleteColumn().run(),
	}),
]
