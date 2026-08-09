<template>
	<button
		type="button"
		class="sf sf-chip"
		:class="[
			size && `sf-size-${size}`,
			hover && 'sf-on-hover',
			current && 'sf-on-current',
			selected && 'sf-on-selected',
		]"
	>
		<slot />
	</button>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
		current?: boolean
		selected?: boolean
		hover?: boolean
	}>(),
	{ hover: true },
)
</script>
