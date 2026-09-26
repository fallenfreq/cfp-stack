<template>
	<div v-if="props.isVisible.value" class="prompt-modal sf-scrim sl-cover">
		<div
			class="prompt-content sf-depth-3 sl-stack sf-gap-sm"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="labelId"
			@keydown.esc="close"
		>
			<!-- The message is the question the field answers, so it labels the field. -->
			<label :id="labelId" :for="inputId" class="sf-heading-2">
				{{ message }}
			</label>
			<input
				:id="inputId"
				ref="input"
				v-model="userInput"
				type="text"
				class="sf sf-field sf-on-focus"
				:autocapitalize="props.transform?.value ? 'none' : undefined"
				:autocorrect="props.transform?.value ? 'off' : undefined"
				@keyup.enter="submit"
			>
			<div class="button-group sl-cluster sf-gap-xs">
				<button
					type="button"
					class="sf sf-loudness-3 sf-variant-primary sf-on-hover"
					@click="submit"
				>
					Submit
				</button>
				<button type="button" class="sf sf-loudness-2 sf-on-hover" @click="close">
					Cancel
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch, type Ref } from 'vue'

// refs are normally unwrapped when passed to components
// However this is loaded via createComponent which seem to pass the Ref
const props = defineProps<{
	message: Ref<string>
	isVisible: Ref<boolean>
	transform: Ref<((v: string) => string) | undefined>
}>()

const emit = defineEmits<(e: 'submit', value: string | null) => void>()

const labelId = useId()
const inputId = useId()

const rawInput = ref('')
const userInput = computed({
	get: () => rawInput.value,
	set: (value) => {
		rawInput.value = props.transform?.value ? props.transform.value(value) : value
	},
})

const input = ref<HTMLInputElement | null>(null)

// Focus moves to the field on open and back to where it was on close.
let returnFocusTo: HTMLElement | null = null

watch(
	() => props.isVisible.value,
	(visible) => {
		if (visible) {
			const active = document.activeElement
			returnFocusTo =
				active instanceof HTMLElement && active !== document.body ? active : null
			rawInput.value = ''
			nextTick(() => input.value?.focus())
			return
		}
		if (returnFocusTo?.isConnected) returnFocusTo.focus()
		returnFocusTo = null
	},
)

const submit = () => {
	emit('submit', rawInput.value)
	rawInput.value = ''
}

const close = () => {
	emit('submit', null)
	rawInput.value = ''
}
</script>

<style scoped>
@layer ui {
	/* Covers the screen above everything; sf-scrim draws it, sl-cover centres the dialog.
	   The page margin keeps the dialog off the screen edges on phones. */
	.prompt-modal {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		padding-inline: var(--sf-spacing_page);
	}

	/* sl-cover centres its child at its content width; the dialog fills up to its cap. */
	.prompt-content {
		width: 100%;
		max-width: 32rem;
	}

	/* Flex rows right-align with justify-content (sl-align-x-* is grid-only). */
	.button-group {
		justify-content: end;
	}
}
</style>
