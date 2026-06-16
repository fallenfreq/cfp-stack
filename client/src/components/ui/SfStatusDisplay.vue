<template>
	<div class="p-7">
		<p class="opacity-50">{{ message ?? defaults[state] }}</p>
	</div>
</template>

<script setup lang="ts">
defineProps<{ state: 'loading' | 'empty' | 'error'; message?: string }>()

const defaults = {
	loading: 'Loading…',
	empty: 'Nothing here.',
	error: 'Not found.',
}
</script>
