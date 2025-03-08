<template>
  <NodeViewWrapper contenteditable="true" class="code-block">
    <div class="hljs flex p-2 justify-end relative shadow-sm dark:shadow-black/50 rounded-t-lg">
      <select
        class="bg-transparent"
        contenteditable="false"
        v-model="selectedLanguage"
        :disabled="editorStore.isCodeView"
      >
        <option :value="null">Auto</option>
        <option disabled>—</option>
        <option v-for="(language, index) in languages" :value="language" :key="index">
          {{ languagesName[index] }}
        </option>
      </select>
    </div>
    <pre class="hljs rounded-b-lg"><code><NodeViewContent /></code></pre>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { computed } from 'vue'
import highlight from 'highlight.js'
import { useEditorStore } from '@/stores/editorStore'
const editorStore = useEditorStore()

const props = defineProps<NodeViewProps>()
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
  padding: 0.75rem 1rem;
}
</style>
