<template>
	<NodeViewWrapper
		contenteditable="true"
		class="code-block"
		:style="{ '--radius': RADIUS[radius] }"
	>
		<div
			class="code-block-header hljs flex p-2 justify-end relative shadow-sm dark:shadow-black/50"
		>
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
		<pre class="code-block-body hljs"><code><NodeViewContent /></code></pre>
	</NodeViewWrapper>
</template>

<script setup lang="ts">
import { RADIUS } from '@/config/editor/layoutTokens'
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

const radius = computed<keyof typeof RADIUS>(() => props.node.attrs.radius ?? 'md')

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

.code-block-header {
	border-top-left-radius: var(--radius);
	border-top-right-radius: var(--radius);
}

.code-block-body {
	border-bottom-left-radius: var(--radius);
	border-bottom-right-radius: var(--radius);
}
</style>
