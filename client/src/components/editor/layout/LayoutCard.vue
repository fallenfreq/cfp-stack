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
		type: String as PropType<'elevated' | 'outlined' | 'filled' | 'plain' | 'feature'>,
		default: 'elevated',
	},
	radius: { type: String as PropType<'none' | 'sm' | 'md' | 'lg'>, default: 'md' },
})
</script>

<style scoped>
.layout-card {
	container-type: inline-size;
	width: 100%;
	height: 100%;
	border-radius: var(--radius);
	overflow: hidden;
}

:global(.layout-card > [data-node-view-content]) {
	display: block; /* defensive reset — prevents inherited grid/flex */
	padding: var(--padding);
}

.layout-card.variant-elevated {
	background: rgb(var(--backgroundSecondary));
	border: 1px solid rgb(var(--backgroundBorder));
	box-shadow: var(--shadow-lg) rgb(var(--shadow) / var(--alpha-20));
}

.layout-card.variant-outlined {
	border: 1px solid rgb(var(--backgroundBorder));
}

.layout-card.variant-filled {
	background: rgb(var(--backgroundSecondary));
}

.layout-card.variant-feature {
	background: rgba(var(--primary) / var(--alpha-10));
	border: 1px solid rgba(var(--primary) / var(--alpha-20));
}
</style>
