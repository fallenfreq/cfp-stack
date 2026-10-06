<script setup lang="ts">
import initialContent from '@/config/editor/initialContent.html?raw'
import { useEditorStore } from '@/stores/editorStore'
import { paramString } from '@/utils/router'
import type { Content } from '@tiptap/vue-3'
import { ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const store = useEditorStore()

// The view stays while its address changes (the Demo link from a page, back to the page), so each
// address opens in a new editor, as arriving does: undo and Save can't reach the page before.
// Saving a new page gives it an address; that's the page already open, so it stays. Only what
// the address opens counts (what whatOpens reads), not its hash.
const opened = ref(0)
watch([() => route.params.slug, () => route.query.seed, () => route.query.autoTag], () => {
	if (route.name !== 'editor' && route.name !== 'editor-page') return
	const slug = paramString(route.params.slug)
	if (!slug || slug !== store.currentSlug) opened.value++
})

interface Opening {
	content: Content
	page: Awaited<ReturnType<typeof store.fetchPage>>
	autoTag: number | null
}

// What the address opens, worked out before its editor is made so the editor opens with it: the
// demo, the layout test cases, a stored page, or a new page (autoTag: saved into that collection).
const opening = shallowRef<Opening | null>(null)
const problem = ref<string | null>(null)

watch(opened, () => open(opened.value), { immediate: true })

async function open(at: number) {
	opening.value = null
	problem.value = null
	try {
		const next = await whatOpens()
		// The address moved on meanwhile: that one opens instead.
		if (opened.value !== at) return
		if (typeof next === 'string') problem.value = next
		else opening.value = next
	} catch (error) {
		// Only fetching throws: the page didn't arrive.
		console.error(error)
		if (opened.value === at) problem.value = "This page couldn't be loaded."
	}
}

// What the address opens, or why it can't (the message).
async function whatOpens(): Promise<Opening | string> {
	const { seed, autoTag } = route.query
	if (seed === 'true') return { content: initialContent, page: null, autoTag: null }
	// The layout test cases (client/e2e), downloaded only when asked for.
	if (seed === 'tests') {
		const { default: testContent } = await import('@/config/editor/testContent.html?raw')
		return { content: testContent, page: null, autoTag: null }
	}
	const raw = Number(autoTag)
	const tag = Number.isInteger(raw) && raw > 0 ? raw : null
	const slug = paramString(route.params.slug)
	if (!slug) return { content: '', page: null, autoTag: tag }
	const page = await store.fetchPage(slug)
	if (!page) return "There's no page at this address."
	// Anything but a document can't be opened: TipTap opens null as an empty page and a string
	// as HTML.
	let content: unknown
	try {
		content = JSON.parse(page.contentJson)
	} catch {
		return "This page can't be opened."
	}
	if (typeof content !== 'object' || content === null) return "This page can't be opened."
	return { content: content as Content, page, autoTag: tag }
}

// The page's details reach the store with its editor. An editor that refuses its content never
// gets there, so Save can't reach that page.
watch(
	() => store.editor,
	(editor) => {
		if (!editor || !opening.value) return
		if (opening.value.page) store.setPage(opening.value.page)
		if (opening.value.autoTag) store.pendingAutoTag = opening.value.autoTag
	},
)
</script>

<template>
	<SfStatusDisplay v-if="problem" state="error" :message="problem" />
	<TiptapEditor v-else-if="opening" :key="opened" :content="opening.content" />
	<SfStatusDisplay v-else state="loading" message="Loading editor…" />
</template>
