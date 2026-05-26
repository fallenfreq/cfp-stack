<template>
	<div class="bottom-right-nav">
		<ToolbarButton :active="editorStore.isCodeView" @click="editorStore.toggleCodeView">
			{{ editorStore.isCodeView ? 'Aa' : '< >' }}
		</ToolbarButton>
	</div>
</template>

<script setup lang="ts">
import ToolbarButton from './toolbar/ToolbarButton.vue'
import { useEditorStore } from '@/stores/editorStore'

const editorStore = useEditorStore()
</script>

<style>
.bottom-right-nav {
	position: fixed;
	bottom: 0;
	right: 0;
	padding: 8px;
	z-index: 1000;
}
</style>
