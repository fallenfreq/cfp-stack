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
const router = useRouter()
// Where the browser's history is, which vue-router follows.
const routerHistory = router.options.history
const store = useEditorStore()
// Ends what the view listens for when it closes.
const closed = new AbortController()
onBeforeUnmount(() => closed.abort())

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

// A move away that must wait for a save or ask is refused at once, so the address stays on the
// page shown (vue-router takes a Back or Forward back), and held: only the newest, which Leave
// makes again. `at` is a Back or Forward's place in the history.
let held: { to: string; at: number | null } | null = null
onBeforeUnmount(() => (held = null))
// The held move's question is on screen.
let asking = false
// The held move being made again, which goes.
let goingAgain: string | null = null

function mayLeave(to: RouteLocationNormalized, from: RouteLocationNormalized) {
	const again = to.fullPath === goingAgain
	goingAgain = null
	// A place on the page shown is newer than a held move, which it drops: the page stays.
	if (isEditor(to) && opens(to) === opens(from)) {
		held = null
		if (asking) cancelModal()
		return true
	}
	if (again || (isEditor(to) && isOpenPage(to))) return true
	if (!store.saveUnderWay() && !mayLoseEdits()) return true
	const deciding = held !== null
	// Back and Forward have moved the history to `to` already; a link hasn't.
	held = { to: to.fullPath, at: routerHistory.location === to.fullPath ? historyPlace() : null }
	if (!deciding) void decide()
	return false
}

async function decide() {
	// A save under way finishes first, so what it stores isn't asked about.
	await store.saveUnderWay()
	if (held && mayLoseEdits()) {
		asking = true
		const leave = await showConfirm('Leave without saving your changes?', { okText: 'Leave' })
		asking = false
		if (!leave) held = null
	}
	const move = held
	held = null
	if (!move) return
	// A Back or Forward is made again once the step taken back has landed (made meanwhile, it was
	// lost in Chrome and went a page too far in WebKit). A move held meanwhile is newer: it decides.
	if (move.at !== null) await historyOnPage()
	if (held) return
	const here = historyPlace()
	goingAgain = move.to
	if (move.at === null || here === null) router.push(move.to)
	else if (move.at !== here) router.go(move.at - here)
}

// Where the history is, by vue-router's count of its entries.
const historyPlace = () => {
	const { position } = routerHistory.state
	return typeof position === 'number' ? position : null
}
// Finishes once the history is on the page shown, unless the view closes first.
const historyOnPage = () =>
	new Promise<void>((done) => {
		const check = () => {
			if (routerHistory.location !== route.fullPath) return
			window.removeEventListener('popstate', check)
			done()
		}
		window.addEventListener('popstate', check, { signal: closed.signal })
		check()
	})
onBeforeRouteLeave(mayLeave)
onBeforeRouteUpdate(mayLeave)
// Closing the tab or reloading: the browser asks, in its own words.
window.addEventListener(
	'beforeunload',
	(event) => {
		if (mayLoseEdits()) event.preventDefault()
	},
	{ signal: closed.signal },
)

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
