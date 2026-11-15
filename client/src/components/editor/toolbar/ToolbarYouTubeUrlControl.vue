<template>
	<ToolbarRevealInput
		icon-name="edit"
		:tooltip="tooltip"
		placeholder="https://youtube.com/watch?v=..."
		:initial-url="initialUrl"
		:on-apply="applyUrl"
	/>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { isValidYoutubeUrl } from '@tiptap/extension-youtube'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import ToolbarRevealInput from './ToolbarRevealInput.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const initialUrl = computed(() => (props.context.activeNode.attrs['src'] as string) ?? '')

// A new address changes the video in place, keeping its class, style and id; it plays from the
// start, as a new video does.
const applyUrl = (url: string) =>
	props.context.nodePos !== null
	&& isValidYoutubeUrl(url) !== null
	&& props.editor
		.chain()
		.focus()
		.updateAttributesAt(props.context.nodePos, { src: url, start: 0 })
		.run()
</script>
