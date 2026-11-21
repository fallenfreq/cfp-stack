<template>
	<ToolbarButton
		tooltip="Code view"
		:pressed="editorStore.isCodeView"
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
