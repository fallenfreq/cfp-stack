<!-- src/components/Editor.vue -->
<template>
  <div v-if="editor" class="px-7 sticky top-0 z-10">
    <VaChip
      @click="editor.chain().focus().toggleCodeBlock().run()"
      :class="['mr-2', { 'is-active': editor.isActive('codeBlock') }]"
    >
      Code block
    </VaChip>
    <VaChip class="mr-2" @click="() => prettierFormat('html')">Format HTML</VaChip>
    <VaChip class="mr-2" @click="() => prettierFormat('babel')">Format JS</VaChip>
    <VaChip @click="toggleView">
      {{ isCodeView ? 'Aa' : `\<\/\>` }}
    </VaChip>
  </div>
  <EditorContent class="p-7" :editor="editor" />
</template>

<script setup lang="ts">
import { type Component, ref, watchEffect } from 'vue'
import { type NodeViewProps, useEditor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
import { registerCustomNodes } from '@/tiptap/registerCustomNodes'
import { AllowAttributesExtension } from '@/tiptap/allowAttributesExtension'
import { initGenerateDynamicHTML } from '@/tiptap/jsonToHtml'

// import prettier from 'prettier'
import prettier from 'prettier/standalone'
import prettierPluginHtml from 'prettier/plugins/html'
import prettierPluginBabel from 'prettier/plugins/babel'
import prettierPluginEstree from 'prettier/plugins/estree'

import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Span from '@/tiptap/spanExtention'
import Div from '@/tiptap/divExtention'

import TiptapCodeBlock from './TiptapCodeBlock.vue'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
// load all languages with "all" or common languages with "common"
import { common, createLowlight } from 'lowlight'

// create a lowlight instance
const lowlight = createLowlight(common)

// you can also register languages individually
import xml from 'highlight.js/lib/languages/xml'
lowlight.register('html', xml)

const prettierPlugins = {
  html: [prettierPluginHtml],
  babel: [prettierPluginBabel, prettierPluginEstree, prettierPluginHtml]
}

const printWidth = 99999999

// Function to format selected text using Prettier
const prettierFormat = async (language: 'babel' | 'html') => {
  if (!editor.value) return
  const { anchor } = editor.value.state.selection
  const textNode = editor.value.state.doc.nodeAt(anchor)
  const resolvedPos = editor.value.state.doc.resolve(anchor)
  const startPosition = resolvedPos.start(resolvedPos.depth)
  const endPosition = resolvedPos.end(resolvedPos.depth)
  const selectedContent = textNode?.textContent || ''

  if (!selectedContent) return
  const formattedContent = await prettier.format(selectedContent, {
    parser: language,
    plugins: prettierPlugins[language],
    printWidth
  })

  editor.value.commands.insertContentAt(
    { from: startPosition, to: endPosition },
    { type: 'text', text: formattedContent }
  )
  editor.value.chain().focus().setTextSelection(anchor).run()
}

import initialContent from '@/tiptap/initialContent.html?raw'

// Utility functions to escape and unescape HTML content
const escapeHTML = (html: string) => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Track whether the user is in code view or normal view
const isCodeView = ref(false)

let generateDynamicHTML: ReturnType<typeof initGenerateDynamicHTML>

const editor = useEditor({
  extensions: [
    CodeBlockLowlight.extend({
      addNodeView() {
        // There is currenltly a bug causing component type errors so I am using "as" for now
        return VueNodeViewRenderer(TiptapCodeBlock as Component<NodeViewProps>)
      }
    }).configure({ lowlight }),
    StarterKit.configure({
      codeBlock: false
    }),
    Div,
    Youtube,
    Image,
    Table,
    TableCell,
    TableHeader,
    TableRow,
    Span,
    ...registerCustomNodes(),
    AllowAttributesExtension
  ],
  content: initialContent,
  autofocus: true,
  parseOptions: {
    // preserveWhitespace: 'full'
  }
})

// Watch for when editor.value is set and initialize generateDynamicHTML
watchEffect(() => {
  if (editor.value && !generateDynamicHTML) {
    generateDynamicHTML = initGenerateDynamicHTML(editor.value)
  }
})

// Toggle between code view and normal view
const toggleView = async () => {
  if (!editor.value) return
  if (isCodeView.value) {
    editor.value.commands.setContent(editor.value.getText())
  } else {
    const htmlContent = await prettier.format(generateDynamicHTML(), {
      parser: 'html',
      plugins: [prettierPluginHtml],
      printWidth
    })
    editor.value.commands.setContent(
      `<pre><code class="language-html">${escapeHTML(htmlContent)}</code></pre>`
    )
  }
  isCodeView.value = !isCodeView.value
}
</script>

<style>
/* Basic editor styles */
.tiptap:first-child {
  margin-top: 0;
}

.tiptap pre {
  background: rgb(var(--backgroundSecondary));
  border-radius: 0.5rem;
  color: rgb(var(--textPrimary));
  font-family: 'JetBrainsMono', monospace;
  margin: 1.5rem 0;
  padding: 0.75rem 1rem;
}

.tiptap code {
  background: none;
  color: inherit;
  font-size: 0.8rem;
  padding: 0;
}

/* Code styling */
.hljs-comment,
.hljs-quote {
  color: #616161;
}

.hljs-variable,
.hljs-template-variable,
.hljs-attribute,
.hljs-tag,
.hljs-name,
.hljs-regexp,
.hljs-link,
.hljs-name,
.hljs-selector-id,
.hljs-selector-class {
  color: #f98181;
}

.hljs-number,
.hljs-meta,
.hljs-built_in,
.hljs-builtin-name,
.hljs-literal,
.hljs-type,
.hljs-params {
  color: #fbbc88;
}

.hljs-string,
.hljs-symbol,
.hljs-bullet {
  color: #b9f18d;
}

.hljs-title,
.hljs-section {
  color: #faf594;
}

.hljs-keyword,
.hljs-selector-tag {
  color: #70cff8;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: 700;
}
</style>

<!--
create prettier formmater extetion
youtube keeps being nested in more divs with Div active
-->
