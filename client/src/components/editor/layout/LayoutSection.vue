<template>
	<div
		class="layout-section"
		:style="{ '--gap': SPACING[gap], '--padding': SPACING[padding], '--align': align }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { SPACING } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	gap: { type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>, default: 'md' },
	padding: {
		type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>,
		default: 'none',
	},
	align: { type: String as PropType<'start' | 'center' | 'end' | 'stretch'>, default: 'stretch' },
})
</script>

<style scoped>
.layout-section {
	container-type: inline-size;
	width: 100%;
}

.layout-section :deep([data-node-view-content]) {
	display: flex;
	flex-direction: column;
	gap: var(--gap);
	padding: var(--padding);
	align-items: var(--align);
}
</style>
