<template>
	<div class="layout-center" :style="{ '--max-width': MAX_WIDTH[maxWidth] }">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { MAX_WIDTH } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	maxWidth: {
		type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'>,
		default: 'lg',
	},
})
</script>

<style scoped>
.layout-center {
	container-type: inline-size;
	width: 100%;
}

:global(.layout-center > [data-node-view-content]) {
	display: flex;
	flex-direction: column;
	gap: var(--sf-gap, 0);
	max-width: var(--max-width);
	margin-inline: auto;
	padding-inline: var(--sf-padding, 0);
}

:global(.layout-center > [data-node-view-content] > *) {
	margin-bottom: 0;
}
</style>
