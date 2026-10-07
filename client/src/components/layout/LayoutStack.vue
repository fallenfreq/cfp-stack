<template>
	<div
		class="sl-stack"
		:class="{
			'sl-align-x-start': align === 'start',
			'sl-align-x-center': align === 'center',
			'sl-align-x-end': align === 'end',
		}"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
	align: { type: String as PropType<'start' | 'center' | 'end' | 'stretch'>, default: 'stretch' },
})
</script>
