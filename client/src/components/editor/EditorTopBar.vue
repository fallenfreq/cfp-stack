<template>
	<div
		ref="bar"
		class="editor-top-bar sf-depth-1 sf-size-2xs sf-is-sticky sf-is-edge-left sf-is-edge-right sl-inset-line sf-text-xs"
		:class="{ 'is-renaming': renamingName }"
	>
		<input
			ref="nameInput"
			v-model="nameInputValue"
			class="top-bar__name sf sf-is-contained sf-loudness-1 sf-on-hover sf-size-2xs"
			:title="currentName ?? 'Untitled'"
			@focus="startRename"
			@blur="commitRename"
			@keyup.enter="nameInput?.blur()"
			@keyup.escape="cancelRename"
		/>
		<NodePath :editor="editor" />
		<!-- The page's warnings (pageWarnings.ts): each press selects the next block with one. -->
		<SfTooltip v-if="warningCount && !isCodeView" text="Next warning">
			<SfButton
				size="2xs"
				:loudness="1"
				variant="warning"
				class="sf-is-contained sf-single-line"
				:aria-label="`${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}: go to the next`"
				@mousedown.prevent
				@click="goToNextWarning"
			>
				<span class="material-symbols-rounded sf-icon">warning</span>
				{{ warningCount }}
			</SfButton>
		</SfTooltip>
		<!-- Seen at a glance, as Save is in the actions. -->
		<span v-if="store.hasUnsavedChanges" class="sf-loudness-1 sf-single-line">Unsaved</span>
		<SfIconButton
			icon="three-dot"
			tooltip="Editor actions"
			size="2xs"
			:loudness="1"
			class="sf-is-contained"
			:current="actionsOpen"
			:aria-expanded="actionsOpen"
			@click="actionsOpen = !actionsOpen"
		/>
		<Transition name="top-bar-actions">
			<div v-if="actionsOpen" class="top-bar__actions">
				<!-- Not SfIconButton: the icon follows the save state and the spinner spins. -->
				<SfTooltip text="Save">
					<SfButton
						aria-label="Save"
						size="2xs"
						:loudness="1"
						class="sf-is-contained"
						:variant="saveVariant"
						:loading="saveStatus === 'saving'"
						@click="store.save()"
					>
						<SfIcon v-if="saveStatus === 'saving'" name="spinner" spin />
						<SfIcon v-else-if="saveStatus === 'error'" name="x" />
						<SfIcon v-else name="check" />
					</SfButton>
				</SfTooltip>
				<SfIconButton
					icon="settings"
					tooltip="Editor settings"
					size="2xs"
					:loudness="1"
					class="sf-is-contained"
					disabled
				/>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { nextWarned, pageWarnings } from '@/editor/extensions/pageWarnings'
import { useDragHandleStore } from '@/stores/dragHandleStore'
import { useEditorStore } from '@/stores/editorStore'
import type { Editor } from '@tiptap/vue-3'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import NodePath from './NodePath.vue'

const props = defineProps<{ editor: Editor }>()

// The bar's height while it's shown: the page frame leaves room past the end of the page for
// the last line to sit under it, and a cursor put back comes back under it (RememberCursor). It's
// there as the bar shows, as the page opens, not a frame later.
const bar = ref<HTMLElement | null>(null)
const page = document.documentElement.style
const giveHeight = (px: number) => page.setProperty('--editor-top-bar-height', `${px}px`)
const barHeight = new ResizeObserver(([entry]) => giveHeight(entry!.borderBoxSize[0]!.blockSize))
onMounted(() => {
	giveHeight(bar.value!.getBoundingClientRect().height)
	barHeight.observe(bar.value!)
})
onBeforeUnmount(() => {
	barHeight.disconnect()
	page.removeProperty('--editor-top-bar-height')
})

const store = useEditorStore()
const { page: open, isCodeView } = storeToRefs(store)
const currentName = computed(() => open.value?.name ?? null)
const saveStatus = computed(() => open.value?.saveStatus ?? 'idle')
const actionsOpen = ref(false)
// Save marks how the last save went: success once saved, danger if it failed.
const saveVariant = computed(() =>
	saveStatus.value === 'saved' ? 'success' : saveStatus.value === 'error' ? 'danger' : undefined,
)

const warningCount = computed(() => pageWarnings(props.editor.state).length)
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
	// The bar's height, not where it is: on the page's first screen it's under the site's header.
	const clear = bar.value.getBoundingClientRect().height + toolbar + 16
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
	actionsOpen.value = false
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
	/* Layout only — side padding puts the controls on the page line (sl-inset-line),
	   top/bottom from sf-depth-1 × sf-size-2xs. */
	.editor-top-bar {
		position: sticky;
		top: 0;
		z-index: var(--z-nodepath);
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
	}

	/* Name input — chrome comes from sf-is-contained + sf-loudness-1 + sf-on-hover +
	   sf-size-2xs (plus bare input:focus-visible for the editing look). Local rule only
	   carries layout: the ellipsis and rename grow animation. */
	.top-bar__name {
		flex-shrink: 0;
		max-width: 12ch;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		cursor: pointer;
		transition: max-width 0.15s;
		outline: none;
	}

	/* Renaming: name grows, NodePath shrinks away. Layout only — the visual state
	   (color, bg) is expressed by :focus-visible on the input, driven by focus/blur. */
	.editor-top-bar.is-renaming .top-bar__name {
		flex: 1;
		max-width: 100%;
		overflow: visible;
		white-space: normal;
		cursor: text;
	}
	.editor-top-bar.is-renaming .node-path {
		flex: 0;
		width: 0;
		min-width: 0;
		overflow: hidden;
		opacity: 0;
		pointer-events: none;
		transition:
			width 0.15s,
			opacity 0.1s;
	}

	.top-bar__actions {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		flex-shrink: 0;
	}

	.top-bar-actions-enter-active,
	.top-bar-actions-leave-active {
		transition:
			opacity 0.15s,
			transform 0.15s;
	}
	.top-bar-actions-enter-from,
	.top-bar-actions-leave-to {
		opacity: 0;
		transform: translateX(4px);
	}
}
</style>
