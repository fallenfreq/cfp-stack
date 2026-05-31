<template>
	<div
		class="layout-center"
		:style="{ '--max-width': MAX_WIDTH[maxWidth], '--padding': SPACING[padding] }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { MAX_WIDTH, SPACING } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	maxWidth: {
		type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'>,
		default: 'lg',
	},
	padding: { type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>, default: 'md' },
})
</script>

<style scoped>
.layout-center {
	container-type: inline-size;
	width: 100%;
}

.layout-center :deep([data-node-view-content]) {
	max-width: var(--max-width);
	margin-inline: auto;
	padding-inline: var(--padding);
}
</style>
