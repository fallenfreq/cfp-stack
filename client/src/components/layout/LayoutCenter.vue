<template>
	<div class="sl-center" :style="{ '--sl-measure': MAX_WIDTH[maxWidth] }">
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
:global(.sl-center > [data-node-view-content]) {
	display: flex;
	flex-direction: column;
	gap: var(--sf-gap, 0);
}

:global(.sl-center > [data-node-view-content] > *) {
	margin-bottom: 0;
}
</style>
