<template>
  <div
    v-if="show"
    ref="toolbar"
    class="floating-toolbar"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
  >
    <VaChip
      @click="editor.chain().focus().toggleCodeBlock().run()"
      :class="{ 'is-active': editor.isActive('codeBlock') }"
    >
      Code Block
    </VaChip>
    <VaChip @click="() => prettifySelectedCode(editor)">Format</VaChip>
    <VaChip @click="editorStore.toggleCodeView">
      {{ editorStore.isCodeView ? 'Aa' : '</>' }}
    </VaChip>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { prettifySelectedCode } from '@/tiptap/editorUtils'
import { useEditorStore } from '@/stores/editorStore.js'
import type { Editor } from '@tiptap/vue-3'

const editorStore = useEditorStore()
const props = defineProps<{ editor: Editor }>()

const show = ref(false)
const position = ref({ top: 0, left: 0 })
const toolbar = ref<HTMLElement | null>(null)

const updatePosition = async() => {
  const { view, state } = props.editor
  const { selection } = state
  const { from } = selection

  // Get the node at the selection position
  let dom = view.domAtPos(from).node as Node

  // Ensure we get an HTML element, not a text node
  if (dom.nodeType === Node.TEXT_NODE && dom.parentElement) {
    dom = dom.parentElement
  }

  // If still no valid element, hide the toolbar
  if (!(dom instanceof HTMLElement)) {
    show.value = false
    return
  }
  // Ensure the toolbar is rendered to measure its height
  show.value = true
  await nextTick()

  // Get the height of the toolbar
  const toolbarHeight = toolbar.value?.offsetHeight || 48
  show.value = false
  // Get the position of the node
  const rect = dom.getBoundingClientRect()
  position.value = {
    top: rect.top + window.scrollY - (toolbarHeight+10),
    left: rect.left + window.scrollX,
  }

  show.value = true
}


// Watch for selection changes
watch(() => props.editor.state.selection, updatePosition)

// Attach event listener for window resize
onMounted(() => {
  props.editor.on('selectionUpdate', updatePosition)
  window.addEventListener('resize', updatePosition)
})

// Cleanup event listener
onUnmounted(() => {
  window.removeEventListener('resize', updatePosition)
})
</script>

<style>
.floating-toolbar {
  position: absolute;
  background: rgba(var(--backgroundSecondary)/ 0.9);
  border: 1px solid rgb(var(--backgroundBorder));
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: transform 0.15s ease-in-out, opacity 0.15s ease-in-out;
}
</style>
