<template>
	<div class="attr-row sl-row sl-align-y-center sf-text-xs sf-size-2xs">
		<!-- The style editor isn't a form control a label can point at. -->
		<span v-if="attrKey === 'style'" class="sf-loudness-1">{{ attrKey }}</span>
		<label v-else :for="controlId" class="sf-loudness-1">{{ attrKey }}</label>

		<!-- One cell: the control and its buttons stay together in the field column. -->
		<div class="attr-field">
			<StyleAttrEditor
				v-if="attrKey === 'style'"
				:value="(value as string) ?? ''"
				@update="(val) => emit('update', attrKey, val)"
			/>
			<select
				v-else-if="specOptions"
				:id="controlId"
				class="attr-input sf sf-field sf-size-2xs sf-on-focus"
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
				:id="controlId"
				ref="inputEl"
				type="checkbox"
				class="attr-checkbox sf"
				:checked="!!value"
				@change="emit('update', attrKey, ($event.target as HTMLInputElement).checked)"
			/>
			<input
				v-else-if="typeof specDefault === 'number'"
				:id="controlId"
				ref="inputEl"
				type="number"
				class="attr-input sf sf-field sf-size-2xs sf-on-focus"
				:value="value as number"
				@change="
					emit('update', attrKey, ($event.target as HTMLInputElement).valueAsNumber || 0)
				"
				@keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
			/>
			<input
				v-else
				:id="controlId"
				ref="inputEl"
				type="text"
				class="attr-input sf sf-field sf-size-2xs sf-on-focus"
				:value="value as string"
				@input="onTextInput(($event.target as HTMLInputElement).value)"
				@blur="onTextBlur(($event.target as HTMLInputElement).value)"
				@keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
			/>

			<span v-if="isAtDefault" class="attr-default-badge sf-loudness-1">default</span>

			<ToolbarButton :aria-label="`Remove ${attrKey}`" @click="emit('remove', attrKey)">
				<ToolbarIcon>close</ToolbarIcon>
			</ToolbarButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId } from 'vue'
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

const controlId = useId()
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
		/* Same size as the panel's add buttons, so row content lines up with their labels. */
		padding-inline: var(--sf-padding);
	}

	.attr-field {
		display: flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		min-width: 0;
	}

	.attr-input {
		flex: 1;
		min-width: 0;
	}

	.attr-checkbox {
		flex-shrink: 0;
	}

	.attr-default-badge {
		flex-shrink: 0;
		white-space: nowrap;
	}
}
</style>
