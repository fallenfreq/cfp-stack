<template>
	<div v-if="props.isVisible.value" class="prompt-modal">
		<div class="prompt-content">
			<h3 class="message text-2xl">
				{{ message }}
			</h3>
			<input ref="input" v-model="userInput" type="text" @keyup.enter="submit">
			<div class="button-group">
				<VaButton color="primary" class="submit" @click="submit"> Submit </VaButton>
				<VaButton
					color="textPrimary"
					preset="secondary"
					border-color="textPrimary"
					class="cancel"
					@click="close"
				>
					Cancel
				</VaButton>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Theme } from '@/constants/theme'
import { safeApplyPreset } from '@/utils/theme'
import { ref, watch, type Ref } from 'vue'

// refs are normally unwrapped when passed to components
// However this is loaded via createComponent which seem to pass the Ref
const props = defineProps<{
	message: Ref<string>
	isVisible: Ref<boolean>
	rootCurrentPresetName: Ref<Theme>
}>()

safeApplyPreset(props.rootCurrentPresetName.value)
watch(props.rootCurrentPresetName, () => {
	safeApplyPreset(props.rootCurrentPresetName.value)
})

const emit = defineEmits<(e: 'submit', value: string | null) => void>()

const userInput = ref('')

const input = ref<HTMLInputElement | null>(null)

const submit = () => {
	emit('submit', userInput.value)
	if (input.value) userInput.value = ''
}

const close = () => {
	emit('submit', null)
}
</script>

<style scoped>
.prompt-modal {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.prompt-content {
	background: rgb(var(--backgroundSecondary));
	padding: 20px;
	width: 100%;
	max-width: 600px;
	border-radius: 5px;
	text-align: left;
	border-radius: 20px;
	margin: 0 20px;
	max-width: 500px;
}

.prompt-content input {
	width: 100%;
	background: rgb(var(--backgroundPrimary));
	padding: 5px;
	margin: 10px 0;
	border-radius: 5px;
}

.button-group {
	display: flex;
	justify-content: flex-end;
	gap: 5px;
}
</style>
