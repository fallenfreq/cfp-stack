<template>
	<ToolbarPanelItem
		icon="tune"
		:tooltip="tooltip"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<div class="attr-content sl-stack sf-gap-2xs sf-size-2xs">
			<!-- Rows share one name column and one field column; when narrow, names go above. -->
			<div v-if="allRowCount" class="sl-split sl-collapse-xs sf-gap-xs">
				<ToolbarAttrRow
					v-for="row in classTokenRows"
					:key="row.key"
					:attr-key="row.key"
					:value="row.value"
					:spec-default="null"
					:spec-options="row.options"
					:is-at-default="false"
					:pending="justAddedKey === row.key"
					@update="onUpdate"
					@remove="onRemove"
				/>
				<ToolbarAttrRow
					v-for="row in attrRows"
					:key="row.key"
					:attr-key="row.key"
					:value="row.value"
					:spec-default="specAttrs[row.key]?.default ?? null"
					:spec-options="propOptions[row.key]"
					:is-at-default="row.isAtDefault"
					:pending="justAddedKey === row.key"
					@update="onUpdate"
					@remove="onRemove"
				/>
			</div>

			<div v-if="!allRowCount && !allAddableCount" class="attr-empty sf-loudness-1">
				No attributes set
			</div>

			<template v-if="allAddableCount">
				<hr v-if="allRowCount" class="sf">
				<SfButton
					v-for="key in classAddableKeys"
					:key="key"
					class="attr-add-btn sf-is-contained"
					size="2xs"
					:loudness="1"
					@mousedown.prevent
					@click="startAdd(key)"
				>
					<span class="material-symbols-rounded sf-icon">add</span>
					{{ key }}
				</SfButton>
				<SfButton
					v-for="key in addableKeys"
					:key="key"
					class="attr-add-btn sf-is-contained"
					size="2xs"
					:loudness="1"
					@mousedown.prevent
					@click="startAdd(key)"
				>
					<span class="material-symbols-rounded sf-icon">add</span>
					{{ key }}
				</SfButton>
			</template>
		</div>
	</ToolbarPanelItem>
</template>

<script setup lang="ts">
import { useNodeClassTokens } from '@/config/editor/nodeClassTokens'
import type { EnumExtensionAttribute } from '@/editor/enumAttr'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { getClassToken, setClassToken } from '@/utils/editor/classTokens'
import { filterNonDefaultAttrs, nodeAt, type NodePos } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { computed, nextTick, ref, watch } from 'vue'
import ToolbarAttrRow from './ToolbarAttrRow.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const open = ref(false)
const capturedPos = ref<NodePos | null>(null)
const explicitlyAdded = ref(new Set<string>())
const justAddedKey = ref<string | null>(null)

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

const attrRows = computed(() =>
	Object.keys(specAttrs.value)
		.filter((k) => k in nonDefaultAttrs.value || explicitlyAdded.value.has(k))
		.sort()
		.map((k) => {
			const specDefault = specAttrs.value[k]?.default ?? null
			const value = capturedNode.value.attrs[k] ?? specDefault
			return { key: k, value, isAtDefault: value === specDefault }
		}),
)

const addableKeys = computed(() =>
	Object.keys(specAttrs.value)
		.filter((k) => !(k in nonDefaultAttrs.value) && !explicitlyAdded.value.has(k))
		.sort(),
)

const { specs: nodeClassTokens } = useNodeClassTokens()
const classTokenSpecs = computed(() => nodeClassTokens.value[capturedNode.value.type.name] ?? [])

const currentClass = computed(() =>
	typeof capturedNode.value.attrs.class === 'string' ? capturedNode.value.attrs.class : '',
)

const classTokenRows = computed(() =>
	classTokenSpecs.value
		.map((spec) => ({
			key: spec.key,
			prefix: spec.prefix,
			value: getClassToken(currentClass.value, spec.prefix),
			options: spec.options,
		}))
		.filter((r) => r.value !== null || explicitlyAdded.value.has(r.key)),
)

const classAddableKeys = computed(() =>
	classTokenSpecs.value
		.filter(
			(spec) =>
				getClassToken(currentClass.value, spec.prefix) === null
				&& !explicitlyAdded.value.has(spec.key),
		)
		.map((spec) => spec.key),
)

const allRowCount = computed(() => attrRows.value.length + classTokenRows.value.length)
const allAddableCount = computed(() => addableKeys.value.length + classAddableKeys.value.length)

const dispatch = (newAttrs: Record<string, unknown>) => {
	if (capturedPos.value === null) return
	props.editor.view.dispatch(
		props.editor.state.tr.setNodeMarkup(capturedPos.value, null, newAttrs),
	)
}

const dispatchClass = (newClass: string) => {
	if (capturedPos.value === null) return
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	dispatch({ ...node.attrs, class: newClass || null })
}

const onUpdate = (key: string, value: unknown) => {
	if (capturedPos.value === null) return
	const spec = classTokenSpecs.value.find((s) => s.key === key)
	if (spec) {
		dispatchClass(setClassToken(currentClass.value, spec.prefix, value as string))
		return
	}
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	dispatch({ ...node.attrs, [key]: value })
}

const onRemove = (key: string) => {
	explicitlyAdded.value = new Set([...explicitlyAdded.value].filter((k) => k !== key))
	if (capturedPos.value === null) return
	const spec = classTokenSpecs.value.find((s) => s.key === key)
	if (spec) {
		dispatchClass(setClassToken(currentClass.value, spec.prefix, null))
		return
	}
	const node = nodeAt(props.editor.state.doc, capturedPos.value)
	const specDefault = node.type.spec.attrs?.[key]?.default ?? null
	dispatch({ ...node.attrs, [key]: specDefault })
}

const startAdd = (key: string) => {
	explicitlyAdded.value = new Set([...explicitlyAdded.value, key])
	justAddedKey.value = key
	const spec = classTokenSpecs.value.find((s) => s.key === key)
	if (spec && spec.options.length > 0) {
		// Commit the first option immediately so the select has a valid value.
		dispatchClass(setClassToken(currentClass.value, spec.prefix, spec.options[0] as string))
	}
	// Regular attrs are already at their default in the node — no dispatch needed.
	nextTick(() => {
		justAddedKey.value = null
	})
}

const resetPanelState = () => {
	capturedPos.value = null
	explicitlyAdded.value = new Set()
	justAddedKey.value = null
}

// The panel reports opening and closing; opening remembers which node it's for.
const setOpen = (value: boolean) => {
	if (value === open.value) return
	if (!value) {
		onClose()
		return
	}
	capturedPos.value = props.context.nodePos
	open.value = true
}

const onClose = () => {
	open.value = false
	nextTick(() => resetPanelState())
}

watch(
	() => props.context.nodePos,
	(nodePos) => {
		if (!open.value || capturedPos.value === null) return
		if (nodePos !== capturedPos.value) onClose()
	},
)
</script>

<style scoped>
@layer ui {
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

	/* Full-width rows, contents on the left; long names wrap. */
	.attr-add-btn {
		display: flex;
		width: 100%;
		justify-content: start;
		white-space: normal;
	}

	.attr-empty {
		padding: var(--sf-padding);
		text-align: center;
	}
}
</style>
