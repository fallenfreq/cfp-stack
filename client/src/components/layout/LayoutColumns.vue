<template>
	<div
		class="sl-columns"
		:style="{ '--sl-cols': `repeat(${columns}, 1fr)`, 'align-items': align }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
	columns: { type: Number as PropType<2 | 3 | 4>, default: 2 },
	align: {
		type: String as PropType<'start' | 'center' | 'end' | 'stretch'>,
		default: 'stretch',
	},
})
</script>

<style scoped>
:global(.sl-columns > [data-node-view-content]) {
	display: contents;
}

:global(.sl-columns > [data-node-view-content] > *) {
	margin-bottom: 0;
}
</style>
