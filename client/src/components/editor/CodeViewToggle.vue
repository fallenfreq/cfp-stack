<template>
	<!-- Rule bend: fixed-position floating chrome would normally take sf-depth-2 +
	     sf-is-overlay (which also promotes buttons to pill radius). Left off so this
	     reads as a plain toolbar button — visually consistent with the inline-code
	     button in the floating toolbar. -->
	<ToolbarButton
		class="code-view-toggle"
		:current="editorStore.isCodeView"
		@click="editorStore.toggleCodeView"
	>
		<ToolbarIcon>{{ editorStore.isCodeView ? 'text_fields' : 'code' }}</ToolbarIcon>
	</ToolbarButton>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editorStore'
import ToolbarButton from './toolbar/ToolbarButton.vue'
import ToolbarIcon from './toolbar/ToolbarIcon.vue'

const editorStore = useEditorStore()
</script>

<style scoped>
@layer ui {
	.code-view-toggle {
		position: fixed;
		bottom: var(--sf-spacing-xs);
		right: var(--sf-spacing-xs);
		z-index: var(--z-toolbar);
	}
}
</style>
