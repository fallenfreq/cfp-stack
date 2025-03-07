import { defineStore } from 'pinia'
import { type Ref, watchEffect, ref } from 'vue'
import { type Editor } from '@tiptap/vue-3'
import { initGenerateBlueprintHTML } from '@/utils/editor/htmlBlueprint'
import { escapeHTML } from '@/utils/stringUtils'
import { prettifyCode } from '@/utils/codeFormatting'

export const useEditorStore = defineStore('editor', () => {
  const isCodeView = ref(false)
  const editor: Ref<Editor | null> = ref(null)
  let generateBlueprintHTML: ReturnType<typeof initGenerateBlueprintHTML> | null = null

  watchEffect(() => {
    if (editor.value && !generateBlueprintHTML) {
      generateBlueprintHTML = initGenerateBlueprintHTML(editor.value)
    }
  })

  const setEditor = (newEditor: Editor | null) => {
    editor.value = newEditor
    isCodeView.value = false
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
