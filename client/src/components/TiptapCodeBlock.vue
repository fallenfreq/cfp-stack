<template>
  <NodeViewWrapper contenteditable="true" class="code-block">
    <div class="flex b bg-backgroundSecondary p-2 border-b justify-end rounded-t-lg">
      <select class="bg-transparent" contenteditable="false" v-model="selectedLanguage">
        <option :value="null">Auto</option>
        <option disabled>—</option>
        <option v-for="(language, index) in languages" :value="language" :key="index">
          {{ languagesName[index] }}
        </option>
      </select>
    </div>
    <pre class="rounded-b-lg"><code><NodeViewContent /></code></pre>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewContent, nodeViewProps, type NodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { computed } from 'vue'
import highlight from 'highlight.js'

const props = defineProps(nodeViewProps)
const languages: string[] = props.extension.options.lowlight.listLanguages()
const languagesName = languages.map((language) => {
  return highlight.getLanguage(language)?.name?.split(',')[0]
})

const selectedLanguage = computed({
  get() {
    return props.node.attrs.language
  },
  set(language: string) {
    props.updateAttributes({ language })
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
