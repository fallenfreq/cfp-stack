<template>
	<div
		class="layout-split"
		:style="{ '--split-template': SPLIT_TEMPLATES[split], '--align': align }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { SPLIT_TEMPLATES } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	split: {
		type: String as PropType<'1/4' | '1/3' | '2/5' | '1/2' | '3/5' | '2/3' | '3/4'>,
		default: '1/3',
	},
	align: {
		type: String as PropType<'start' | 'center' | 'end' | 'stretch'>,
		default: 'stretch',
	},
})
</script>

<style scoped>
.layout-split {
	container-type: inline-size;
	width: 100%;
}

:global(.layout-split > [data-node-view-content]) {
	display: grid;
	grid-template-columns: var(--split-template);
	gap: var(--sf-gap, 0);
	align-items: var(--align, stretch);
}

:global(.layout-split > [data-node-view-content] > *) {
	margin-bottom: 0;
}

/* Pixel values must match --breakpoint-* in base.css — var() is not valid in @container conditions. */
:global(.layout-split.sf-collapse-xs > [data-node-view-content]) {
	@container (max-width: 380px) {
		grid-template-columns: 1fr;
	}
}

:global(.layout-split.sf-collapse-sm > [data-node-view-content]) {
	@container (max-width: 640px) {
		grid-template-columns: 1fr;
	}
}

:global(.layout-split.sf-collapse-md > [data-node-view-content]) {
	@container (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}
</style>
