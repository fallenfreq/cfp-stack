<template>
	<div class="attr-row">
		<span class="attr-key">{{ attrKey }}</span>

		<StyleAttrEditor
			v-if="attrKey === 'style'"
			:value="(value as string) ?? ''"
			@update="(val) => emit('update', attrKey, val)"
		/>
		<select
			v-else-if="specOptions"
			class="attr-input attr-select"
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
			class="attr-input"
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
			class="attr-input"
			:value="value as string"
			@input="onTextInput(($event.target as HTMLInputElement).value)"
			@blur="onTextBlur(($event.target as HTMLInputElement).value)"
			@keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
		>

		<span v-if="isAtDefault" class="attr-default-badge">default</span>

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
.attr-row {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 2px 4px;
}

.attr-key {
	font-size: 0.75rem;
	color: rgba(var(--text_primary) / var(--alpha-70));
	min-width: 36px;
	flex-shrink: 0;
}

.attr-input {
	flex: 1;
	min-width: 0;
	height: 22px;
	padding: 1px 5px;
	border-radius: 3px;
	border: 1px solid rgb(var(--border_color));
	background: rgb(var(--bg_primary));
	color: rgb(var(--text_primary));
	font-size: 0.75rem;
	outline: none;
}

.attr-input:focus {
	border-color: rgb(var(--primary));
}

.attr-checkbox {
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	accent-color: rgb(var(--primary));
}

.attr-select {
	cursor: pointer;
}

.attr-default-badge {
	font-size: 0.65rem;
	color: rgba(var(--text_primary) / var(--alpha-40));
	flex-shrink: 0;
	white-space: nowrap;
}
</style>
