<script setup lang="ts">
import { useEditorStore } from '@/stores/editorStore'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const store = useEditorStore()

onMounted(async () => {
	const slug = route.params.slug
	if (slug && typeof slug === 'string') {
		await store.loadPage(slug)
	}
})
</script>

<template>
	<TiptapEditor />
</template>
