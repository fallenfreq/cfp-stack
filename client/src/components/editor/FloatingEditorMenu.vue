<template>
	<div
		v-if="show"
		class="floating-toolbar sf-depth-2 sf-is-overlay sl-cluster sf-gap-xs sf-size-xs"
		:style="{ top: `${position.top}px`, left: `${position.left}px` }"
	>
		<!-- Use for when the caret is not in a text block: (placeholder for a future chip) -->
		<SfChip
			v-if="isTextNodeType && !editorStore.isCodeView"
			size="xs"
			:pressed="editor.isActive('codeBlock')"
			@click="editor.chain().focus().toggleCodeBlock().run()"
		>
			Code Block
		</SfChip>
		<SfChip
			v-if="selectedNodeType === 'codeBlock'"
			size="xs"
			@click="() => prettifySelectedCode(editor)"
		>
			Format
		</SfChip>
	</div>
	<div class="bottom-right-nav">
		<SfChip size="xs" @click="editorStore.toggleCodeView">
			{{ editorStore.isCodeView ? 'Aa' : '< >' }}
		</SfChip>
	</div>
</template>

<script setup lang="ts">
import SfChip from '@/components/SfChip.vue'
import { useEditorStore } from '@/stores/editorStore.js'
import { prettifySelectedCode } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { onMounted, onUnmounted, ref } from 'vue'

const editorStore = useEditorStore()
const props = defineProps<{ editor: Editor }>()

const show = ref(false)
const position = ref({ top: 0, left: 0 })
const selectedNodeType = ref<string | null>(null)
const isTextNodeType = ref(false)

const TOOLBAR_HEIGHT = 48
const TOOLBAR_SPACING = 10

const updatePosition = () => {
	const { view, state } = props.editor
	const { selection } = state
	const { anchor } = selection

	const resolvedPos = state.doc.resolve(anchor)
	const startPosition = resolvedPos.start(resolvedPos.depth)
	const parentNodeType = resolvedPos.parent.type.name
	const nodeType = state.doc.nodeAt(anchor)?.type.name

	isTextNodeType.value = nodeType === 'text'
	selectedNodeType.value = isTextNodeType.value || !nodeType ? parentNodeType : nodeType || null

	const nonTextNode = (
		isTextNodeType.value || !nodeType ? view.nodeDOM(startPosition - 1) : view.nodeDOM(anchor)
	) as HTMLElement | null

	if (!nonTextNode) {
		show.value = false
		return
	}

	const rect = nonTextNode.getBoundingClientRect()

	position.value = {
		top: rect.top - TOOLBAR_HEIGHT - TOOLBAR_SPACING,
		left: rect.left,
	}

	show.value = true
}

onMounted(() => {
	props.editor.on('transaction', updatePosition)
	window.addEventListener('resize', updatePosition)
	window.addEventListener('scroll', updatePosition, { passive: true })
})

onUnmounted(() => {
	props.editor.off('transaction', updatePosition)
	window.removeEventListener('resize', updatePosition)
	window.removeEventListener('scroll', updatePosition)
})
</script>

<style>
@layer ui {
	.bottom-right-nav {
		position: fixed;
		bottom: 0;
		right: 0;
		padding: var(--sf-spacing-xs);
		z-index: var(--z-toolbar);
	}

	/* .floating-toolbar padding comes from sf-depth-2 × sf-size-xs bridge. */
	.floating-toolbar {
		position: fixed;
		z-index: var(--z-toolbar);
		transition:
			transform 0.15s ease-in-out,
			opacity 0.15s ease-in-out;
	}
}
</style>
