<template>
	<EditorContent v-if="editor" class="page-content" :editor="editor" />
</template>

<script setup lang="ts">
import { useEditor } from '@/composables/editor/useEditor'
import { CodeBlockExtension } from '@/config/editor/codeBlockExtension'
import { useEditorStore } from '@/stores/editorStore'
import { Document } from '@tiptap/extension-document'
import { Text } from '@tiptap/extension-text'
import { UndoRedo } from '@tiptap/extensions'
import { EditorContent } from '@tiptap/vue-3'

// The page as code, in an editor of its own, so Undo here undoes only the code and the page
// keeps its own. It opens with the store's `code`, taking the keys, and keeps `code` up to date.
const editorStore = useEditorStore()

const editor = useEditor({
	extensions: [
		Document.extend({ content: 'codeBlock' }),
		Text,
		// Without the code block's keys: they leave the block or turn it into a paragraph,
		// which a document of only code can't hold.
		CodeBlockExtension.extend({ addKeyboardShortcuts: () => ({}) }).configure({
			defaultLanguage: 'html',
		}),
		UndoRedo,
	],
	content: {
		type: 'doc',
		content: [
			{
				type: 'codeBlock',
				content: editorStore.code ? [{ type: 'text', text: editorStore.code }] : [],
			},
		],
	},
	autofocus: 'start',
	onUpdate: ({ editor }) => {
		editorStore.code = editor.getText()
	},
})
</script>
