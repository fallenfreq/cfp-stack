<template>
	<div class="layout-section sl-stack" :style="{ '--align': align }">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
	align: { type: String as PropType<'start' | 'center' | 'end' | 'stretch'>, default: 'stretch' },
})
</script>

<style scoped>
.layout-section {
	width: 100%;
	padding: var(--sf-padding, 0);
	align-items: var(--align, stretch);
}

:global(.layout-section > [data-node-view-content]) {
	display: contents;
}

:global(.layout-section > [data-node-view-content] > *) {
	margin-bottom: 0;
}
</style>
