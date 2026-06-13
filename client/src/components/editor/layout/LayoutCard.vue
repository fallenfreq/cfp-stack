<template>
	<div class="layout-card" :class="`variant-${variant}`">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

defineProps({
	variant: {
		type: String as PropType<'elevated' | 'outlined' | 'filled' | 'plain' | 'feature'>,
		default: 'elevated',
	},
})
</script>

<style scoped>
.layout-card {
	container-type: inline-size;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

:global(.layout-card > [data-node-view-content]) {
	display: block; /* defensive reset — prevents inherited grid/flex */
	padding: var(--sf-padding, 0);
}

.layout-card.variant-elevated {
	background: rgb(var(--bg_secondary));
	border: 1px solid rgb(var(--border_color));
	box-shadow: var(--shadow-lg) rgb(var(--shadow) / var(--alpha-20));
}

.layout-card.variant-outlined {
	border: 1px solid rgb(var(--border_color));
}

.layout-card.variant-filled {
	background: rgb(var(--bg_secondary));
}

.layout-card.variant-feature {
	background: rgba(var(--primary) / var(--alpha-10));
	border: 1px solid rgba(var(--primary) / var(--alpha-20));
}
</style>
