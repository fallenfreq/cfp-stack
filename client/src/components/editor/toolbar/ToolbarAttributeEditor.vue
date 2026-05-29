<template>
	<div ref="buttonEl" class="toolbar-attr-editor">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>tune</ToolbarIcon>
		</ToolbarButton>
		<div v-if="open" class="attr-panel" :style="panelStyle" @mousedown.stop>
			<ToolbarAttrRow
				v-for="[key, value] in Object.entries(nonDefaultAttrs)"
				:key="key"
				:attr-key="key"
				:value="value"
				:spec-default="specAttrs[key]?.default ?? null"
				@update="onUpdate"
				@remove="onRemove"
			/>

			<ToolbarAttrRow
				v-if="pendingKey"
				:attr-key="pendingKey"
				:value="''"
				:spec-default="specAttrs[pendingKey]?.default ?? null"
				:pending="true"
				@update="onPendingUpdate"
				@remove="pendingKey = null"
			/>

			<div
				v-if="!Object.keys(nonDefaultAttrs).length && !pendingKey && !addableKeys.length"
				class="attr-empty"
			>
				No attributes set
			</div>

			<template v-if="addableKeys.length && !pendingKey">
				<div v-if="Object.keys(nonDefaultAttrs).length" class="attr-divider" />
				<button
					v-for="key in addableKeys"
					:key="key"
					class="attr-add-btn"
					@mousedown.prevent="startAdd(key)"
				>
					<span class="material-symbols-rounded">add</span>
					{{ key }}
				</button>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { filterNonDefaultAttrs } from '@/utils/editor/editorUtils'
import { NodeSelection } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/vue-3'
import { computed, onUnmounted, ref, watch, type CSSProperties } from 'vue'
import ToolbarAttrRow from './ToolbarAttrRow.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const open = ref(false)
const buttonEl = ref<HTMLElement | null>(null)
const pendingKey = ref<string | null>(null)
const panelStyle = ref<CSSProperties>({})

const specAttrs = computed(
	() => props.context.activeNode.type.spec.attrs as Record<string, { default?: unknown }>,
)

const nonDefaultAttrs = computed(() =>
	filterNonDefaultAttrs(props.context.activeNode.attrs, specAttrs.value),
)

const addableKeys = computed(() =>
	Object.keys(specAttrs.value).filter(
		(k) => !(k in nonDefaultAttrs.value) && k !== pendingKey.value,
	),
)

const resolveNodePos = (): number | null => {
	const { selection } = props.editor.state
	const depth = props.context.activeDepth
	if (depth === 0) return null
	if (selection instanceof NodeSelection) return selection.from
	const $pos = props.editor.state.doc.resolve(selection.anchor)
	const resolvedDepth = Math.min(depth, $pos.depth)
	return resolvedDepth > 0 ? $pos.before(resolvedDepth) : null
}

const dispatch = (newAttrs: Record<string, unknown>) => {
	const nodePos = resolveNodePos()
	if (nodePos === null) return
	props.editor.view.dispatch(props.editor.state.tr.setNodeMarkup(nodePos, null, newAttrs))
}

const onUpdate = (key: string, value: unknown) => {
	dispatch({ ...props.context.activeNode.attrs, [key]: value })
}

const onRemove = (key: string) => {
	const def = props.context.activeNode.type.spec.attrs[key]?.default ?? null
	dispatch({ ...props.context.activeNode.attrs, [key]: def })
}

const onPendingUpdate = (key: string, value: unknown) => {
	if (value !== '' && value !== null) onUpdate(key, value)
	pendingKey.value = null
}

const startAdd = (key: string) => {
	pendingKey.value = key
}

const toggle = () => {
	if (!open.value && buttonEl.value) {
		const rect = buttonEl.value.getBoundingClientRect()
		const PANEL_WIDTH = 220
		const MARGIN = 4
		// Right-align to button by default, but clamp so it never leaves the viewport.
		// Convert the clamped viewport-absolute x back to a parent-relative left offset.
		const viewportLeft = rect.right - PANEL_WIDTH
		const clamped = Math.max(
			MARGIN,
			Math.min(viewportLeft, window.innerWidth - PANEL_WIDTH - MARGIN),
		)
		panelStyle.value = { left: `${clamped - rect.left}px` }
	}
	open.value = !open.value
}

const onDocMousedown = (e: MouseEvent) => {
	// @mousedown.stop on the panel means anything reaching here is outside it.
	if (!buttonEl.value?.contains(e.target as Node)) open.value = false
}

watch(open, (isOpen) => {
	if (isOpen) document.addEventListener('mousedown', onDocMousedown)
	else document.removeEventListener('mousedown', onDocMousedown)
})

onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown))
</script>

<style scoped>
.toolbar-attr-editor {
	position: relative;
}

.attr-panel {
	position: absolute;
	top: calc(100% + 4px);
	z-index: 1001;
	background: rgb(var(--backgroundSecondary));
	border: 1px solid rgb(var(--backgroundBorder));
	border-radius: 4px;
	padding: 4px;
	min-width: 220px;
	max-width: calc(100vw - 8px);
	max-height: 300px;
	overflow-y: auto;
	scrollbar-width: none;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.attr-panel::-webkit-scrollbar {
	display: none;
}

.attr-divider {
	height: 1px;
	background: rgb(var(--backgroundBorder));
	margin: 4px 0;
}

.attr-add-btn {
	display: flex;
	align-items: center;
	gap: 4px;
	width: 100%;
	padding: 4px 6px;
	border-radius: 3px;
	border: none;
	background: none;
	color: rgba(var(--textPrimary) / 0.6);
	font-size: 0.8rem;
	cursor: pointer;
	text-align: left;
}

.attr-add-btn:hover {
	background: rgba(var(--textPrimary) / 0.06);
	color: rgb(var(--textPrimary));
}

.attr-add-btn .material-symbols-rounded {
	font-size: 14px;
}

.attr-empty {
	padding: 6px 8px;
	font-size: 0.8rem;
	color: rgba(var(--textPrimary) / 0.4);
	text-align: center;
}
</style>
