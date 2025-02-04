<template>
  <div>
    <VaChip
      @click="editor.chain().focus().toggleCodeBlock().run()"
      :class="{ 'is-active': editor.isActive('codeBlock') }"
    >
      Code Block
    </VaChip>
    <VaChip @click="() => prettifySelectedCode(editor)">Format</VaChip>
    <VaChip @click="editorStore.toggleCodeView">
      {{ editorStore.isCodeView ? 'Aa' : `\<\/\>` }}
    </VaChip>
  </div>
</template>

<script setup lang="ts">
import { prettifySelectedCode } from '@/tiptap/editorUtils'
import { useEditorStore } from '@/stores/editorStore.js'
const editorStore = useEditorStore()
import type { Editor } from '@tiptap/vue-3'
defineProps<{ editor: Editor }>()
</script>

<style></style>
