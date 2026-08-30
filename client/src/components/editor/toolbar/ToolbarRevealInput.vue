<template>
	<div class="toolbar-reveal">
		<ToolbarButton @click="toggle">
			<ToolbarIcon>{{ iconName }}</ToolbarIcon>
		</ToolbarButton>
		<template v-if="revealed">
			<input
				ref="inputEl"
				v-model="localUrl"
				type="url"
				class="toolbar-url-input sf sf-field sf-size-xs sf-text-xs sf-on-focus"
				:placeholder="placeholder ?? 'https://'"
				@keydown.enter.prevent="apply"
				@keydown.escape.prevent="collapse"
			>
			<ToolbarButton @click="apply">
				<ToolbarIcon>check</ToolbarIcon>
			</ToolbarButton>
			<ToolbarButton v-if="onRemove" @click="remove">
				<ToolbarIcon>link_off</ToolbarIcon>
			</ToolbarButton>
		</template>
	</div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarIcon from './ToolbarIcon.vue'

const props = defineProps<{
	iconName: string
	placeholder?: string
	initialUrl: string
	onApply: (url: string) => void
	onRemove?: (() => void) | undefined
	autoReveal?: boolean
}>()

const revealed = ref(false)
const localUrl = ref(props.initialUrl)
const inputEl = ref<HTMLInputElement | null>(null)

watch(
	() => props.initialUrl,
	(newUrl) => {
		localUrl.value = newUrl
		revealed.value = props.autoReveal ? !!newUrl : false
	},
)

const toggle = async () => {
	if (revealed.value) {
		collapse()
	} else {
		localUrl.value = props.initialUrl
		revealed.value = true
		await nextTick()
		inputEl.value?.focus()
	}
}

const apply = () => {
	if (localUrl.value) {
		props.onApply(localUrl.value)
	}
	collapse()
}

const collapse = () => {
	revealed.value = false
}

const remove = () => {
	props.onRemove?.()
	collapse()
}
</script>

<style scoped>
@layer ui {
	/* Dissolves into the toolbar row so input + buttons flow inline. */
	.toolbar-reveal {
		display: contents;
	}

	/* Structural only — chrome (bg, colour, border, radius, padding, focus)
	   comes from `sf sf-field sf-size-xs sf-text-xs sf-on-focus` on the input. */
	.toolbar-url-input {
		width: 180px;
	}
}
</style>
