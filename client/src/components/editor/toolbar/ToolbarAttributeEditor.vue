<template>
	<ToolbarPanelItem
		icon="tune"
		:tooltip="buttonName"
		:variant="warningVariant"
		:open="open"
		align="end"
		@update:open="setOpen"
	>
		<div class="attr-content sl-stack sf-gap-2xs">
			<!-- The block's warnings, above the rows where most are fixed. -->
			<template v-if="warnings.length">
				<!-- Two can read the same (a unit used twice in a style): only text, keyed by place. -->
				<p
					v-for="(warning, i) in warnings"
					:key="i"
					class="attr-note sf-text-xs sf-size-2xs"
				>
					<span class="material-symbols-rounded sf-icon">{{
						warning.type === 'problem' ? 'warning' : 'lightbulb'
					}}</span>
					{{ warning.message }}
					<span class="sf-loudness-1">({{ warning.rule }})</span>
				</p>
				<!-- A warning may name a class the block wears by itself, which no row shows. -->
				<p v-if="ownClasses.length" class="attr-note sf-loudness-1 sf-text-xs sf-size-2xs">
					Comes with this block: {{ ownClasses.join(' ') }}
				</p>
				<hr class="sf" />
			</template>
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

			<div
				v-if="!allRowCount && !allAddableCount"
				class="attr-empty sf-loudness-1 sf-size-2xs"
			>
				No attributes set
			</div>

			<template v-if="allAddableCount">
				<hr v-if="allRowCount" class="sf" />
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
import { useToolbarNodeControl } from '@/composables/editor/useToolbarNodeControl'
import { useNodeClassTokens } from '@/config/editor/nodeClassTokens'
import type { EnumExtensionAttribute } from '@/editor/enumAttr'
import type { ToolbarItemContext } from '@/editor/extensions/floatingToolbar/types'
import { blockWearsIn, warningsOn, warningVariantOf } from '@/editor/extensions/pageWarnings'
import { getClassToken } from '@/utils/editor/classTokens'
import { filterNonDefaultAttrs } from '@/utils/editor/editorUtils'
import type { Editor } from '@tiptap/vue-3'
import { computed, nextTick, ref, watch } from 'vue'
import ToolbarAttrRow from './ToolbarAttrRow.vue'
import ToolbarPanelItem from './ToolbarPanelItem.vue'

const props = defineProps<{ editor: Editor; context: ToolbarItemContext; tooltip: string }>()

const { open, setOpen, blockPos, block, blockClass, updateBlockAttributes, updateBlockLook } =
	useToolbarNodeControl(props)
const explicitlyAdded = ref(new Set<string>())
const justAddedKey = ref<string | null>(null)

// Rows added but not filled in go whenever the panel closes, the toolbar moving on too.
watch(open, (isOpen) => {
	if (isOpen) return
	explicitlyAdded.value = new Set()
	justAddedKey.value = null
})

const warnings = computed(() =>
	blockPos.value === null ? [] : warningsOn(props.editor.state, blockPos.value),
)
const warningVariant = computed(() => warningVariantOf(warnings.value))
const ownClasses = computed(() =>
	blockPos.value === null ? [] : blockWearsIn(props.editor)(block.value, blockPos.value),
)
const buttonName = computed(() => {
	const count = warnings.value.length
	if (!count) return props.tooltip
	return `${props.tooltip}: ${count} ${count === 1 ? 'warning' : 'warnings'}`
})

const specAttrs = computed(
	() => block.value.type.spec.attrs as Record<string, { default?: unknown }>,
)

const propOptions = computed(() => {
	const nodeName = block.value.type.name
	const attrs = props.editor.extensionManager.attributes as EnumExtensionAttribute[]
	return Object.fromEntries(
		attrs
			.filter((entry) => entry.type === nodeName && entry.attribute.options?.length)
			.map((entry) => [entry.name, entry.attribute.options!]),
	)
})

const nonDefaultAttrs = computed(() => filterNonDefaultAttrs(block.value.attrs, specAttrs.value))

const attrRows = computed(() =>
	Object.keys(specAttrs.value)
		.filter((k) => k in nonDefaultAttrs.value || explicitlyAdded.value.has(k))
		.sort()
		.map((k) => {
			const specDefault = specAttrs.value[k]?.default ?? null
			const value = block.value.attrs[k] ?? specDefault
			return { key: k, value, isAtDefault: value === specDefault }
		}),
)

const addableKeys = computed(() =>
	Object.keys(specAttrs.value)
		.filter((k) => !(k in nonDefaultAttrs.value) && !explicitlyAdded.value.has(k))
		.sort(),
)

const { specs: nodeClassTokens } = useNodeClassTokens()
const classTokenSpecs = computed(() => nodeClassTokens.value[block.value.type.name] ?? [])

const classTokenRows = computed(() =>
	classTokenSpecs.value
		.map((spec) => ({
			key: spec.key,
			prefix: spec.prefix,
			value: getClassToken(blockClass.value, spec.prefix),
			options: spec.options,
		}))
		.filter((r) => r.value !== null || explicitlyAdded.value.has(r.key)),
)

const classAddableKeys = computed(() =>
	classTokenSpecs.value
		.filter(
			(spec) =>
				getClassToken(blockClass.value, spec.prefix) === null
				&& !explicitlyAdded.value.has(spec.key),
		)
		.map((spec) => spec.key),
)

const allRowCount = computed(() => attrRows.value.length + classTokenRows.value.length)
const allAddableCount = computed(() => addableKeys.value.length + classAddableKeys.value.length)

const setClassRow = (prefix: string, value: string | null) =>
	updateBlockLook({
		replacing: (name) => name.startsWith(prefix),
		classes: value === null ? [] : [prefix + value],
	})

const onUpdate = (key: string, value: unknown) => {
	const spec = classTokenSpecs.value.find((s) => s.key === key)
	if (spec) {
		setClassRow(spec.prefix, value as string)
		return
	}
	updateBlockAttributes({ [key]: value })
}

const onRemove = (key: string) => {
	explicitlyAdded.value = new Set([...explicitlyAdded.value].filter((k) => k !== key))
	const spec = classTokenSpecs.value.find((s) => s.key === key)
	if (spec) {
		setClassRow(spec.prefix, null)
		return
	}
	updateBlockAttributes({ [key]: block.value.type.spec.attrs?.[key]?.default ?? null })
}

const startAdd = (key: string) => {
	explicitlyAdded.value = new Set([...explicitlyAdded.value, key])
	justAddedKey.value = key
	const spec = classTokenSpecs.value.find((s) => s.key === key)
	if (spec && spec.options.length > 0) {
		// Commit the first option immediately so the select has a valid value.
		setClassRow(spec.prefix, spec.options[0] as string)
	}
	// Regular attrs are already at their default in the node — no dispatch needed.
	nextTick(() => {
		justAddedKey.value = null
	})
}
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

	/* The stack makes rows full width; contents sit on the left and long names wrap. */
	.attr-add-btn {
		justify-content: start;
		white-space: normal;
	}

	.attr-empty {
		padding: var(--sf-padding);
		text-align: center;
	}

	/* On the rows' line: the same padding as theirs. */
	.attr-note {
		padding-inline: var(--sf-padding);
	}
}
</style>
