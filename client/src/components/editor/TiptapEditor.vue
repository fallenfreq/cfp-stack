<template>
  <FloatingEditorMenu v-if="editor" :editor="editor" />
  <EditorContent class="p-7" :editor="editor" />
</template>

<script setup lang="ts">
import {
  useEditor,
  EditorContent,
  VueNodeViewRenderer,
  type NodeViewProps,
  mergeAttributes
} from '@tiptap/vue-3'
import { registerCustomNodes } from '@/config/editor/registerCustomNodes'
import { AllowAttributesExtension } from '@/editor/extentions/allowAttributesExtension'
import { useNodeViewInteractions } from '@/composables/editor/useNodeViewInteractions'
import cssVariables from '@/../cssVariables.js'
import initialContent from '@/config/editor/initialContent.html?raw'

import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Placeholder from '@tiptap/extension-placeholder'
import link from '@tiptap/extension-link'
import Heading from '@tiptap/extension-heading'
import Span from '@/editor/extentions/spanExtention'
import Div from '@/editor/extentions/divExtention'

import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

import Commands from '@/editor/extentions/commands/commands.js'
import suggestion from '@/editor/extentions/commands/suggestion.js'

// Drag handle extension
// DropCursor used by GlobalDragHandle already
// import DropCursor from '@tiptap/extension-dropcursor'
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import AutoJoiner from 'tiptap-extension-auto-joiner'

import TiptapCodeBlock from './TiptapCodeBlock.vue'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

import { type Component, watch } from 'vue'
import FloatingEditorMenu from './FloatingEditorMenu.vue'

import { useEditorStore } from '@/stores/editorStore.js'
import { lowlight } from '@/config/editor/lowlight'

const editor = useEditor({
  extensions: [
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(TiptapCodeBlock as Component<NodeViewProps>)
      }
    }).configure({ lowlight }),
    StarterKit.configure({
      codeBlock: false,
      heading: false,
      bulletList: {
        HTMLAttributes: {
          class: 'list-disc'
        }
      },
      orderedList: {
        HTMLAttributes: {
          class: 'list-decimal'
        }
      },
      listItem: {
        HTMLAttributes: {
          class: ''
        }
      },
      blockquote: {
        HTMLAttributes: {
          class: 'border-l-8 border-primary bg-backgroundSecondary p-4'
        }
      }
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
          ? ['div', { class: 'max-w-xl', style: maxWidthStyle }, domOutputSpec]
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
    Heading.extend({
      levels: [1, 2, 3],
      renderHTML({ node, HTMLAttributes }) {
        const level = this.options.levels.includes(node.attrs.level)
          ? node.attrs.level
          : this.options.levels[0]
        const classes: { [index: number]: string } = {
          1: 'text-4xl',
          2: 'text-2xl',
          3: 'text-xl'
        }
        return [
          `h${level}`,
          mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            class: `${classes[level]}`
          }),
          0
        ]
      }
    }).configure({ levels: [1, 2, 3] }),
    Image,
    Table.configure({ allowTableNodeSelection: true, HTMLAttributes: { class: 'tiptap-table' } }),
    TableCell,
    TableHeader,
    TableRow,
    Span,
    Div,
    link,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: false,
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          console.log(node.type.name)
          return 'What’s the title?'
        }
        return 'Type slash for commands'
      }
    }),
    ...registerCustomNodes(),
    AllowAttributesExtension,
    GlobalDragHandle,
    AutoJoiner.configure({
      elementsToJoin: ['bulletList', 'orderedList'] // default
    }),
    TaskList.configure(),
    TaskItem.configure({
      HTMLAttributes: {
        class: 'flex items-start'
      },
      nested: true
    }),
    Commands.configure({ suggestion })
  ],
  content: initialContent,
  autofocus: true,
  parseOptions: {
    // preserveWhitespace: 'full'
  }
})

useEditorStore().setEditor(editor.value || null)

watch(
  () => editor.value,
  (newEditor) => {
    if (newEditor) {
      useNodeViewInteractions(newEditor)
      useEditorStore().setEditor(newEditor)
    }
  }
)

let svgUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' style='fill: rgba(${cssVariables.root['--primary']} / 1)'%3E%3Cpath d='M3,2 C2.44771525,2 2,1.55228475 2,1 C2,0.44771525 2.44771525,0 3,0 C3.55228475,0 4,0.44771525 4,1 C4,1.55228475 3.55228475,2 3,2 Z M3,6 C2.44771525,6 2,5.55228475 2,5 C2,4.44771525 2.44771525,4 3,4 C3.55228475,4 4,4.44771525 4,5 C4,5.55228475 3.55228475,6 3,6 Z M3,10 C2.44771525,10 2,9.55228475 2,9 C2,8.44771525 2.44771525,8 3,8 C3.55228475,8 4,8.44771525 4,9 C4,9.55228475 3.55228475,10 3,10 Z M7,2 C6.44771525,2 6,1.55228475 6,1 C6,0.44771525 6.44771525,0 7,0 C7.55228475,0 8,0.44771525 8,1 C8,1.55228475 7.55228475,2 7,2 Z M7,6 C6.44771525,6 6,5.55228475 6,5 C6,4.44771525 6.44771525,4 7,4 C7.55228475,4 8,4.44771525 8,5 C8,5.55228475 7.55228475,6 7,6 Z M7,10 C6.44771525,10 6,9.55228475 6,9 C6,8.44771525 6.44771525,8 7,8 C7.55228475,8 8,8.44771525 8,9 C8,9.55228475 7.55228475,10 7,10 Z'%3E%3C/path%3E%3C/svg%3E")`
</script>

<style>
div[data-container],
img[draggable='true'] {
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
}

div[data-container] > * {
  cursor: default;
}

.tiptap p.is-empty::before {
  color: rgba(var(--textPrimary) / 0.5);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.drag-handle {
  position: fixed;
  opacity: 1;
  transition: opacity ease-in 0.2s;
  border-radius: 0.25rem;
  background-image: v-bind(svgUrl);
  background-size: calc(0.5em + 0.375rem) calc(0.5em + 0.375rem);
  background-repeat: no-repeat;
  background-position: center;
  width: 1.2rem;
  height: 1.5rem;
  z-index: 50;
  cursor: grab;

  &:hover {
    background-color: rgba(var(--textPrimary) / 0.1);
    transition: opacity 0.2s;
  }

  &:active {
    background-color: rgba(var(--textPrimary) / 0.1);
    transition: opacity 0.2s;
    cursor: grabbing;
  }

  &.hide {
    opacity: 0;
    pointer-events: none;
  }

  @media screen and (max-width: 600px) {
    display: none;
    pointer-events: none;
  }
}

/* tiptap table style */
.tiptap-table {
  border-collapse: collapse;
  width: 100%;
  text-align: left;
}

.tiptap-table th,
.tiptap-table td {
  padding: 8px;
  border: 1px solid;
}

.tiptap-table p {
  margin: 0;
}

/* Styling for drop position */
.ProseMirror-selectednode {
  outline: 3px solid rgba(var(--primary) / 0.2);
}

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
.tiptap img:not(:last-child),
.tiptap ol:not(:last-child),
.tiptap ul:not(:last-child),
.tiptap blockquote:not(:last-child),
.tiptap hr:not(:last-child),
.tiptap .code-block:not(:last-child),
.tiptap [data-node-view-wrapper]:not(:last-child),
.tiptap [data-container]:not(:last-child),
.tiptap [data-youtube-video]:not(:last-child) {
  margin-bottom: 1rem;
}

.tiptap ol,
.tiptap ul {
  list-style-position: inside;
}

.tiptap li {
  margin-bottom: 0.5rem;
}

/* tiptap automatically adds p tags inside each li */
.tiptap li > p {
  display: inline-block;
}
.tiptap ul[data-type='taskList'] li label {
  margin-right: 1em; /* Add space between checkbox and div */
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
