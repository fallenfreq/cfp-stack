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

<style lang="scss">
.tiptap {
  .code-block {
    position: relative;

    select {
      position: absolute;
      background-color: rgb(var(--textPrimary));
      color: rgb(var(--backgroundPrimary));
      border-radius: 4px;
      // background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="pink" d="M7 10l5 5 5-5z"/></svg>');
      right: 0.5rem;
      top: 0.5rem;
    }
  }
}
</style>
