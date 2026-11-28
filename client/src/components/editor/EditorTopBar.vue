<template>
	<!-- The editor's bars: the page's, then the node path. One sticky box, whose height the page is
	     given. The page's row is on the page's surface (depth 0); the path's row is a bar (depth 1)
	     dividing it from the page, and its stuck line and shadow lift it off the Cards (depth 1) that
	     scroll under it. Side padding puts the controls on the page line (sl-inset-line). -->
	<div ref="bar" class="editor-top-bar">
		<!-- Where the row is narrow (xs), the warnings and Code view go into "⋮", which then wears a
		     mark in the warnings' colour; the number is its first item, as a count from two figures
		     would cover the dots. The menu's items measure this row too: a menu straight in a
		     popover doesn't measure (sf-system.md, "A popover is laid out on its own"). -->
		<div
			class="top-bar__page sl-cluster sf-gap-2xs sl-inset-line sf-depth-0 sf-size-xs sf-is-sticky sf-is-edge-left sf-is-edge-right"
		>
			<EditorExitButton />
			<!-- The name, in the row's free room, its box as wide as the name, and after it the mark
			     saying the page has changes not yet saved (beside it, not on its corner, where it sat
			     on the box's edge). Save says it in words, as the mark is for sight only. -->
			<div class="top-bar__name-room">
				<span class="top-bar__name-fit">
					<!-- Hidden copies of its hint and of what the box holds, with the box's classes
					     so each is the box's size: the box takes the wider, so it's never narrower
					     than the hint, even holding a space or a letter. Spaces kept, as the box
					     shows them. The hint's first: the row lines up on the first's text, and
					     the other's is empty with no name. -->
					<span :class="nameClasses" class="top-bar__name-copy" aria-hidden="true">{{
						hint.replaceAll(' ', '\u00a0')
					}}</span>
					<span :class="nameClasses" class="top-bar__name-copy" aria-hidden="true">{{
						nameInputValue.replaceAll(' ', '\u00a0')
					}}</span>
					<input
						ref="nameInput"
						v-model="nameInputValue"
						:class="nameClasses"
						class="top-bar__name sf-on-hover sf-on-focus"
						:placeholder="hint"
						:title="hint"
						@focus="startRename"
						@blur="commitRename"
						@keyup.enter="nameInput?.blur()"
						@keyup.escape="cancelRename"
					/>
				</span>
				<span v-if="store.hasUnsavedChanges" class="sf-badge" aria-hidden="true" />
			</div>
			<!-- The page's warnings (pageWarnings.ts): each press selects the next block with one. -->
			<SfTooltip v-if="shownWarnings" text="Next warning" class="sl-hide-below-xs">
				<SfButton
					size="xs"
					:loudness="1"
					:variant="warningVariant"
					class="sf-is-contained sf-single-line"
					:aria-label="warningsName"
					@mousedown.prevent
					@click="goToNextWarning"
				>
					<span class="material-symbols-rounded sf-icon">warning</span>
					{{ warningCount }}
				</SfButton>
			</SfTooltip>
			<SfButton
				v-if="store.couldSave"
				size="xs"
				class="sf-is-contained sf-single-line"
				:loudness="1"
				:variant="saveStatus === 'error' ? 'danger' : undefined"
				:loading="saveStatus === 'saving'"
				@click="store.save()"
			>
				{{ saveWords }}
			</SfButton>
			<!-- Its own box, as the toggle's classes go to its button, not its tooltip's box. -->
			<div class="sl-cluster sl-hide-below-xs"><CodeViewToggle /></div>
			<SfBadge
				:count="shownWarnings ? undefined : 0"
				:variant="warningVariant"
				:loudness="3"
				class="sl-show-below-xs"
			>
				<SfOverflowMenu tooltip="Editor actions">
					<li v-if="shownWarnings" class="sl-show-below-xs">
						<SfButton
							size="xs"
							:loudness="1"
							:variant="warningVariant"
							class="sf-is-contained sf-single-line"
							:aria-label="warningsName"
							@click="goToNextWarning"
						>
							<span class="material-symbols-rounded sf-icon" aria-hidden="true"
								>warning</span
							>
							{{ warningsWords }}
						</SfButton>
					</li>
					<li class="sl-show-below-xs">
						<SfButton
							size="xs"
							:loudness="1"
							class="sf-is-contained"
							:pressed="isCodeView"
							@click="store.toggleCodeView"
							>Code view</SfButton
						>
					</li>
					<li><DarkModeSwitch>Dark mode</DarkModeSwitch></li>
					<li>
						<SfButton size="xs" :loudness="1" class="sf-is-contained" disabled
							>Settings</SfButton
						>
					</li>
				</SfOverflowMenu>
			</SfBadge>
		</div>
		<!-- The box, apart from the path's scroll area. -->
		<div
			class="sl-inset-line sf-depth-1 sf-size-2xs sf-is-sticky sf-is-edge-left sf-is-edge-right"
		>
			<NodePath :editor="editor" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextWarned, pageWarnings, warningVariantOf } from '@/editor/extensions/pageWarnings'
import { editorTopBarHeight } from '@/editor/extensions/scrollClearOfEditorTopBar'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { useEditorStore } from '@/stores/editorStore'
import type { Editor } from '@tiptap/vue-3'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CodeViewToggle from './CodeViewToggle.vue'
import EditorExitButton from './EditorExitButton.vue'
import NodePath from './NodePath.vue'

const props = defineProps<{ editor: Editor }>()

// The bar's height while it's shown: the page frame leaves room past the end of the page for
// the last line to sit under it (the CSS variable), and the editors keep the line worked on and a
// cursor put back clear of it (scrollClearOfEditorTopBar.ts). It's there as the bar shows, as the
// page opens, not a frame later.
const bar = ref<HTMLElement | null>(null)
const page = document.documentElement.style
const giveHeight = (px: number) => {
	editorTopBarHeight.value = px
	page.setProperty('--editor-top-bar-height', `${px}px`)
}
const barHeight = new ResizeObserver(([entry]) => giveHeight(entry!.borderBoxSize[0]!.blockSize))
onMounted(() => {
	giveHeight(bar.value!.getBoundingClientRect().height)
	barHeight.observe(bar.value!)
})
onBeforeUnmount(() => {
	barHeight.disconnect()
	editorTopBarHeight.value = 0
	page.removeProperty('--editor-top-bar-height')
})

const store = useEditorStore()
const { page: open, isCodeView } = storeToRefs(store)
const currentName = computed(() => open.value?.name ?? null)
const saveStatus = computed(() => open.value?.saveStatus ?? 'idle')
// "Saved" only for a stored page with nothing new to keep; a page never saved isn't saved anywhere.
const saveWords = computed(() =>
	saveStatus.value === 'saving'
		? 'Saving…'
		: open.value?.pageId != null && !store.hasUnsavedChanges
			? 'Saved'
			: 'Save',
)

const warnings = computed(() => pageWarnings(props.editor.state))
const warningCount = computed(() => warnings.value.length)
const warningVariant = computed(() => warningVariantOf(warnings.value))
// The code view hides the page, and with it the warnings.
const shownWarnings = computed(() => (isCodeView.value ? 0 : warningCount.value))
const warningsWords = computed(
	() => `${warningCount.value} ${warningCount.value === 1 ? 'warning' : 'warnings'}`,
)
const warningsName = computed(() => `${warningsWords.value}: go to the next`)
const dragHandleStore = useDragHandleStore()
// Selected as a whole, in the middle of the screen, or, taller than that leaves room for, with its
// top under the bar and the block's toolbar. The toolbar works on the block at the active depth,
// so that's the block's.
const goToNextWarning = () => {
	const { editor } = props
	const pos = nextWarned(editor.state)
	if (pos === undefined) return
	dragHandleStore.setActiveDepth(editor.state.doc.resolve(pos).depth + 1)
	editor.chain().setNodeSelection(pos).focus(null, { scrollIntoView: false }).run()
	const box = editor.view.nodeDOM(pos)
	if (!(box instanceof Element) || !bar.value) return
	const { top, height } = box.getBoundingClientRect()
	const toolbar =
		parseFloat(getComputedStyle(bar.value).getPropertyValue('--toolbar-height')) || 0
	const clear = editorTopBarHeight.value + toolbar + 16
	scrollBy({ top: top - Math.max(clear, (innerHeight - height) / 2) })
}

// Cmd+S (Ctrl+S) saves, as Save does, wherever the editor has the keys; the browser's own "Save
// page as" is never what's meant here. A name being typed is kept first, as Enter does. Nothing
// while a save is under way, as Save can't be pressed then either.
const saveByKeys = (event: KeyboardEvent) => {
	if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
	if (event.key.toLowerCase() !== 's' || !store.couldSave) return
	event.preventDefault()
	if (event.repeat || store.saveUnderWay()) return
	if (document.activeElement === nameInput.value) nameInput.value?.blur()
	void store.save()
}
onMounted(() => addEventListener('keydown', saveByKeys))
onBeforeUnmount(() => removeEventListener('keydown', saveByKeys))

const nameClasses = 'sf sf-field sf-single-line sf-is-contained sf-loudness-1 sf-size-xs'
const renamingName = ref(false)
// What the name box holds: the name, kept up to date by the watch below from the start. A page
// with none holds nothing, so a click doesn't empty the box. Its hint is what an empty box leaves
// the page called: its name, which leaving it empty keeps, or with none "Untitled".
const hint = computed(() => currentName.value ?? 'Untitled')
const nameInputValue = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

watch(
	currentName,
	(val) => {
		if (!renamingName.value) nameInputValue.value = val ?? ''
	},
	{ immediate: true },
)

const startRename = () => {
	renamingName.value = true
}

const commitRename = () => {
	renamingName.value = false
	const trimmed = nameInputValue.value.trim()
	if (trimmed && trimmed !== currentName.value) {
		store.renamePage(trimmed)
	} else {
		nameInputValue.value = currentName.value ?? ''
	}
}

const cancelRename = () => {
	renamingName.value = false
	nameInputValue.value = currentName.value ?? ''
	nameInput.value?.blur()
}
</script>

<style>
@layer ui {
	/* Layout only: the two rows, each padded by its depth × size. The page's row is a size up
	   (xs), so the mark on the corner of "⋮" has room under the top of the screen. */
	.editor-top-bar {
		position: sticky;
		top: 0;
		z-index: var(--z-nodepath);
		display: flex;
		flex-direction: column;
	}

	/* The name: the room is the row's free room; in it, the name box takes its hidden copies'
	   size, as they share one grid cell: the name's width or the hint's, or the room's, cut short
	   with an ellipsis. A copy hides what overflows, so it can be narrower than its words and the page
	   doesn't scroll sideways. A width of 0 keeps the input's own default width out of the fit.
	   Chrome comes from the classes: a field of one line, contained in the bar, with a look for
	   focus. The unsaved mark follows the name on its line, centred, and never wraps under it
	   (a cluster would). */
	.top-bar__name-room {
		flex: 1 1 0;
		display: flex;
		align-items: center;
		gap: var(--sf-spacing-2xs);
	}
	.top-bar__name-fit {
		display: grid;
	}
	.top-bar__name-fit > * {
		grid-area: 1 / 1;
	}
	.top-bar__name-copy {
		visibility: hidden;
		overflow: hidden;
	}
	.top-bar__name {
		width: 0;
		min-width: 100%;
		text-overflow: ellipsis;
		cursor: pointer;
	}
	.top-bar__name:focus {
		cursor: text;
	}
}
</style>
