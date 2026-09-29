<template>
	<button
		type="button"
		class="sf sf-chip sf-on-disabled"
		:class="[
			size && `sf-size-${size}`,
			hover && !disabled && 'sf-on-hover',
			current && 'sf-on-current',
			selected && 'sf-on-selected',
		]"
		:disabled="disabled"
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
		// Can't be pressed; drops hover like SfButton.
		disabled?: boolean
	}>(),
	{ hover: true },
)
</script>
