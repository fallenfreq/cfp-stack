import ToolbarAttributeEditor from '@/components/editor/toolbar/ToolbarAttributeEditor.vue'
import ToolbarIcon from '@/components/editor/toolbar/ToolbarIcon.vue'
import ToolbarImageUrlControl from '@/components/editor/toolbar/ToolbarImageUrlControl.vue'
import ToolbarLinkControl from '@/components/editor/toolbar/ToolbarLinkControl.vue'
import ToolbarNodePicker, {
	type NodePickerItem,
} from '@/components/editor/toolbar/ToolbarNodePicker.vue'
import ToolbarYouTubeUrlControl from '@/components/editor/toolbar/ToolbarYouTubeUrlControl.vue'
import { multiSelectPluginKey, type MultiSelectAction } from '@/editor/extensions/multiSelect'
import { useEditorStore } from '@/stores/editorStore'
import { useMultiSelectStore } from '@/stores/multiSelectStore'
import {
	allAreSiblings,
	getChildBlockPositions,
	getSiblingPositions,
	nodeAt,
	prettifySelectedCode,
	type NodePos,
} from '@/utils/editor/editorUtils'
import { Fragment } from '@tiptap/pm/model'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { defineComponent, h } from 'vue'
import { toolbarButtonItem, toolbarCustomItem } from './toolbarItemFactory'
import type { ToolbarItemContext } from './types'

const icon = (name: string) => () => h(ToolbarIcon, null, () => name)

// Block conversion ops (heading, blockquote, lists, code-block) must match what NodePath points at.
const isTextblock = (_e: Editor, ctx: ToolbarItemContext) =>
	ctx.activeNode.type.isTextblock && !useEditorStore().isCodeView

// Inline mark ops (bold, italic…) follow the cursor — safe at any depth since they only affect
// selected text, never change block structure.
const isFormattableTextblock = (editor: Editor) =>
	editor.state.selection.$from.parent.type.isTextblock
	&& editor.state.selection.$from.parent.type.name !== 'codeBlock'
	&& !useEditorStore().isCodeView

const isParagraphOrHeading = (_e: Editor, ctx: ToolbarItemContext) =>
	['paragraph', 'heading'].includes(ctx.activeNode.type.name) && !useEditorStore().isCodeView

const isInTable = (editor: Editor) => editor.isActive('tableCell') || editor.isActive('tableHeader')

const isListNode = (_e: Editor, ctx: ToolbarItemContext) =>
	['bulletList', 'orderedList', 'taskList'].includes(ctx.activeNode.type.name)

// Only true schema primitives need explicit exclusion; leaf nodes and structural nodes
// (tableRow, listItem, etc.) are filtered automatically by isLeaf and canReplaceWith/validContent.
const EXCLUDED_NODE_TYPES = new Set(['doc', 'text'])

// Display metadata for known types; unknown custom nodes fall back to { label: typeName, iconName: 'widgets' }
const NODE_META: Record<string, { label: string; iconName: string }> = {
	paragraph: { label: 'Paragraph', iconName: 'notes' },
	heading: { label: 'Heading', iconName: 'title' },
	codeBlock: { label: 'Code Block', iconName: 'data_object' },
	blockquote: { label: 'Blockquote', iconName: 'format_quote' },
	div: { label: 'Div', iconName: 'frame_source' },
	span: { label: 'Span', iconName: 'short_text' },
}

// Mirrors FloatingToolbar's resolveActive() position logic — shared by all helpers below.
const resolveActivePos = (editor: Editor, ctx: ToolbarItemContext) => {
	const { selection } = editor.state
	const pathPos =
		selection instanceof NodeSelection && !selection.node.isLeaf
			? selection.from + 1
			: selection.anchor
	const $pos = editor.state.doc.resolve(pathPos)
	const depth = Math.min(ctx.activeDepth, $pos.depth)
	return { $pos, depth }
}

// Checks whether the active node can be replaced by a direct ProseMirror transaction:
//   1. Parent must accept the new type (canReplaceWith)
//   2. New type must accept the current node's content (validContent)
const canReplaceNodeType = (
	editor: Editor,
	ctx: ToolbarItemContext,
	typeName: string,
	_attrs: Record<string, unknown> = {},
): boolean => {
	const newType = editor.state.schema.nodes[typeName]
	if (!newType) return false
	const { $pos, depth } = resolveActivePos(editor, ctx)
	if (depth === 0) return false
	const node = $pos.node(depth)
	if (node.type.name === typeName) return false
	const parent = $pos.node(depth - 1)
	const index = $pos.index(depth - 1)
	return parent.canReplaceWith(index, index + 1, newType) && newType.validContent(node.content)
}

// Swap node type in-place, keeping children.
// Attrs: carry over any source attrs the new type understands; apply explicit attrs on top.
// Incompatible attrs are silently dropped — user chose a new type and accepts its defaults.
const replaceNodeType = (
	editor: Editor,
	ctx: ToolbarItemContext,
	typeName: string,
	explicitAttrs: Record<string, unknown> = {},
) => {
	const newType = editor.state.schema.nodes[typeName]
	if (!newType) return
	const { $pos, depth } = resolveActivePos(editor, ctx)
	if (depth === 0) return
	const node = $pos.node(depth)
	const nodePos = $pos.before(depth)
	const targetAttrSpec = (newType.spec.attrs ?? {}) as Record<string, unknown>
	const compatibleAttrs = Object.fromEntries(
		Object.entries(node.attrs).filter(([key]) => key in targetAttrSpec),
	)
	const newNode = newType.create(
		{ ...compatibleAttrs, ...explicitAttrs },
		node.content,
		node.marks,
	)
	// Node type names don't contribute to ProseMirror position space, so the cursor's offset
	// from nodePos is identical in the new node. Bypass step mapping (which squeezes
	// positions inside the replaced range to the boundary) by reapplying the offset directly.
	const cursorOffset = editor.state.selection.from - nodePos
	const tr = editor.state.tr.replaceWith(nodePos, nodePos + node.nodeSize, newNode)
	tr.setSelection(TextSelection.near(tr.doc.resolve(nodePos + cursorOffset)))
	editor.view.dispatch(tr)
}

const getTurnIntoItems = (editor: Editor, ctx: ToolbarItemContext): NodePickerItem[] => {
	const items: NodePickerItem[] = []
	for (const [typeName, type] of Object.entries(editor.schema.nodes)) {
		if (EXCLUDED_NODE_TYPES.has(typeName) || type.isLeaf) continue
		const meta = NODE_META[typeName] ?? { label: typeName, iconName: 'widgets' }

		// heading is one schema node but three picker candidates (level 1/2/3)
		if (typeName === 'heading') {
			for (let level = 1; level <= 3; level++) {
				const attrs = { level }
				// setNode is cursor-based — only use it when the active node IS the textblock
				// the cursor is in, otherwise it would convert the inner paragraph instead.
				const canSet =
					ctx.activeNode.type.isTextblock && editor.can().setNode(typeName, attrs)
				const canReplace = !canSet && canReplaceNodeType(editor, ctx, typeName, attrs)
				if (!canSet && !canReplace) continue
				items.push({
					label: `Heading ${level}`,
					iconName: `format_h${level}`,
					active: editor.isActive(typeName, attrs),
					action: () =>
						ctx.activeNode.type.isTextblock && editor.can().setNode(typeName, attrs)
							? editor.chain().focus().setNode(typeName, attrs).run()
							: replaceNodeType(editor, ctx, typeName, attrs),
				})
			}
			continue
		}

		const canSet = ctx.activeNode.type.isTextblock && editor.can().setNode(typeName)
		const canReplace = !canSet && canReplaceNodeType(editor, ctx, typeName)
		if (!canSet && !canReplace) continue
		items.push({
			label: meta.label,
			iconName: meta.iconName,
			active: editor.isActive(typeName),
			action: () =>
				ctx.activeNode.type.isTextblock && editor.can().setNode(typeName)
					? editor.chain().focus().setNode(typeName).run()
					: replaceNodeType(editor, ctx, typeName),
		})
	}
	return items
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

	const items: NodePickerItem[] = []
	for (const [typeName, type] of Object.entries(editor.schema.nodes)) {
		if (EXCLUDED_NODE_TYPES.has(typeName) || type.isLeaf) continue
		if (!canWrapNodeInType(editor, ctx, typeName)) continue
		const meta = NODE_META[typeName] ?? { label: typeName, iconName: 'widgets' }
		items.push({
			label: meta.label,
			iconName: meta.iconName,
			active: editor.isActive(typeName),
			action: () => wrapNodeInType(editor, ctx, typeName),
		})
	}
	return items
}

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

// --- Virtual selection helpers ---

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
	for (const [typeName, type] of Object.entries(editor.schema.nodes)) {
		if (EXCLUDED_NODE_TYPES.has(typeName) || type.isLeaf) continue
		if (!canWrapSiblingsInType(editor, positions, typeName)) continue
		const meta = NODE_META[typeName] ?? { label: typeName, iconName: 'widgets' }
		items.push({
			label: meta.label,
			iconName: meta.iconName,
			active: false,
			action: () => wrapSiblingsInType(editor, positions, typeName),
		})
	}
	return items
}

export const defaultToolbarItems = [
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

	// --- Turn into / Wrap in / Unwrap / Delete ---
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

	// --- Media URL editing ---
	toolbarCustomItem(
		'image-url',
		(_e, ctx) => ctx.activeNode.type.name === 'image',
		ToolbarImageUrlControl,
	),
	toolbarCustomItem(
		'youtube-url',
		(_e, ctx) => ctx.activeNode.type.name === 'youtube',
		ToolbarYouTubeUrlControl,
	),

	// --- Link controls ---
	toolbarCustomItem(
		'link',
		(editor) =>
			editor.isActive('link')
			|| (editor.state.selection.$from.parent.type.isTextblock
				&& editor.state.selection.$from.parent.type.name !== 'codeBlock'
				&& !useEditorStore().isCodeView),
		ToolbarLinkControl,
		{ tooltip: 'Link' },
	),

	// --- Node attribute editor ---
	toolbarCustomItem(
		'attr-editor',
		(_e, ctx) => ctx.activeDepth > 0 && !useEditorStore().isCodeView,
		ToolbarAttributeEditor,
		{ tooltip: 'Attributes' },
	),

	// --- Virtual selection ---

	toolbarButtonItem({
		id: 'sel-add',
		tooltip: 'Toggle selection',
		label: (_, ctx) => {
			const inSel =
				ctx.nodePos !== null && useMultiSelectStore().positions.includes(ctx.nodePos)
			return h(ToolbarIcon, null, () => (inSel ? 'check_box' : 'check_box_outline_blank'))
		},
		show: (_, ctx) => ctx.nodePos !== null && ctx.activeNode.type.spec.selectable !== false,
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
			&& ctx.activeNode.type.spec.selectable !== false
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
			&& ctx.activeNode.type.spec.selectable !== false
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
			if (ctx.activeNode.type.spec.selectable === false) return false
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
			&& ctx.activeNode.type.spec.selectable !== false
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
