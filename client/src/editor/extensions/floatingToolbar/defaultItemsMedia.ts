import ToolbarImageUrlControl from '@/components/editor/toolbar/ToolbarImageUrlControl.vue'
import ToolbarLinkControl from '@/components/editor/toolbar/ToolbarLinkControl.vue'
import ToolbarYouTubeUrlControl from '@/components/editor/toolbar/ToolbarYouTubeUrlControl.vue'
import { useEditorStore } from '@/stores/editorStore'
import { toolbarCustomItem } from './toolbarItemFactory'

export const mediaItems = [
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
]
