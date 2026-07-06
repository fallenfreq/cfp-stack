<template>
	<button
		class="btn sf-on-hover sf-on-disabled sf-size-xs"
		:class="{ 'sf-on-current': active }"
		:disabled="disabled"
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
	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--sf-gap, var(--sf-spacing-2xs));
		white-space: nowrap;
	}
}
</style>
