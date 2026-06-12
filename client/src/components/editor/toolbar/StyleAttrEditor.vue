<template>
	<div class="style-attr-editor-root">
		<Teleport to="body" :disabled="!fullscreen">
			<div
				class="style-editor-wrap"
				:class="{ 'style-editor-wrap--overlay': fullscreen }"
				@mousedown.stop
				@mousedown.self="closeFullscreen"
			>
				<div class="style-editor-frame" :class="{ 'style-editor-frame--fs': fullscreen }">
					<div ref="editorEl" class="style-attr-editor" />
					<button
						v-if="!fullscreen"
						class="style-fs-open"
						tabindex="-1"
						@mousedown.prevent
						@click="fullscreen = true"
					>
						<span class="material-symbols-rounded">open_in_full</span>
					</button>
					<button
						v-if="fullscreen"
						class="style-fs-close"
						@mousedown.prevent
						@click="closeFullscreen"
					>
						<span class="material-symbols-rounded">close_fullscreen</span>
					</button>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { useDarkModeStore } from '@/stores/darkModeStore'
import { css } from '@codemirror/lang-css'
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { drawSelection, EditorView, highlightSpecialChars, keymap } from '@codemirror/view'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ value: string }>()
const emit = defineEmits<{ update: [value: string] }>()

const editorEl = ref<HTMLElement | null>(null)
const darkModeStore = useDarkModeStore()
const themeCompartment = new Compartment()
const fullscreen = ref(false)
let view: EditorView | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const flushDebounce = () => {
	if (debounceTimer === null) return
	clearTimeout(debounceTimer)
	debounceTimer = null
	const content = view?.state.doc.toString() ?? ''
	if (content !== props.value) emit('update', content)
}

onMounted(() => {
	view = new EditorView({
		state: EditorState.create({
			doc: props.value ?? '',
			extensions: [
				highlightSpecialChars(),
				drawSelection(),
				syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
				css(),
				bracketMatching(),
				keymap.of([
					{
						key: 'Enter',
						run: (v) => {
							v.dispatch(v.state.replaceSelection('\n'))
							return true
						},
					},
				]),
				themeCompartment.of(darkModeStore.isDarkMode ? oneDark : []),
				EditorView.lineWrapping,
				EditorView.updateListener.of((update) => {
					if (!update.docChanged) return
					if (debounceTimer !== null) clearTimeout(debounceTimer)
					debounceTimer = setTimeout(() => {
						debounceTimer = null
						emit('update', view!.state.doc.toString())
					}, 600)
				}),
			],
		}),
		parent: editorEl.value!,
	})
})

const closeFullscreen = () => {
	flushDebounce()
	fullscreen.value = false
}

const onKeyDown = (e: KeyboardEvent) => {
	if (e.key === 'Escape') closeFullscreen()
}

watch(fullscreen, async (isFs) => {
	if (isFs) document.addEventListener('keydown', onKeyDown)
	else document.removeEventListener('keydown', onKeyDown)
	await nextTick()
	view?.requestMeasure()
	if (isFs) view?.focus()
})

watch(
	() => darkModeStore.isDarkMode,
	(isDark) => {
		view?.dispatch({ effects: themeCompartment.reconfigure(isDark ? oneDark : []) })
	},
)

watch(
	() => props.value,
	(newVal) => {
		if (!view || view.state.doc.toString() === newVal) return
		view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: newVal ?? '' } })
	},
)

onUnmounted(() => {
	document.removeEventListener('keydown', onKeyDown)
	flushDebounce()
	view?.destroy()
	view = null
})
</script>

<style scoped>
.style-attr-editor-root {
	flex: 1;
	min-width: 0;
}

.style-editor-wrap {
	flex: 1;
	min-width: 0;
	display: flex;
}

.style-editor-wrap--overlay {
	position: fixed;
	inset: 0;
	z-index: var(--z-modal);
	background: rgb(0 0 0 / var(--alpha-50));
	display: flex;
	align-items: center;
	justify-content: center;
}

.style-editor-frame {
	flex: 1;
	min-width: 0;
	display: flex;
	position: relative;
}

.style-editor-frame--fs {
	position: relative;
	width: min(80vw, 800px);
	background: rgb(var(--backgroundSecondary));
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 8px;
	padding: 8px;
	display: flex;
	flex-direction: column;
}

.style-attr-editor {
	flex: 1;
	min-width: 0;
	border-radius: 3px;
	border: 1px solid rgb(var(--backgroundBorder));
	overflow: hidden;
	transition: border-color 0.1s;
}

.style-attr-editor:focus-within {
	border-color: rgb(var(--primary));
}

:deep(.cm-editor) {
	min-height: 44px;
	max-height: 150px;
	overflow-y: auto;
	background: rgb(var(--backgroundPrimary));
}

.style-editor-frame--fs :deep(.cm-editor) {
	min-height: 0;
	max-height: 60vh;
	height: 60vh;
}

:deep(.cm-content) {
	font-size: 0.75rem;
	font-family: monospace;
	padding: 3px 5px;
}

:deep(.cm-focused) {
	outline: none;
}

.style-fs-open {
	position: absolute;
	bottom: 3px;
	right: 3px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	background: none;
	border: none;
	border-radius: 3px;
	color: rgba(var(--textPrimary) / var(--alpha-30));
	cursor: pointer;
	padding: 0;
}

.style-fs-open:hover {
	color: rgb(var(--textPrimary));
	background: rgba(var(--backgroundPrimary) / var(--alpha-90));
}

.style-fs-open .material-symbols-rounded {
	font-size: 13px;
}

.style-fs-close {
	position: absolute;
	top: 8px;
	right: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	background: none;
	border: none;
	border-radius: 4px;
	color: rgba(var(--textPrimary) / var(--alpha-60));
	cursor: pointer;
}

.style-fs-close:hover {
	background: rgba(var(--textPrimary) / var(--alpha-10));
	color: rgb(var(--textPrimary));
}

.style-fs-close .material-symbols-rounded {
	font-size: 18px;
}
</style>
