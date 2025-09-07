import { prettifyCode } from '@/utils/codeFormatting'
import { initGenerateBlueprintHTML } from '@/utils/editor/htmlBlueprint'
import { escapeHTML } from '@/utils/stringUtils'
import type { Editor } from '@tiptap/vue-3'
import { defineStore } from 'pinia'
import { ref, shallowRef, watchEffect, type ShallowRef } from 'vue'

export const useEditorStore = defineStore('editor', () => {
	const codeViewDefault = false
	const isCodeView = ref(codeViewDefault)
	const editor: ShallowRef<Editor | null> = shallowRef(null)
	let generateBlueprintHTML: ReturnType<typeof initGenerateBlueprintHTML> | null = null

	watchEffect(() => {
		if (editor.value && !generateBlueprintHTML) {
			generateBlueprintHTML = initGenerateBlueprintHTML(editor.value)
		}
	})

	const setEditor = (newEditor: Editor | null) => {
		editor.value = newEditor
		isCodeView.value = codeViewDefault
		generateBlueprintHTML = null
	}

	const toggleCodeView = async () => {
		if (!editor.value) return
		if (isCodeView.value) {
			editor.value.commands.setContent(editor.value.getText())
		} else {
			if (generateBlueprintHTML === null) return
			const htmlContent = await prettifyCode(generateBlueprintHTML(), 'html')
			editor.value.commands.setContent(
				`<pre><code class="language-html">${escapeHTML(htmlContent)}</code></pre>`,
			)
		}
		isCodeView.value = !isCodeView.value
	}

	return {
		editor,
		setEditor,
		isCodeView,
		toggleCodeView,
	}
})
