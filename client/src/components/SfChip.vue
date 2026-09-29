<template>
	<button
		type="button"
		class="sf sf-chip sf-single-line sf-on-disabled"
		:class="[
			size && `sf-size-${size}`,
			hover && !disabled && 'sf-on-hover',
			(current || pressed) && 'sf-on-current',
			selected && 'sf-on-selected',
		]"
		:disabled="disabled"
		:aria-pressed="pressed"
	>
		<slot />
	</button>
</template>

<script setup lang="ts">
const { hover = true, pressed = undefined } = defineProps<{
	size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	current?: boolean
	// Makes it a toggle (a filter that's on or off); screen readers hear which. Shows on
	// like `current`. Leave it out for a chip that isn't a toggle.
	pressed?: boolean | undefined
	selected?: boolean
	hover?: boolean
	// Can't be pressed; drops hover like SfButton.
	disabled?: boolean
}>()
</script>
