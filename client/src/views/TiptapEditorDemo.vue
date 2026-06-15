<script setup lang="ts">
import initialContent from '@/config/editor/initialContent.html?raw'
import { useEditorStore } from '@/stores/editorStore'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const store = useEditorStore()

onMounted(async () => {
	const slug = route.params.slug
	if (route.query.seed === 'true') {
		const applyInitial = () => store.editor?.commands.setContent(initialContent)
		if (store.editor) {
			applyInitial()
		} else {
			const stop = watch(
				() => store.editor,
				(e) => {
					if (e) {
						stop()
						applyInitial()
					}
				},
			)
		}
		return
	}
	if (slug && typeof slug === 'string') {
		await store.loadPage(slug)
	}
	const autoTagId = route.query.autoTag ? Number(route.query.autoTag) : null
	if (autoTagId) {
		store.pendingAutoTag = autoTagId
	}
})
</script>

<template>
	<TiptapEditor />
</template>
