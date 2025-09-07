<template>
	<NodeViewWrapper contenteditable="true" class="code-block">
		<div class="hljs flex p-2 justify-end relative shadow-sm dark:shadow-black/50 rounded-t-lg">
			<select
				v-model="selectedLanguage"
				class="bg-transparent"
				contenteditable="false"
				:disabled="editorStore.isCodeView"
			>
				<option :value="null">Auto</option>
				<option disabled>—</option>
				<option v-for="(language, index) in languages" :key="index" :value="language">
					{{ languagesName[index] }}
				</option>
			</select>
		</div>
		<pre class="hljs rounded-b-lg"><code><NodeViewContent /></code></pre>
	</NodeViewWrapper>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editorStore'
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import highlight from 'highlight.js'
import { computed } from 'vue'
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
	},
})
</script>

<style scoped>
pre {
	padding: 0.75rem 1rem;
}
</style>
