<template>
	<div
		class="layout-center"
		:style="{
			'--max-width': MAX_WIDTH[maxWidth],
			'--padding': SPACING[padding],
			'--gap': SPACING[gap],
		}"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { MAX_WIDTH, SPACING } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	maxWidth: {
		type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'>,
		default: 'lg',
	},
	padding: { type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>, default: 'lg' },
	gap: { type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>, default: 'md' },
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
	gap: var(--gap);
	max-width: var(--max-width);
	margin-inline: auto;
	padding-inline: var(--padding);
}

:global(.layout-center > [data-node-view-content] > *) {
	margin-bottom: 0;
}
</style>
