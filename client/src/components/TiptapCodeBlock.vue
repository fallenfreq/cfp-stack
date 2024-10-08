<template>
  <NodeViewWrapper class="code-block">
    <select contenteditable="false" v-model="selectedLanguage">
      <option :value="null">auto</option>
      <option disabled>—</option>
      <option v-for="(language, index) in languages" :value="language" :key="index">
        {{ language }}
      </option>
    </select>
    <pre><code><NodeViewContent /></code></pre>
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

<style>
.tiptap .code-block {
  position: relative;
}

.tiptap .code-block select {
  position: absolute;
  background-color: rgb(var(--textPrimary));
  color: rgb(var(--backgroundPrimary));
  border-radius: 4px;
  right: 0.5rem;
  top: 0.5rem;
}
</style>
