<template>
	<div class="style-attr-editor-root">
		<!-- Full screen stays in place, not teleported: inside a toolbar panel (a popover in
		     the top layer) a teleported overlay would paint under the panel, and a tap on it
		     would count as outside and close the panel. Fixed position still covers the screen. -->
		<div
			class="style-editor-wrap"
			:class="{ 'style-editor-wrap--overlay sf-scrim': fullscreen }"
			@mousedown.stop
			@mousedown.self="closeFullscreen"
		>
			<div
				class="style-editor-frame"
				:class="{ 'style-editor-frame--fs': fullscreen, 'sf-depth-2': fullscreen }"
			>
				<div ref="editorEl" class="style-attr-editor sf-content-frame" />
				<!-- Out of the Tab order so Tab goes from field to field. -->
				<SfButton
					v-if="!fullscreen"
					class="style-fs-open sf-is-contained"
					size="2xs"
					:loudness="1"
					aria-label="Full screen"
					tabindex="-1"
					@mousedown.prevent
					@click="fullscreen = true"
				>
					<span class="material-symbols-rounded sf-icon sf-text-xs">open_in_full</span>
				</SfButton>
				<SfButton
					v-if="fullscreen"
					class="style-fs-close sf-is-contained"
					size="2xs"
					:loudness="1"
					aria-label="Exit full screen"
					@mousedown.prevent
					@click="closeFullscreen"
				>
					<span class="material-symbols-rounded sf-icon sf-text-lg"
						>close_fullscreen</span
					>
				</SfButton>
			</div>
		</div>
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

// Esc leaves full screen only; cancelling the key stops it also closing the panel.
const onKeyDown = (e: KeyboardEvent) => {
	if (e.key !== 'Escape') return
	e.preventDefault()
	closeFullscreen()
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
@layer ui {
	.style-attr-editor-root {
		flex: 1;
		min-width: 0;
	}

	.style-editor-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
	}

	/* Positioning + centering only — chrome (background, blur) comes from sf-scrim. */
	.style-editor-wrap--overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
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
		padding: var(--sf-spacing-xs);
		display: flex;
		flex-direction: column;
	}

	/* Layout + CM overflow clipping + focus-color transition — chrome (border,
	   radius, :focus-within primary border) comes from sf-content-frame. */
	.style-attr-editor {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		transition: border-color 0.1s;
	}

	/* CodeMirror internal DOM — component-owned bridge to CM's expected layout.
	   The precise font-size / padding values are calibrated to CM's own metrics;
	   changing them to spacing tokens would risk breaking CM's line-measurement. */
	:deep(.cm-editor) {
		min-height: 44px;
		max-height: 150px;
		overflow-y: auto;
		background: rgb(var(--sf-surface-0));
	}

	.style-editor-frame--fs :deep(.cm-editor) {
		min-height: 0;
		max-height: 60vh;
		height: 60vh;
	}

	:deep(.cm-content) {
		font-size: var(--sf-text-xs);
		font-family: monospace;
		padding: 3px 5px;
	}

	:deep(.cm-focused) {
		outline: none;
	}

	/* The full-screen buttons sit in a corner: open in the code box's bottom corner,
	   close in the full-screen frame's top corner. */
	.style-fs-open {
		position: absolute;
		bottom: var(--sf-spacing-2xs);
		right: var(--sf-spacing-2xs);
	}

	.style-fs-close {
		position: absolute;
		top: var(--sf-spacing-xs);
		right: var(--sf-spacing-xs);
	}
}
</style>
