<template>
	<div
		class="sl-cover"
		:class="{
			'sl-align-y-start': positionY === 'start',
			'sl-align-y-end': positionY === 'end',
			'sl-align-x-start': positionX === 'start',
			'sl-align-x-end': positionX === 'end',
		}"
		:style="minHeightOverride ? { '--sl-cover-min': minHeightOverride } : undefined"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

const MIN_HEIGHT_MAP = {
	default: '',
	compact: '20rem',
	viewport: '100vh',
	fill: '100%',
} as const

type MinHeightKey = keyof typeof MIN_HEIGHT_MAP

const props = defineProps({
	positionY: {
		type: String as PropType<'start' | 'center' | 'end'>,
		default: 'center',
	},
	positionX: {
		type: String as PropType<'start' | 'center' | 'end'>,
		default: 'center',
	},
	minHeight: {
		type: String as PropType<MinHeightKey>,
		default: 'default',
	},
})

const minHeightOverride = computed(() => MIN_HEIGHT_MAP[props.minHeight])
</script>
