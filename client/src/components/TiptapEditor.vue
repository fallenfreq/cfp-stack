<template>
  <FloatingEditorMenu
    v-if="editor"
    :editor="editor"
    class="flex flex-wrap gap-2 px-7 sticky top-2 z-10"
  />
  <EditorContent class="p-7" :editor="editor" />
</template>

<script setup lang="ts">
import { useEditor, EditorContent, VueNodeViewRenderer, type NodeViewProps } from '@tiptap/vue-3'
import { registerCustomNodes } from '@/tiptap/registerCustomNodes'
import { AllowAttributesExtension } from '@/tiptap/allowAttributesExtension'
import cssVariables from '../../cssVariables.js'
import initialContent from '@/tiptap/initialContent.html?raw'

import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Span from '@/tiptap/spanExtention'
import Div from '@/tiptap/divExtention'

import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

// Drag handle extension
// used by GlobalDragHandle already
// import DropCursor from '@tiptap/extension-dropcursor'
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import AutoJoiner from 'tiptap-extension-auto-joiner'

import TiptapCodeBlock from './TiptapCodeBlock.vue'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

import { type Component, watch } from 'vue'
import FloatingEditorMenu from './FloatingEditorMenu.vue'

import { useEditorStore } from '@/stores/editorStore.js'

const editor = useEditor({
  extensions: [
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(TiptapCodeBlock as Component<NodeViewProps>)
      }
    }).configure({ lowlight: useEditorStore().lowlight }),
    StarterKit.configure({
      codeBlock: false,
      bulletList: {
        HTMLAttributes: {
          class: 'list-disc list-outside leading-3 -mt-2'
        }
      },
      orderedList: {
        HTMLAttributes: {
          class: 'list-decimal list-outside leading-3 -mt-2'
        }
      },
      listItem: {
        HTMLAttributes: {
          class: 'leading-normal -mb-2'
        }
      },
      blockquote: {
        HTMLAttributes: {
          class: 'border-l-4 border-stone-700'
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
    Table.configure({ allowTableNodeSelection: true }),
    TableCell,
    TableHeader,
    TableRow,
    Span,
    Div,
    ...registerCustomNodes(),
    AllowAttributesExtension,
    GlobalDragHandle,
    AutoJoiner,
    TaskList.configure({
      HTMLAttributes: {
        class: 'not-prose pl-2'
      }
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: 'flex items-start my-4'
      },
      nested: true
    })
    // Markdown.configure({
    //   html: false,
    //   transformCopiedText: true
    // })
  ],
  content: initialContent,
  autofocus: true,
  parseOptions: {
    // preserveWhitespace: 'full'
  }
})

watch(
  () => editor.value,
  (newEditor) => {
    if (newEditor) {
      useEditorStore().setEditor(newEditor)
    }
  }
)
useEditorStore().setEditor(editor.value || null)
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
  /* Reset cursor for all child elements */
  cursor: default;
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
/* Styling for drop position */
.ProseMirror-selectednode {
  outline: 3px solid var(--purple);
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
