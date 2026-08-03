<template>
	<div class="attr-row sf-text-xs">
		<span class="attr-key sf-loudness-1">{{ attrKey }}</span>

		<StyleAttrEditor
			v-if="attrKey === 'style'"
			:value="(value as string) ?? ''"
			@update="(val) => emit('update', attrKey, val)"
		/>
		<select
			v-else-if="specOptions"
			class="attr-input attr-select sf-on-focus"
			:value="String(specOptions.indexOf(value))"
			@change="
				emit(
					'update',
					attrKey,
					specOptions[Number(($event.target as HTMLSelectElement).value)],
				)
			"
		>
			<option v-for="(opt, i) in specOptions" :key="String(opt)" :value="String(i)">
				{{ opt }}{{ specOptions[i] === specDefault ? ' (default)' : '' }}
			</option>
		</select>
		<input
			v-else-if="typeof specDefault === 'boolean'"
			ref="inputEl"
			type="checkbox"
			class="attr-checkbox"
			:checked="!!value"
			@change="emit('update', attrKey, ($event.target as HTMLInputElement).checked)"
		>
		<input
			v-else-if="typeof specDefault === 'number'"
			ref="inputEl"
			type="number"
			class="attr-input sf sf-boundary sf-size-2xs sf-on-focus"
			:value="value as number"
			@change="
				emit('update', attrKey, ($event.target as HTMLInputElement).valueAsNumber || 0)
			"
			@keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
		>
		<input
			v-else
			ref="inputEl"
			type="text"
			class="attr-input sf sf-boundary sf-size-2xs sf-on-focus"
			:value="value as string"
			@input="onTextInput(($event.target as HTMLInputElement).value)"
			@blur="onTextBlur(($event.target as HTMLInputElement).value)"
			@keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
		>

		<span v-if="isAtDefault" class="attr-default-badge sf-loudness-1">default</span>

		<ToolbarButton @mousedown.prevent="emit('remove', attrKey)">
			<ToolbarIcon>close</ToolbarIcon>
		</ToolbarButton>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import StyleAttrEditor from './StyleAttrEditor.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'

const props = defineProps<{
	attrKey: string
	value: unknown
	specDefault: unknown
	specOptions?: readonly unknown[] | undefined
	isAtDefault?: boolean
	pending?: boolean
}>()

const emit = defineEmits<{
	update: [key: string, value: unknown]
	remove: [key: string]
}>()

const inputEl = ref<HTMLElement | null>(null)
let textDebounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingTextVal: string | null = null

const onTextInput = (val: string) => {
	pendingTextVal = val
	if (textDebounceTimer !== null) clearTimeout(textDebounceTimer)
	textDebounceTimer = setTimeout(() => {
		textDebounceTimer = null
		pendingTextVal = null
		emit('update', props.attrKey, val)
	}, 600)
}

const onTextBlur = (val: string) => {
	if (textDebounceTimer === null) return
	clearTimeout(textDebounceTimer)
	textDebounceTimer = null
	pendingTextVal = null
	emit('update', props.attrKey, val)
}

onMounted(() => {
	if (props.pending) inputEl.value?.focus()
})

onUnmounted(() => {
	if (textDebounceTimer !== null) {
		clearTimeout(textDebounceTimer)
		textDebounceTimer = null
		if (pendingTextVal !== null) emit('update', props.attrKey, pendingTextVal)
		pendingTextVal = null
	}
})
</script>

<style scoped>
@layer ui {
	.attr-row {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		padding: 2px 4px;
	}

	.attr-key {
		min-width: 36px;
		flex-shrink: 0;
	}

	.attr-input {
		flex: 1;
		min-width: 0;
	}

	/* select.sf baseline TODO — native select needs appearance:none + custom arrow
	   for cross-browser sf treatment. Keeping raw appearance here until that lands. */
	.attr-select {
		cursor: pointer;
		height: 22px;
		padding: 1px 5px;
		border-radius: 3px;
		border: 1px solid rgb(var(--sf-border_color));
		background: rgb(var(--sf-surface-0));
		color: rgb(var(--sf-fg_primary));
		outline: none;
	}

	.attr-checkbox {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		accent-color: rgb(var(--sf-primary));
	}

	.attr-default-badge {
		flex-shrink: 0;
		white-space: nowrap;
	}
}
</style>
