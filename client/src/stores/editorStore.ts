import { defineStore } from 'pinia'
import { type Ref, watchEffect, ref } from 'vue'
import { type Editor } from '@tiptap/vue-3'
import { initGenerateDynamicHTML } from '@/utils/editor/htmlBlueprint'
import { escapeHTML } from '@/utils/stringUtils'
import { prettifyCode } from '@/utils/codeFormatting'

export const useEditorStore = defineStore('editor', () => {
  const isCodeView = ref(false)
  const editor: Ref<Editor | null> = ref(null)
  let generateDynamicHTML: ReturnType<typeof initGenerateDynamicHTML> | null = null

  watchEffect(() => {
    if (editor.value && !generateDynamicHTML) {
      generateDynamicHTML = initGenerateDynamicHTML(editor.value)
    }
  })

  const setEditor = (newEditor: Editor | null) => {
    editor.value = newEditor
  }

  const toggleCodeView = async () => {
    if (!editor.value) return
    if (isCodeView.value) {
      editor.value.commands.setContent(editor.value.getText())
    } else {
      if (generateDynamicHTML === null) return
      const htmlContent = await prettifyCode(generateDynamicHTML(), 'html')
      editor.value.commands.setContent(
        `<pre><code class="language-html">${escapeHTML(htmlContent)}</code></pre>`
      )
    }
    isCodeView.value = !isCodeView.value
  }

  return {
    editor,
    setEditor,
    isCodeView,
    toggleCodeView
  }
})
