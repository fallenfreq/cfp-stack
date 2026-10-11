<script setup lang="ts">
import initialContent from '@/config/editor/initialContent.html?raw'
import { cancelModal, showConfirm } from '@/services/promptModal'
import { useEditorStore } from '@/stores/editorStore'
import { paramString } from '@/utils/router'
import type { Content } from '@tiptap/vue-3'
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import {
	onBeforeRouteLeave,
	onBeforeRouteUpdate,
	useRoute,
	useRouter,
	type RouteLocationNormalized,
} from 'vue-router'

const route = useRoute()
// Where the browser's history is, which vue-router follows.
const routerHistory = useRouter().options.history
const store = useEditorStore()

// The view stays while its address changes (the Demo link from a page, back to the page), so each
// address opens in a new editor, as arriving does: undo and Save can't reach the page before.
// Only what the address opens counts (what whatOpens reads), not its hash.
const opens = (at: RouteLocationNormalized) =>
	JSON.stringify([paramString(at.params.slug), at.query.seed, at.query.autoTag])
const isEditor = (at: RouteLocationNormalized) => at.name === 'editor' || at.name === 'editor-page'
// Saving a new page gives it an address; that's the page already open, so it stays.
const isOpenPage = (at: RouteLocationNormalized) => {
	const slug = paramString(at.params.slug)
	return slug !== '' && slug === store.currentSlug
}
const opened = ref(0)
watch(
	() => opens(route),
	() => {
		if (isEditor(route) && !isOpenPage(route)) opened.value++
	},
)

// Leaving the page on screen with edits Save could keep asks first.
const mayLoseEdits = () => store.couldSave && store.hasUnsavedChanges()

// Each move through this view, and how the newest ends. vue-router gives up a move a newer one
// overtakes, but the older one's answer still counts for Back and Forward: refused, they're taken
// back in the history. So an overtaken move ends as the newest does, or the address and the page
// shown come apart.
let moves = 0
let newest: Promise<boolean> = Promise.resolve(true)
// The move whose question is on screen, which a newer move takes down (it asks again if it must).
let asking = 0

function mayLeave(to: RouteLocationNormalized, from: RouteLocationNormalized) {
	const move = ++moves
	if (asking) cancelModal()
	newest = decide(move, to, from)
	return newest
}

async function decide(move: number, to: RouteLocationNormalized, from: RouteLocationNormalized) {
	const keepsPage = isEditor(to) && (opens(to) === opens(from) || isOpenPage(to))
	if (keepsPage) return true
	// Back and Forward have moved the browser's history to `to` already; a link does once let through.
	const byHistory = routerHistory.location === to.fullPath
	// A save under way finishes first, so what it stores isn't asked about.
	await store.whenSaved()
	if (move !== moves) return endAsNewest(to, byHistory)
	if (!mayLoseEdits()) return true
	asking = move
	const leave = await showConfirm('Leave without saving your changes?', { okText: 'Leave' })
	if (asking === move) asking = 0
	if (move !== moves) return endAsNewest(to, byHistory)
	return leave
}

// Refused, an overtaken Back or Forward is taken back once the newer one has been: WebKit drops
// the second of two steps through the history taken at once.
async function endAsNewest(to: RouteLocationNormalized, byHistory: boolean) {
	const leave = await newest
	if (!leave && byHistory) await historyAt(to.fullPath)
	return leave
}
const historyAt = (place: string) =>
	new Promise<void>((done) => {
		const check = () => {
			if (routerHistory.location !== place) return
			window.removeEventListener('popstate', check)
			done()
		}
		window.addEventListener('popstate', check)
		check()
	})
onBeforeRouteLeave(mayLeave)
onBeforeRouteUpdate(mayLeave)
// Closing the tab or reloading: the browser asks, in its own words.
const askBeforeUnload = (event: BeforeUnloadEvent) => {
	if (mayLoseEdits()) event.preventDefault()
}
window.addEventListener('beforeunload', askBeforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', askBeforeUnload))

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
