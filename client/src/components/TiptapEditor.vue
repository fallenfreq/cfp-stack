<!-- src/components/Editor.vue -->
<template>
  <!--
    Sticky wont work properly when the virtual keyboard is open
    This needs fixing with js or anouther appraoch for the menu
  -->
  <div v-if="editor" class="flex flex-wrap gap-2 px-7 sticky top-2 z-10">
    <VaChip
      @click="editor.chain().focus().toggleCodeBlock().run()"
      :class="[{ 'is-active': editor.isActive('codeBlock') }]"
    >
      Code block
    </VaChip>
    <VaChip @click="prettierFormat">Format</VaChip>
    <VaChip @click="toggleView">
      {{ isCodeView ? 'Aa' : `\<\/\>` }}
    </VaChip>
  </div>
  <EditorContent class="p-7" :editor="editor" />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useToast } from 'vuestic-ui'
import { useEditor, EditorContent, VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3'
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
import { /*common,*/ createLowlight } from 'lowlight'
import highlight from 'highlight.js'

// create a lowlight instance
const lowlight = createLowlight()

// you can also register languages individually
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import py from 'highlight.js/lib/languages/python'

lowlight.register('html', xml)
lowlight.register('css', css)
lowlight.register('json', json)
lowlight.register('javascript', js)
lowlight.register('typescript', ts)
lowlight.register('python', py)

const printWidth = 99999999
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

// Function to format selected text using Prettier
const prettierFormat = async () => {
  if (!editor.value) return

  const { anchor } = editor.value.state.selection
  const resolvedPos = editor.value.state.doc.resolve(anchor)
  const startPosition = resolvedPos.start(resolvedPos.depth)
  const endPosition = resolvedPos.end(resolvedPos.depth)
  const textNode = editor.value.state.doc.nodeAt(startPosition)
  const selectedContent = textNode?.textContent || ''

  if (!selectedContent) return editor.value.chain().focus().setTextSelection(anchor).run()

  editor.value.commands.selectParentNode()
  const parentNode = editor.value.state.doc.nodeAt(editor.value.state.selection.from)
  const setLanguage = parentNode?.attrs.language
  const isDetected = setLanguage === null
  const language = isDetected
    ? lowlight.highlightAuto(selectedContent).data?.language || null
    : setLanguage
  const languageName = highlight.getLanguage(language)?.name?.split(',')[0]

  let message = ''
  if (language === null) {
    message = 'Auto detect failed to detect language.'
  } else if (language === undefined) {
    message = 'Formatting is only available for code blocks.'
  } else if (!isPrettierLanguage(language)) {
    message = `Formatting is not supported for the ${isDetected ? 'detected' : 'selected'} language: ${languageName}`
  }

  // Use the type guard to check and narrow the type of language
  if (!language || !isPrettierLanguage(language)) {
    useToast().notify({
      duration: 10000,
      color: 'warning',
      position: 'bottom-right',
      message
    })
    return
  }

  const { parser, plugins } = prettierOptions[language]

  try {
    const formattedContent = await prettier.format(selectedContent, {
      parser,
      plugins,
      printWidth
    })

    editor.value.commands.insertContentAt(
      { from: startPosition, to: endPosition },
      { type: 'text', text: formattedContent }
    )
  } catch (error) {
    useToast().notify({
      duration: 10000,
      color: 'danger',
      position: 'bottom-right',
      message: 'Formatting error: ' + (error instanceof Error ? error.message : 'Unknown error')
    })
  }
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

import { /* defineComponent, h, */ type Component } from 'vue'
// import { nodeViewProps } from '@tiptap/vue-3'

const editor = useEditor({
  extensions: [
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(
          TiptapCodeBlock as Component<NodeViewProps>
          // This passes all props as attributes instead of just attribuets
          // it fixes any type errors but we have props as attributes that should not be there
          // its not enough to just pass props.node.attrs because I assume the NodeViewWrapper needs more
          // defineComponent({
          //   props: nodeViewProps,
          //   setup(props) {
          //     return () =>
          //       h(TiptapCodeBlock, {
          //         ...props
          //       })
          //   }
          // })
        )
      }
    }).configure({ lowlight }),
    StarterKit.configure({
      codeBlock: false
    }),
    Youtube.extend({
      renderHTML({ node, HTMLAttributes }) {
        const { resp } = node.attrs
        const maxWidthStyle = resp ? `max-width: ${resp};` : null
        // `this` is the function we are in > node.type.spec.toDOM?.(node).
        // Use this.parent?.({ node, HTMLAttributes }) to get the original DomOutputSpec
        const domOutputSpec = this.parent?.({ node, HTMLAttributes })
        if (!domOutputSpec) throw new Error('No parent DomOutputSpec found')
        return resp === '' || resp
          ? [
              'div',
              // Adding data-youtube-video to stop my custom div extention from rendering it
              { class: 'max-w-xl', 'data-youtube-video': '', style: maxWidthStyle },
              domOutputSpec
            ]
          : domOutputSpec
      },
      addAttributes() {
        const existingAttributes = this.parent?.() || {}
        return {
          ...existingAttributes,
          resp: {
            default: '',
            renderHTML: (attributes) => {
              return attributes.resp === '' || attributes.resp
                ? {
                    width: 'auto',
                    height: 'auto',
                    class: (attributes.class || '' + ' resp-yt').trim()
                  }
                : {}
            }
          }
        }
      }
    }),
    Image,
    Table,
    TableCell,
    TableHeader,
    TableRow,
    Span,
    Div,
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
/* Youtube video styling in the editor */

.tiptap [data-youtube-video]:has(> iframe.resp-yt) {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
}

.tiptap [data-youtube-video] > iframe.resp-yt {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
}

/* Basic editor styles */

.tiptap:focus {
  outline: none;
}

.tiptap p:not(:last-child),
.tiptap h1:not(:last-child),
.tiptap h2:not(:last-child),
.tiptap pre:not(:last-child),
.tiptap table:not(:last-child),
.tiptap .code-block:not(:last-child),
.tiptap [data-node-view-wrapper]:not(:last-child),
.tiptap [data-youtube-video]:not(:last-child) {
  margin-bottom: 1rem;
}

.tiptap [data-youtube-video] > [data-youtube-video] {
  margin-bottom: 0;
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
