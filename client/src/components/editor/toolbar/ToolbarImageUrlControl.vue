<template>
	<ToolbarRevealInput
		icon-name="edit"
		placeholder="https://example.com/image.png"
		:initial-url="initialUrl"
		:on-apply="applyUrl"
	/>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import ToolbarRevealInput from './ToolbarRevealInput.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const initialUrl = computed(() => (props.context.activeNode.attrs.src as string) ?? '')

const applyUrl = (url: string) =>
	props.editor.chain().focus().updateAttributes('image', { src: url }).run()
</script>
