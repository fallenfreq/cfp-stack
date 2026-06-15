<template>
	<div class="editor-top-bar" :class="{ 'is-renaming': renamingName }">
		<input
			ref="nameInput"
			v-model="nameInputValue"
			class="top-bar__name"
			:title="currentName ?? 'Untitled'"
			@focus="startRename"
			@blur="commitRename"
			@keyup.enter="nameInput?.blur()"
			@keyup.escape="cancelRename"
		>
		<NodePath :editor="editor" />
		<button
			class="top-bar__toggle"
			:class="{ 'is-open': actionsOpen }"
			title="Editor actions"
			@click="actionsOpen = !actionsOpen"
		>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<circle cx="2.5" cy="7" r="1.25" fill="currentColor" />
				<circle cx="7" cy="7" r="1.25" fill="currentColor" />
				<circle cx="11.5" cy="7" r="1.25" fill="currentColor" />
			</svg>
		</button>
		<Transition name="top-bar-actions">
			<div v-if="actionsOpen" class="top-bar__actions">
				<button
					class="top-bar__action"
					:class="{
						'is-saving': saveStatus === 'saving',
						'is-saved': saveStatus === 'saved',
						'is-error': saveStatus === 'error',
					}"
					:disabled="saveStatus === 'saving'"
					title="Save"
					@click="store.save()"
				>
					<svg
						v-if="saveStatus === 'saving'"
						class="spin"
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
					>
						<circle
							cx="7"
							cy="7"
							r="5.5"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-dasharray="8 26"
							stroke-linecap="round"
						/>
					</svg>
					<svg
						v-else-if="saveStatus === 'error'"
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
					>
						<path
							d="M3 3l8 8M11 3l-8 8"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
					<svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path
							d="M2.5 7.5l3 3 6-6"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
				<button class="top-bar__action" title="Editor settings" disabled>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.5" />
						<path
							d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
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
.editor-top-bar {
	position: sticky;
	top: 0;
	z-index: var(--z-nodepath);
	display: flex;
	align-items: center;
	padding: 4px 1.75rem;
	gap: 4px;
	background: rgb(var(--bg_secondary));
	border-bottom: 1px solid rgb(var(--border_color));
	font-size: 0.75rem;
}

/* ── Name input — looks like a breadcrumb node when idle ── */
.top-bar__name {
	flex-shrink: 0;
	max-width: 12ch;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	background: none;
	border: 1px solid transparent;
	border-radius: 3px;
	padding: 1px 5px;
	cursor: pointer;
	color: rgba(var(--text_primary) / var(--alpha-60));
	font-size: 0.75rem;
	transition:
		max-width 0.15s,
		color 0.1s,
		border-color 0.1s,
		background 0.1s;
	outline: none;
}
.top-bar__name:hover {
	color: rgb(var(--text_primary));
	border-color: rgba(var(--text_primary) / var(--alpha-20));
}

/* ── Renaming: name grows, NodePath shrinks away ── */
.editor-top-bar.is-renaming .top-bar__name {
	flex: 1;
	max-width: 100%;
	overflow: visible;
	white-space: normal;
	cursor: text;
	color: rgb(var(--text_primary));
	background: rgba(var(--text_primary) / var(--alpha-10));
	border-color: rgba(var(--text_primary) / var(--alpha-20));
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

/* ── Toggle ── */
.top-bar__toggle {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background: none;
	border: 1px solid transparent;
	border-radius: 3px;
	cursor: pointer;
	color: rgba(var(--text_primary) / var(--alpha-40));
	transition:
		color 0.1s,
		background 0.1s,
		border-color 0.1s;
}
.top-bar__toggle:hover,
.top-bar__toggle.is-open {
	color: rgb(var(--text_primary));
	background: rgba(var(--text_primary) / var(--alpha-10));
	border-color: rgba(var(--text_primary) / var(--alpha-20));
}

/* ── Actions panel ── */
.top-bar__actions {
	display: flex;
	align-items: center;
	gap: 2px;
	flex-shrink: 0;
}

.top-bar__action {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background: none;
	border: 1px solid transparent;
	border-radius: 3px;
	cursor: pointer;
	color: rgba(var(--text_primary) / var(--alpha-60));
	transition:
		color 0.1s,
		background 0.1s,
		border-color 0.1s;
}
.top-bar__action:hover:not(:disabled) {
	color: rgb(var(--text_primary));
	background: rgba(var(--text_primary) / var(--alpha-10));
	border-color: rgba(var(--text_primary) / var(--alpha-20));
}
.top-bar__action:disabled {
	opacity: 0.3;
	cursor: default;
}
.top-bar__action.is-saved {
	color: rgb(var(--success, 34 197 94));
}
.top-bar__action.is-error {
	color: rgb(var(--danger, 239 68 68));
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
.spin {
	animation: spin 0.8s linear infinite;
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
</style>
