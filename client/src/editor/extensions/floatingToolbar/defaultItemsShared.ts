import ToolbarIcon from '@/components/editor/toolbar/ToolbarIcon.vue'
import { useEditorStore } from '@/stores/editorStore'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { h } from 'vue'
import type { ToolbarItemContext } from './types'

export const icon = (name: string) => () => h(ToolbarIcon, null, () => name)

// Block conversion ops must match what NodePath points at.
export const isTextblock = (_e: Editor, ctx: ToolbarItemContext) =>
	ctx.activeNode.type.isTextblock && !useEditorStore().isCodeView

// Inline mark ops follow the cursor — safe at any depth since they only affect
// selected text, never change block structure.
export const isFormattableTextblock = (editor: Editor) =>
	editor.state.selection.$from.parent.type.isTextblock
	&& editor.state.selection.$from.parent.type.name !== 'codeBlock'
	&& !useEditorStore().isCodeView

export const isParagraphOrHeading = (_e: Editor, ctx: ToolbarItemContext) =>
	['paragraph', 'heading'].includes(ctx.activeNode.type.name) && !useEditorStore().isCodeView

export const isInTable = (editor: Editor) =>
	editor.isActive('tableCell') || editor.isActive('tableHeader')

export const isListNode = (_e: Editor, ctx: ToolbarItemContext) =>
	['bulletList', 'orderedList', 'taskList'].includes(ctx.activeNode.type.name)

export const isNotCodeView = () => !useEditorStore().isCodeView

// Only true schema primitives need explicit exclusion; leaf nodes and structural nodes
// (tableRow, listItem, etc.) are filtered automatically by isLeaf and canReplaceWith/validContent.
export const EXCLUDED_NODE_TYPES = new Set(['doc', 'text'])

// Display metadata for known types; unknown custom nodes fall back to { label: typeName, iconName: 'widgets' }
export const NODE_META: Record<string, { label: string; iconName: string }> = {
	paragraph: { label: 'Paragraph', iconName: 'notes' },
	heading: { label: 'Heading', iconName: 'title' },
	codeBlock: { label: 'Code Block', iconName: 'data_object' },
	blockquote: { label: 'Blockquote', iconName: 'format_quote' },
	div: { label: 'Div', iconName: 'frame_source' },
	span: { label: 'Span', iconName: 'short_text' },
	bulletList: { label: 'Bullet List', iconName: 'format_list_bulleted' },
	orderedList: { label: 'Numbered List', iconName: 'format_list_numbered' },
	taskList: { label: 'Task List', iconName: 'checklist' },
}

// Lists whose items are a different node type can't be converted via the
// canReplaceNodeType path because their item schemas don't validate each
// other's content (bulletList/orderedList → listItem+, taskList → taskItem+).
export const LIST_ITEM_MAP: Record<string, string> = {
	bulletList: 'listItem',
	orderedList: 'listItem',
	taskList: 'taskItem',
}

// Mirrors FloatingToolbar's resolveActive() position logic — shared by all helpers below.
export const resolveActivePos = (editor: Editor, ctx: ToolbarItemContext) => {
	const { selection } = editor.state
	const pathPos =
		selection instanceof NodeSelection && !selection.node.isLeaf
			? selection.from + 1
			: selection.anchor
	const $pos = editor.state.doc.resolve(pathPos)
	const depth = Math.min(ctx.activeDepth, $pos.depth)

	// Leaf NodeSelections (e.g. block images) have nodeSize=1 — there is no interior
	// position so selection.from resolves at the parent's depth, making $pos.depth one
	// short of the leaf and causing $pos.node(depth) to return the wrong node.  When
	// ctx identifies a leaf as active (set correctly by resolveDragHandleTargetFromSelection),
	// proxy $pos so node() and before() at leafDepth return the leaf itself and its
	// position, keeping all callers unchanged.
	if (selection instanceof NodeSelection && selection.node.isLeaf && ctx.nodePos !== null) {
		const leafDepth = $pos.depth + 1
		if (Math.min(ctx.activeDepth, leafDepth) === leafDepth) {
			const leafNode = ctx.activeNode
			const leafPos = ctx.nodePos
			const patched = new Proxy($pos, {
				get(target, prop, receiver) {
					if (prop === 'node') {
						return (d = target.depth) => (d === leafDepth ? leafNode : target.node(d))
					}
					if (prop === 'before') {
						return (d = target.depth + 1) =>
							d === leafDepth ? leafPos : target.before(d)
					}
					return Reflect.get(target, prop, receiver)
				},
			})
			return { $pos: patched, depth: leafDepth }
		}
	}

	return { $pos, depth }
}

// Checks whether the active node can be replaced by a direct ProseMirror transaction:
//   1. Parent must accept the new type (canReplaceWith)
//   2. New type must accept the current node's content (validContent)
export const canReplaceNodeType = (
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
export const replaceNodeType = (
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

// Enumerates all non-excluded, non-leaf schema nodes with display metadata.
// 'heading' is expanded to three level-specific entries so callers don't need to special-case it.
export function blockNodeEntries(editor: Editor) {
	const result: {
		typeName: string
		type: (typeof editor.schema.nodes)[string]
		attrs: Record<string, unknown>
		label: string
		iconName: string
	}[] = []
	for (const [typeName, type] of Object.entries(editor.schema.nodes)) {
		if (EXCLUDED_NODE_TYPES.has(typeName) || type.isLeaf) continue
		const meta = NODE_META[typeName] ?? { label: typeName, iconName: 'widgets' }
		if (typeName === 'heading') {
			for (let level = 1; level <= 3; level++)
				result.push({
					typeName,
					type,
					attrs: { level },
					label: `Heading ${level}`,
					iconName: `format_h${level}`,
				})
		} else {
			result.push({ typeName, type, attrs: {}, ...meta })
		}
	}
	return result
}
