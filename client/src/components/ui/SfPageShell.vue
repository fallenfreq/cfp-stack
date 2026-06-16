<template>
	<div class="mx-5 pt-5">
		<div class="flex justify-between items-center mb-5">
			<h1 class="text-4xl">{{ title }}</h1>
			<slot name="actions" />
		</div>
		<slot />
	</div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
