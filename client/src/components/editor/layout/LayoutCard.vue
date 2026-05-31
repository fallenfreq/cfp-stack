<template>
	<div
		class="layout-card"
		:class="`variant-${variant}`"
		:style="{ '--padding': SPACING[padding], '--radius': RADIUS[radius] }"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { RADIUS, SPACING } from '@/config/editor/layoutTokens'
import { type PropType } from 'vue'

defineProps({
	padding: { type: String as PropType<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>, default: 'md' },
	variant: {
		type: String as PropType<'elevated' | 'outlined' | 'filled' | 'plain'>,
		default: 'elevated',
	},
	radius: { type: String as PropType<'none' | 'sm' | 'md' | 'lg'>, default: 'md' },
})
</script>

<style scoped>
.layout-card {
	container-type: inline-size;
	width: 100%;
	border-radius: var(--radius);
	overflow: hidden;
}

.layout-card :deep([data-node-view-content]) {
	padding: var(--padding);
}

.layout-card.variant-elevated {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.layout-card.variant-outlined {
	border: 1px solid rgb(var(--backgroundBorder));
}

.layout-card.variant-filled {
	background: rgb(var(--backgroundSecondary));
}
</style>
