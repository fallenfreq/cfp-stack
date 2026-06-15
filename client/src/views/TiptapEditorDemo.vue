<script setup lang="ts">
import initialContent from '@/config/editor/initialContent.html?raw'
import { useEditorStore } from '@/stores/editorStore'
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const store = useEditorStore()

let stopSeedWatch: (() => void) | null = null

onMounted(async () => {
	const slug = route.params.slug
	if (route.query.seed === 'true') {
		const applyInitial = () => store.editor?.commands.setContent(initialContent)
		if (store.editor) {
			applyInitial()
		} else {
			stopSeedWatch = watch(
				() => store.editor,
				(e) => {
					if (e) {
						stopSeedWatch?.()
						stopSeedWatch = null
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
	const raw = Number(route.query.autoTag)
	const autoTagId = Number.isInteger(raw) && raw > 0 ? raw : null
	if (autoTagId) {
		store.pendingAutoTag = autoTagId
	}
})

onUnmounted(() => {
	stopSeedWatch?.()
})
</script>

<template>
	<TiptapEditor />
</template>
