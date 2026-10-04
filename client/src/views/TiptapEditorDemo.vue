<script setup lang="ts">
import initialContent from '@/config/editor/initialContent.html?raw'
import { useEditorStore } from '@/stores/editorStore'
import { paramString } from '@/utils/router'
import type { Editor } from '@tiptap/vue-3'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const store = useEditorStore()

// The view stays while its address changes (the Demo link from a page, back to the page), so each
// address opens in a new editor, as arriving does: undo and Save can't reach the page before.
// Saving a new page gives it an address; that's the page already open, so it stays. Only what
// the address opens counts (what fill reads), not its hash.
const opened = ref(0)
watch([() => route.params.slug, () => route.query.seed, () => route.query.autoTag], () => {
	if (route.name !== 'editor' && route.name !== 'editor-page') return
	const slug = paramString(route.params.slug)
	if (!slug || slug !== store.currentSlug) opened.value++
})

// Each new editor gets what the address asks for: the demo, the layout test cases, a stored
// page, or a new page (autoTag: saved into that collection). Returned, so a page that fails to
// load reaches Vue's error handler.
watch(
	() => store.editor,
	(editor) => (editor ? fill(editor) : undefined),
)

async function fill(editor: Editor) {
	const { seed, autoTag } = route.query
	const slug = paramString(route.params.slug)
	if (seed === 'true') {
		editor.commands.setContent(initialContent)
		return
	}
	// The layout test cases (client/e2e), downloaded only when asked for.
	if (seed === 'tests') {
		const { default: testContent } = await import('@/config/editor/testContent.html?raw')
		if (store.editor === editor) editor.commands.setContent(testContent)
		return
	}
	if (slug) await store.loadPage(slug)
	const raw = Number(autoTag)
	if (Number.isInteger(raw) && raw > 0 && store.editor === editor) store.pendingAutoTag = raw
}
</script>

<template>
	<TiptapEditor :key="opened" />
</template>
