<template>
	<div class="layout-columns" :style="{ '--cols': columns, '--align': align }">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
	columns: { type: String as PropType<'2' | '3' | '4'>, default: '2' },
	align: {
		type: String as PropType<'start' | 'center' | 'end' | 'stretch'>,
		default: 'stretch',
	},
})
</script>

<style scoped>
.layout-columns {
	container-type: inline-size;
	width: 100%;
}

:global(.layout-columns > [data-node-view-content]) {
	display: grid;
	grid-template-columns: repeat(var(--cols), 1fr);
	gap: var(--sf-gap, 0);
	align-items: var(--align, stretch);
}

:global(.layout-columns > [data-node-view-content] > *) {
	margin-bottom: 0;
}

/* Pixel values must match --breakpoint-* in base.css — var() is not valid in @container conditions. */
:global(.layout-columns.sf-collapse-xs > [data-node-view-content]) {
	@container (max-width: 380px) {
		grid-template-columns: 1fr;
	}
}

:global(.layout-columns.sf-collapse-sm > [data-node-view-content]) {
	@container (max-width: 640px) {
		grid-template-columns: 1fr;
	}
}

:global(.layout-columns.sf-collapse-md > [data-node-view-content]) {
	@container (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}
</style>
