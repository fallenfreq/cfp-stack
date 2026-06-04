<template>
	<div ref="buttonEl" class="toolbar-attr-editor">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>tune</ToolbarIcon>
		</ToolbarButton>
		<ToolbarPanel :open="open" :anchor-el="buttonEl" align="right" @close="onClose">
			<div class="attr-content">
				<ToolbarAttrRow
					v-for="[key, value] in Object.entries(nonDefaultAttrs)"
					:key="key"
					:attr-key="key"
					:value="value"
					:spec-default="specAttrs[key]?.default ?? null"
					v-bind="propOptions[key] ? { specOptions: propOptions[key] } : {}"
					@update="onUpdate"
					@remove="onRemove"
				/>

				<ToolbarAttrRow
					v-if="pendingKey"
					:attr-key="pendingKey"
					:value="''"
					:spec-default="specAttrs[pendingKey]?.default ?? null"
					v-bind="propOptions[pendingKey] ? { specOptions: propOptions[pendingKey] } : {}"
					:pending="true"
					@update="onPendingUpdate"
					@remove="pendingKey = null"
				/>

				<div
					v-if="
						!Object.keys(nonDefaultAttrs).length && !pendingKey && !addableKeys.length
					"
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
		</ToolbarPanel>
	</div>
</template>

<script setup lang="ts">
import type { EnumExtensionAttribute } from '@/editor/enumAttr'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { filterNonDefaultAttrs, nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { computed, ref, watch } from 'vue'
import ToolbarAttrRow from './ToolbarAttrRow.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'
import ToolbarPanel from './ToolbarPanel.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext }>()

const open = ref(false)
const buttonEl = ref<HTMLElement | null>(null)
const pendingKey = ref<string | null>(null)
const capturedPos = ref<NodePos | null>(null)

const capturedNode = computed(() => {
	if (capturedPos.value === null) return props.context.activeNode
	return nodeAt(props.editor.state.doc, capturedPos.value)
})

const specAttrs = computed(
	() => capturedNode.value.type.spec.attrs as Record<string, { default?: unknown }>,
)

const propOptions = computed(() => {
	const nodeName = capturedNode.value.type.name
	const attrs = props.editor.extensionManager.attributes as EnumExtensionAttribute[]
	return Object.fromEntries(
		attrs
			.filter((entry) => entry.type === nodeName && entry.attribute.options?.length)
			.map((entry) => [entry.name, entry.attribute.options!]),
	)
})

const nonDefaultAttrs = computed(() =>
	filterNonDefaultAttrs(capturedNode.value.attrs, specAttrs.value),
)

const addableKeys = computed(() =>
	Object.keys(specAttrs.value).filter(
		(k) => !(k in nonDefaultAttrs.value) && k !== pendingKey.value,
	),
)

const dispatch = (newAttrs: Record<string, unknown>) => {
	if (capturedPos.value === null) return
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, newAttrs),
	)
}

const onUpdate = (key: string, value: unknown) => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	dispatch({ ...node.attrs, [key]: value })
}

const onRemove = (key: string) => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const def = node.type.spec.attrs?.[key]?.default ?? null
	dispatch({ ...node.attrs, [key]: def })
}

const onPendingUpdate = (key: string, value: unknown) => {
	if (value !== '' && value !== null) onUpdate(key, value)
	pendingKey.value = null
}

const startAdd = (key: string) => {
	pendingKey.value = key
}

const toggle = () => {
	if (!open.value) {
		capturedPos.value = props.context.nodePos
	} else {
		capturedPos.value = null
	}
	open.value = !open.value
}

const onClose = () => {
	open.value = false
	capturedPos.value = null
}

watch(
	() => props.context.nodePos,
	(nodePos) => {
		if (!open.value || capturedPos.value === null) return
		if (nodePos !== capturedPos.value) {
			open.value = false
			capturedPos.value = null
		}
	},
)
</script>

<style scoped>
.toolbar-attr-editor {
	position: relative;
}

.attr-content {
	min-width: 300px;
	max-width: calc(100vw - 8px);
	max-height: 400px;
	overflow-y: auto;
	scrollbar-width: none;
}

.attr-content::-webkit-scrollbar {
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
