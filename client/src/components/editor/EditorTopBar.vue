<template>
	<div
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
		>
		<NodePath :editor="editor" />
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
import { useEditorStore } from '@/stores/editorStore'
import type { Editor } from '@tiptap/vue-3'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import NodePath from './NodePath.vue'

defineProps<{ editor: Editor }>()

const store = useEditorStore()
const { saveStatus, currentName } = storeToRefs(store)
const actionsOpen = ref(false)
// Save shows green once saved and red if it failed.
const saveVariant = computed(() =>
	saveStatus.value === 'saved' ? 'success' : saveStatus.value === 'error' ? 'danger' : undefined,
)
const renamingName = ref(false)
const nameInputValue = ref(currentName.value ?? 'Untitled')
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

const commitRename = async () => {
	renamingName.value = false
	const trimmed = nameInputValue.value.trim()
	if (trimmed && trimmed !== currentName.value) {
		await store.renamePage(trimmed)
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
