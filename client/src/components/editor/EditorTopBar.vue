<template>
	<div
		class="editor-top-bar sf-depth-1 sf-size-2xs sf-is-sticky sf-is-edge-left sf-is-edge-right sf-text-xs"
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
		<button
			class="top-bar__toggle sf sf-is-contained sf-loudness-1 sf-on-hover sf-size-2xs"
			:class="{ 'sf-on-current': actionsOpen }"
			title="Editor actions"
			@click="actionsOpen = !actionsOpen"
		>
			<SfIcon name="three-dot" />
		</button>
		<Transition name="top-bar-actions">
			<div v-if="actionsOpen" class="top-bar__actions">
				<button
					class="top-bar__action sf sf-is-contained sf-loudness-1 sf-on-hover sf-on-disabled sf-size-2xs"
					:class="{
						'is-saving': saveStatus === 'saving',
						'is-saved': saveStatus === 'saved',
						'is-error': saveStatus === 'error',
					}"
					:disabled="saveStatus === 'saving'"
					title="Save"
					@click="store.save()"
				>
					<SfIcon v-if="saveStatus === 'saving'" name="spinner" spin />
					<SfIcon v-else-if="saveStatus === 'error'" name="x" />
					<SfIcon v-else name="check" />
				</button>
				<button
					class="top-bar__action sf sf-is-contained sf-loudness-1 sf-on-hover sf-on-disabled sf-size-2xs"
					title="Editor settings"
					disabled
				>
					<SfIcon name="settings" />
				</button>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editorStore'
import type { Editor } from '@tiptap/vue-3'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import NodePath from './NodePath.vue'

defineProps<{ editor: Editor }>()

const store = useEditorStore()
const { saveStatus, currentName } = storeToRefs(store)
const actionsOpen = ref(false)
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
	/* Layout only — horizontal padding from sf-is-edge-left/right, vertical from
	   sf-depth-1 × sf-size-2xs bridge. */
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

	/* Toggle + action buttons — sf-size-2xs feeds bare button rule's padding. */
	.top-bar__toggle,
	.top-bar__action {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.top-bar__actions {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		flex-shrink: 0;
	}

	.top-bar__action.is-saved {
		color: rgb(var(--success, 34 197 94));
	}
	.top-bar__action.is-error {
		color: rgb(var(--danger, 239 68 68));
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
