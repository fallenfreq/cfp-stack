<template>
	<div class="attr-row">
		<span class="attr-key">{{ attrKey }}</span>

		<input
			v-if="typeof specDefault === 'boolean'"
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
		<StyleAttrEditor
			v-else-if="attrKey === 'style'"
			:value="(value as string) ?? ''"
			@update="(val) => emit('update', attrKey, val)"
		/>
		<select
			v-else-if="specOptions"
			class="attr-input attr-select"
			:value="value as string"
			@change="emit('update', attrKey, ($event.target as HTMLSelectElement).value)"
		>
			<option v-for="opt in specOptions" :key="opt" :value="opt">{{ opt }}</option>
		</select>
		<input
			v-else
			ref="inputEl"
			type="text"
			class="attr-input"
			:value="value as string"
			@change="emit('update', attrKey, ($event.target as HTMLInputElement).value)"
			@keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
		>

		<ToolbarButton @mousedown.prevent="emit('remove', attrKey)">
			<ToolbarIcon>close</ToolbarIcon>
		</ToolbarButton>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StyleAttrEditor from './StyleAttrEditor.vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'

const props = defineProps<{
	attrKey: string
	value: unknown
	specDefault: unknown
	specOptions?: string[]
	pending?: boolean
}>()

const emit = defineEmits<{
	update: [key: string, value: unknown]
	remove: [key: string]
}>()

const inputEl = ref<HTMLElement | null>(null)

onMounted(() => {
	if (props.pending) inputEl.value?.focus()
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
	color: rgba(var(--textPrimary) / 0.7);
	min-width: 36px;
	flex-shrink: 0;
}

.attr-input {
	flex: 1;
	min-width: 0;
	height: 22px;
	padding: 1px 5px;
	border-radius: 3px;
	border: 1px solid rgb(var(--backgroundBorder));
	background: rgb(var(--backgroundPrimary));
	color: rgb(var(--textPrimary));
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
</style>
