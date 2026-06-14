<template>
	<div v-if="notFound" class="p-7">Page not found.</div>
	<div v-else-if="!ready || !editor" class="p-7">Loading…</div>
	<EditorContent v-else :editor="editor" />
</template>

<script setup lang="ts">
import { getContentExtensions } from '@/config/editor/contentExtensions'
import { lowlight } from '@/config/editor/lowlight'
import { trpc } from '@/trpc'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const notFound = ref(false)
const ready = ref(false)

const editor = useEditor({
	editable: false,
	content: '',
	extensions: [
		CodeBlockLowlight.configure({ lowlight }),
		Youtube,
		...getContentExtensions(),
	],
})

onMounted(async () => {
	const page = await trpc.sitePages.get
		.query({ slug: route.params.slug as string })
		.catch(() => null)
	if (!page || !editor.value) {
		notFound.value = true
		return
	}
	try {
		editor.value.commands.setContent(JSON.parse(page.contentJson), {
			errorOnInvalidContent: true,
		})
		ready.value = true
	} catch {
		notFound.value = true
	}
})

onUnmounted(() => editor.value?.destroy())
</script>
