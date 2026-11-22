<template>
	<!-- The editor's bars: the page's, then the node path. One sticky box, whose height the page is
	     given. Only the path's row meets the page, whose Cards (depth 1) scroll under it, so it's a
	     layer above them (depth 2); the page's row meets only the path's, so it's depth 1, and the two
	     rows look apart. Side padding puts the controls on the page line (sl-inset-line). -->
	<div ref="bar" class="editor-top-bar">
		<!-- Where the row is narrow (xs), the warnings and Code view go into "⋯", which then wears the
		     warning count. The menu's items measure this row too: a menu straight in a popover doesn't
		     measure (sf-system.md, "A popover is laid out on its own"). -->
		<div
			class="top-bar__page sl-cluster sf-gap-2xs sl-inset-line sf-depth-1 sf-size-2xs sf-is-sticky sf-is-edge-left sf-is-edge-right"
		>
			<EditorExitButton />
			<input
				ref="nameInput"
				v-model="nameInputValue"
				class="top-bar__name sf sf-field sf-single-line sf-is-contained sf-loudness-1 sf-on-hover sf-size-xs"
				:title="currentName ?? 'Untitled'"
				@focus="startRename"
				@blur="commitRename"
				@keyup.enter="nameInput?.blur()"
				@keyup.escape="cancelRename"
			/>
			<!-- The page's warnings (pageWarnings.ts): each press selects the next block with one. -->
			<SfTooltip v-if="shownWarnings" text="Next warning" class="sl-hide-below-xs">
				<SfButton
					size="xs"
					:loudness="1"
					variant="warning"
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
				:loudness="store.hasUnsavedChanges ? 3 : 1"
				:variant="saveStatus === 'error' ? 'danger' : undefined"
				:loading="saveStatus === 'saving'"
				@click="store.save()"
			>
				{{ saveWords }}
			</SfButton>
			<!-- Its own box, as the toggle's classes go to its button, not its tooltip's box. -->
			<div class="sl-cluster sl-hide-below-xs"><CodeViewToggle /></div>
			<SfBadge
				:count="shownWarnings"
				variant="warning"
				:loudness="3"
				class="sl-show-below-xs"
			>
				<SfOverflowMenu tooltip="Editor actions">
					<li v-if="shownWarnings" class="sl-show-below-xs">
						<SfButton
							size="xs"
							:loudness="1"
							variant="warning"
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
			class="sl-inset-line sf-depth-2 sf-size-2xs sf-is-sticky sf-is-edge-left sf-is-edge-right"
		>
			<NodePath :editor="editor" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextWarned, pageWarnings } from '@/editor/extensions/pageWarnings'
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

const warningCount = computed(() => pageWarnings(props.editor.state).length)
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

const renamingName = ref(false)
// What the name box shows: the name, kept up to date by the watch below from the start.
const nameInputValue = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

watch(
	currentName,
	(val) => {
		if (!renamingName.value) nameInputValue.value = val ?? 'Untitled'
	},
	{ immediate: true },
)

const startRename = () => {
	nameInputValue.value = currentName.value ?? ''
	renamingName.value = true
}

const commitRename = () => {
	renamingName.value = false
	const trimmed = nameInputValue.value.trim()
	if (trimmed && trimmed !== currentName.value) {
		store.renamePage(trimmed)
	} else {
		nameInputValue.value = currentName.value ?? 'Untitled'
	}
}

const cancelRename = () => {
	renamingName.value = false
	nameInputValue.value = currentName.value ?? 'Untitled'
	nameInput.value?.blur()
}
</script>

<style>
@layer ui {
	/* Layout only: the two rows, each padded by its depth × sf-size-2xs. */
	.editor-top-bar {
		position: sticky;
		top: 0;
		z-index: var(--z-nodepath);
		display: flex;
		flex-direction: column;
	}

	/* Name input — chrome comes from its classes (a field of one line, in a contained bar), plus
	   bare input:focus-visible for the editing look. It takes the row's free room, cut short
	   with an ellipsis. */
	.top-bar__name {
		flex: 1;
		min-width: 0;
		text-overflow: ellipsis;
		cursor: pointer;
		outline: none;
	}
	.top-bar__name:focus {
		cursor: text;
	}
}
</style>
