<script setup lang="ts">
import { useEditorReady } from '@/composables/editor/useEditorReady'
import initialContent from '@/config/editor/initialContent.html?raw'
import { useEditorStore } from '@/stores/editorStore'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const store = useEditorStore()

if (route.query.seed === 'true') {
	useEditorReady((editor) => editor.commands.setContent(initialContent))
}

onMounted(async () => {
	if (route.query.seed === 'true') return
	const slug = route.params.slug
	if (slug && typeof slug === 'string') {
		await store.loadPage(slug)
	}
	const raw = Number(route.query.autoTag)
	const autoTagId = Number.isInteger(raw) && raw > 0 ? raw : null
	if (autoTagId) {
		store.pendingAutoTag = autoTagId
	}
})
</script>

<template>
	<TiptapEditor />
</template>
