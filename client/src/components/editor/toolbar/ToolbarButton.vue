<template>
	<button
		class="toolbar-btn sf sf-is-contained sf-on-hover sf-on-disabled sf-size-xs"
		:class="{ 'sf-on-current': active }"
		:disabled="disabled"
		@mousedown.prevent
		@click="$emit('click')"
	>
		<slot />
	</button>
</template>

<script setup lang="ts">
defineProps<{
	active?: boolean
	disabled?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<style scoped>
@layer ui {
	.toolbar-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		white-space: nowrap;
	}
}
</style>
