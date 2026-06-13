import ToolbarAttributeEditor from '@/components/editor/toolbar/ToolbarAttributeEditor.vue'
import ToolbarColorControl from '@/components/editor/toolbar/ToolbarColorControl.vue'
import ToolbarCornersControl from '@/components/editor/toolbar/ToolbarCornersControl.vue'
import ToolbarFontControl from '@/components/editor/toolbar/ToolbarFontControl.vue'
import ToolbarShadowControl from '@/components/editor/toolbar/ToolbarShadowControl.vue'
import { useEditorStore } from '@/stores/editorStore'
import { useMultiSelectStore } from '@/stores/multiSelectStore'
import { toolbarCustomItem } from './toolbarItemFactory'

export const styleItems = [
	// --- Text / background color (mark or node attr) ---
	toolbarCustomItem(
		'color',
		(editor, ctx) => {
			if (useEditorStore().isCodeView) return false
			if (useMultiSelectStore().positions.length > 1) return false
			// Mark mode: cursor in any textblock other than codeBlock
			if (
				editor.state.selection.$from.parent.type.isTextblock
				&& editor.state.selection.$from.parent.type.name !== 'codeBlock'
			)
				return true
			// Node mode: a non-leaf block is active
			return ctx.activeDepth > 0 && !ctx.activeNode.type.isLeaf
		},
		ToolbarColorControl,
		{ tooltip: 'Color' },
	),

	// --- Font family / size (mark or node style) ---
	toolbarCustomItem(
		'font-style',
		(editor, ctx) => {
			if (useEditorStore().isCodeView) return false
			if (useMultiSelectStore().positions.length > 1) return false
			if (
				editor.state.selection.$from.parent.type.isTextblock
				&& editor.state.selection.$from.parent.type.name !== 'codeBlock'
			)
				return true
			return ctx.activeDepth > 0 && !ctx.activeNode.type.isLeaf
		},
		ToolbarFontControl,
		{ tooltip: 'Font' },
	),

	// --- Border-radius corners ---
	toolbarCustomItem(
		'corners',
		(_e, ctx) =>
			ctx.activeDepth > 0
			&& !useEditorStore().isCodeView
			&& useMultiSelectStore().positions.length <= 1,
		ToolbarCornersControl,
		{ tooltip: 'Corners' },
	),

	// --- Box shadow ---
	toolbarCustomItem(
		'shadow',
		(_e, ctx) =>
			ctx.activeDepth > 0
			&& !useEditorStore().isCodeView
			&& useMultiSelectStore().positions.length <= 1,
		ToolbarShadowControl,
		{ tooltip: 'Shadow' },
	),

	// --- Node attribute editor ---
	toolbarCustomItem(
		'attr-editor',
		(_e, ctx) => ctx.activeDepth > 0 && !useEditorStore().isCodeView,
		ToolbarAttributeEditor,
		{ tooltip: 'Attributes' },
	),
]
