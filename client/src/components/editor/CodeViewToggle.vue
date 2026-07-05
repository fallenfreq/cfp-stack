<template>
	<!-- Rule bend: fixed-position floating chrome would normally take sf-depth-2 +
	     sf-is-overlay (which also promotes buttons to pill radius). Left off so this
	     reads as a plain toolbar button — visually consistent with the inline-code
	     button in the floating toolbar. -->
	<div class="bottom-right-nav">
		<ToolbarButton :active="editorStore.isCodeView" @click="editorStore.toggleCodeView">
			<ToolbarIcon>{{ editorStore.isCodeView ? 'text_fields' : 'code' }}</ToolbarIcon>
		</ToolbarButton>
	</div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editorStore'
import ToolbarButton from './toolbar/ToolbarButton.vue'
import ToolbarIcon from './toolbar/ToolbarIcon.vue'

const editorStore = useEditorStore()
</script>

<style>
.bottom-right-nav {
	position: fixed;
	bottom: 0;
	right: 0;
	padding: 8px;
	z-index: var(--z-toolbar);
}
</style>
