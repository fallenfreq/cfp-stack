<template>
  <NodeViewWrapper class="code-block">
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

<script lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

export default {
  components: {
    NodeViewWrapper,
    NodeViewContent
  },

  props: nodeViewProps,

  data() {
    return {
      languages: this.extension.options.lowlight.listLanguages()
    }
  },

  computed: {
    selectedLanguage: {
      get() {
        return this.node.attrs.language
      },
      set(language: string) {
        this.updateAttributes({ language })
      }
    }
  }
}
</script>

<style scoped>
pre {
  background: rgb(var(--backgroundSecondary));
  color: rgb(var(--textPrimary));
  font-family: 'JetBrainsMono', monospace;
  padding: 0.75rem 1rem;
}
</style>
