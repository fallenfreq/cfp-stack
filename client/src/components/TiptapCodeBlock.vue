<template>
  <NodeViewWrapper contenteditable="true" class="code-block">
    <div class="flex b bg-backgroundSecondary p-2 border-b justify-end rounded-t-lg">
      <select class="bg-transparent" contenteditable="false" v-model="selectedLanguage">
        <option :value="null">auto</option>
        <option disabled>—</option>
        <option v-for="(language, index) in languages" :value="language" :key="index">
          {{ language }}
        </option>
      </select>
    </div>
    <pre class="rounded-b-lg"><code><NodeViewContent /></code></pre>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { computed, ref } from 'vue'
import type { NodeViewProps } from '@tiptap/vue-3'

// Define props using the `defineProps` function from script setup
const props = defineProps(nodeViewProps)

// Emit function for emitting events
const emit = defineEmits<{
  (event: 'updateAttributes', payload: { language: string }): void
}>()

// Reactive state for languages
const languages = ref<string[]>(props.extension.options.lowlight.listLanguages())

// Computed property for selected language
const selectedLanguage = computed({
  get() {
    return props.node.attrs.language
  },
  set(language: string) {
    emit('updateAttributes', { language })
  }
})
</script>

<style scoped>
pre {
  background: rgb(var(--backgroundSecondary));
  color: rgb(var(--textPrimary));
  font-family: 'JetBrainsMono', monospace;
  padding: 0.75rem 1rem;
}
</style>
