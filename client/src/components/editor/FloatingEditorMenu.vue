<template>
	<div
		v-if="show"
		ref="toolbar"
		class="floating-toolbar flex flex-wrap gap-2 px-7 sticky top-2 z-10"
		:style="{ top: `${position.top}px`, left: `${position.left}px` }"
	>
		<!-- Use for when the caret is not in a text block  -->
		<!--
    <VaChip v-if="!isTextNodeType">
    </VaChip>
    -->
		<VaChip
			v-if="isTextNodeType && !editorStore.isCodeView"
			:class="{ 'is-active': editor.isActive('codeBlock') }"
			@click="editor.chain().focus().toggleCodeBlock().run()"
		>
			Code Block
		</VaChip>
		<VaChip v-if="selectedNodeType === 'codeBlock'" @click="() => prettifySelectedCode(editor)">
			Format
		</VaChip>
	</div>
	<div class="bottom-right-nav">
		<VaChip @click="editorStore.toggleCodeView">
			{{ editorStore.isCodeView ? 'Aa' : '< >' }}
		</VaChip>
	</div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editorStore.js'
import { prettifySelectedCode } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const editorStore = useEditorStore()
const props = defineProps<{ editor: Editor }>()

const show = ref(false)
const position = ref({ top: 0, left: 0 })
const toolbar = ref<HTMLElement | null>(null)
const selectedNodeType = ref<string | null>(null)
const isTextNodeType = ref(false)

const updatePosition = async () => {
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

	show.value = true
	await nextTick()

	if (!nonTextNode) {
		show.value = false
		return
	}

	const rect = nonTextNode.getBoundingClientRect()
	const toolbarHeight = toolbar.value?.offsetHeight || 48
	const toolbarSpacing = 10

	position.value = {
		top: rect.top + window.scrollY - toolbarHeight - toolbarSpacing,
		left: rect.left + window.scrollX,
	}

	show.value = true
}

onMounted(() => {
	props.editor.on('transaction', updatePosition)
	window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
	props.editor.off('transaction', updatePosition)
	window.removeEventListener('resize', updatePosition)
})
</script>

<style>
.bottom-right-nav {
	position: fixed;
	bottom: 0;
	right: 0;
	padding: 8px;
	z-index: 1000;
}
.floating-toolbar {
	position: absolute;
	background: rgba(var(--backgroundSecondary) / 0.9);
	border: 1px solid rgb(var(--backgroundBorder));
	padding: 8px;
	border-radius: 4px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	z-index: 1000;
	transition:
		transform 0.15s ease-in-out,
		opacity 0.15s ease-in-out;
}
</style>
