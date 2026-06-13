<template>
	<NodeViewWrapper
		contenteditable="true"
		class="code-block"
		:style="{ '--code-radius': codeRadius }"
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
import { useEditorStore } from '@/stores/editorStore'
import { getClassToken } from '@/utils/editor/classTokens'
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import highlight from 'highlight.js'
import { computed } from 'vue'
const editorStore = useEditorStore()

const props = defineProps<NodeViewProps>()
const languages: string[] = props.extension.options.lowlight.listLanguages()
const languagesName = languages.map((language) => {
	return highlight.getLanguage(language)?.name?.split(',')[0]
})

const codeRadius = computed(() => {
	const cls = typeof props.node.attrs.class === 'string' ? props.node.attrs.class : ''
	const token = getClassToken(cls, 'sf-radius-')
	return token ? `var(--radius-${token})` : 'var(--radius-md)'
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

.code-block-header {
	border-top-left-radius: var(--code-radius);
	border-top-right-radius: var(--code-radius);
}

.code-block-body {
	border-bottom-left-radius: var(--code-radius);
	border-bottom-right-radius: var(--code-radius);
}
</style>
