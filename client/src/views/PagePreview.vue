<template>
	<div v-if="notFound" class="p-7">Page not found.</div>
	<div v-else-if="!ready || !editor" class="p-7">Loading…</div>
	<div v-else class="relative">
		<div v-if="isAdmin" class="preview-edit-bar">
			<VaButton
				preset="secondary"
				size="small"
				:to="{ name: 'editor', params: { slug: route.params.slug } }"
			>
				Edit
			</VaButton>
		</div>
		<EditorContent :editor="editor" />
	</div>
</template>

<script setup lang="ts">
import { getContentExtensions } from '@/config/editor/contentExtensions'
import zitadelAuth from '@/services/zitadelAuth'
import { trpc } from '@/trpc'
import { paramString } from '@/utils/router'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const notFound = ref(false)
const ready = ref(false)
const isAdmin = computed(() => zitadelAuth.hasRole('admin'))

const editor = useEditor({
	editable: false,
	content: '',
	extensions: [...getContentExtensions()],
})

onMounted(async () => {
	const slug = paramString(route.params.slug)
	const page = await (
		isAdmin.value
			? trpc.adminPages.getBySlug.query({ slug })
			: trpc.publicPages.getBySlug.query({ slug })
	).catch(() => null)
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

<style scoped>
.preview-edit-bar {
	position: fixed;
	bottom: 1.5rem;
	right: 1.5rem;
	z-index: 50;
}
</style>
