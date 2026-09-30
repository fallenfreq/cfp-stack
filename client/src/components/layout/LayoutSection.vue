<template>
	<div class="sl-stack" :style="{ 'align-items': align, padding: 'var(--sf-padding, 0)' }">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
	align: { type: String as PropType<'start' | 'center' | 'end' | 'stretch'>, default: 'stretch' },
})
</script>
