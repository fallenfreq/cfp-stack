<template>
	<NodeViewWrapper contenteditable="true" class="code-block">
		<!-- The block itself matches the published page (pre.sf.hljs plus the node's own
		     classes); the editor only adds the language picker above it. -->
		<div class="sl-stack sf-gap-2xs">
			<div class="code-block-header sl-cluster sf-gap-xs" contenteditable="false">
				<select
					v-model="selectedLanguage"
					class="sf sf-field sf-is-contained sf-size-2xs sf-on-focus"
					aria-label="Code language"
					:disabled="editorStore.isCodeView"
				>
					<option :value="null">Auto</option>
					<option disabled>—</option>
					<option v-for="(language, index) in languages" :key="index" :value="language">
						{{ languagesName[index] }}
					</option>
				</select>
			</div>
			<pre :class="['sf hljs', node.attrs.class]"><code><NodeViewContent /></code></pre>
		</div>
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
@layer ui {
	/* Flex rows right-align with justify-content (sl-align-x-* is grid-only). */
	.code-block-header {
		justify-content: end;
	}
}
</style>
