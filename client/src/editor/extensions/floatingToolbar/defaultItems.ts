import { useEditorStore } from '@/stores/editorStore'
import { prettifySelectedCode } from '@/utils/editor/editorUtils'
import { toolbarButtonItem } from './toolbarItemFactory'

export const defaultToolbarItems = [
	toolbarButtonItem({
		id: 'code-block',
		label: 'Code Block',
		show: (editor) => {
			const nodeType = editor.state.doc.nodeAt(editor.state.selection.anchor)?.type.name
			return nodeType === 'text' && !useEditorStore().isCodeView
		},
		active: (editor) => editor.isActive('codeBlock'),
		action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
	}),
	toolbarButtonItem({
		id: 'format',
		label: 'Format',
		show: (editor) => editor.isActive('codeBlock'),
		action: (editor) => prettifySelectedCode(editor),
	}),
]
