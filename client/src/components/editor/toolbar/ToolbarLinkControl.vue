<template>
	<ToolbarRevealInput
		icon-name="link"
		placeholder="https://example.com"
		:initial-url="linkHref"
		:on-apply="applyLink"
		:on-remove="isLinkActive ? removeLink : undefined"
	/>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'
import ToolbarRevealInput from './ToolbarRevealInput.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const linkHref = computed(() => (props.editor.getAttributes('link').href as string) ?? '')
const isLinkActive = computed(() => props.editor.isActive('link'))

const applyLink = (url: string) => {
	props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const removeLink = () => {
	props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
}
</script>
