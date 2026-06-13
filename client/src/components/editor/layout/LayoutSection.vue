<template>
	<div class="layout-section" :style="{ '--align': align }">
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
	container-type: inline-size;
	width: 100%;
}

:global(.layout-section > [data-node-view-content]) {
	display: flex;
	flex-direction: column;
	gap: var(--sf-gap, 0);
	padding: var(--sf-padding, 0);
	align-items: var(--align);
}

:global(.layout-section > [data-node-view-content] > *) {
	margin-bottom: 0;
}
</style>
