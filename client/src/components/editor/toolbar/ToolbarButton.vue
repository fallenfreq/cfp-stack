<template>
	<button
		class="toolbar-btn"
		:class="{ 'is-active': active }"
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
.toolbar-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 8px;
	border-radius: 4px;
	border: 1px solid transparent;
	background: transparent;
	color: rgb(var(--textPrimary));
	font-size: 0.8rem;
	cursor: pointer;
	white-space: nowrap;
	transition:
		background 0.1s,
		border-color 0.1s;
}
.toolbar-btn:hover:not(:disabled) {
	background: rgba(var(--textPrimary) / 0.08);
}
.toolbar-btn.is-active {
	background: rgba(var(--primary) / 0.12);
	border-color: rgba(var(--primary) / 0.4);
	color: rgb(var(--primary));
}
.toolbar-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}
</style>
