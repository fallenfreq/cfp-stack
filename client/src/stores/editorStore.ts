import { defineStore } from 'pinia'
import { type Ref, watchEffect, ref } from 'vue'
import { type Editor } from '@tiptap/vue-3'

import prettier from 'prettier/standalone'
import prettierPluginHtml from 'prettier/plugins/html'
import prettierPluginBabel from 'prettier/plugins/babel'
import prettierPluginEstree from 'prettier/plugins/estree'

import { escapeHTML } from '@/tiptap/editorUtils'

// load all languages with "all" or common languages with "common"
import { createLowlight } from 'lowlight'

// You can also register languages individually
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import py from 'highlight.js/lib/languages/python'

// Create a lowlight instance
const lowlight = createLowlight()

lowlight.register('html', xml)
lowlight.register('css', css)
lowlight.register('json', json)
lowlight.register('javascript', js)
lowlight.register('typescript', ts)
lowlight.register('python', py)

const prettierOptions = {
  html: {
    parser: 'html',
    plugins: [prettierPluginHtml]
  },
  javascript: {
    parser: 'babel',
    plugins: [prettierPluginBabel, prettierPluginEstree, prettierPluginHtml]
  }
}

// Type guard to check if the language is a valid PrettierLanguage
function isPrettierLanguage(lang: any): lang is keyof typeof prettierOptions {
  return lang in prettierOptions
}

const prettifyCode = (code: string, language: keyof typeof prettierOptions) => {
  const { parser, plugins } = prettierOptions[language]
  return prettier.format(code, {
    parser,
    plugins,
    printWidth: 99999999
  })
}

// Function to detect language for a given code block
const detectLanguage = (code: string, setLanguage: string | null) => {
  if (setLanguage === null) {
    return lowlight.highlightAuto(code).data?.language || null
  }
  return setLanguage
}

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
    lowlight,
    setEditor,
    isCodeView,
    toggleCodeView,
    detectLanguage,
    isPrettierLanguage,
    prettifyCode
  }
})

import { initGenerateDynamicHTML } from '@/tiptap/jsonToHtml'
