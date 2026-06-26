<template>
	<div
		class="layout-card sf-depth-1"
		:class="variant === 'featured' ? 'sf-variant-featured' : ''"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
defineProps({
	variant: {
		type: String,
		default: 'none',
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
	display: block;
	padding: var(--sf-padding, 0);
}
</style>
