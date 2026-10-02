<template>
	<SfStatusDisplay v-if="invalid" state="error" message="This page can't be shown." />
	<!-- page-content: in an inset, its blocks become the inset's items (slLayout.ts). -->
	<EditorContent v-else-if="editor" class="page-content" :editor="editor" />
</template>

<script setup lang="ts">
import { getContentExtensions } from '@/config/editor/contentExtensions'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'

// A page's content with no shell around it — the page route, a sheet or anything else
// puts it where it wants.
const props = defineProps<{
	page: { contentJson: string }
}>()

const invalid = ref(false)

const editor = useEditor({
	editable: false,
	content: '',
	extensions: [...getContentExtensions()],
})

watch(
	[editor, () => props.page.contentJson],
	([ed, json]) => {
		if (!ed) return
		try {
			ed.commands.setContent(JSON.parse(json), { errorOnInvalidContent: true })
			invalid.value = false
		} catch {
			invalid.value = true
		}
	},
	{ immediate: true },
)
</script>
