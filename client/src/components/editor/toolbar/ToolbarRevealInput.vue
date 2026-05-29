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
				class="toolbar-url-input"
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
	onRemove?: () => void
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
.toolbar-reveal {
	display: contents;
}

.toolbar-url-input {
	height: 26px;
	padding: 2px 6px;
	border-radius: 4px;
	border: 1px solid rgb(var(--backgroundBorder));
	background: rgb(var(--backgroundPrimary));
	color: rgb(var(--textPrimary));
	font-size: 0.8rem;
	width: 180px;
	outline: none;
}

.toolbar-url-input:focus {
	border-color: rgb(var(--primary));
}
</style>
