<template>
	<!-- A small toolbar button. mousedown.prevent keeps focus, and so the selection, in the
	     editor; current, disabled and click pass through to SfButton. Its tooltip shows on hover
	     and, for a button without words (an icon, a swatch), is its name. -->
	<SfTooltip :text="tooltip">
		<SfButton
			class="sf-is-contained"
			size="xs"
			:aria-label="label === undefined ? tooltip : undefined"
			v-bind="$attrs"
			@mousedown.prevent
		>
			<template v-if="label === undefined"><slot /></template>
			<template v-else>{{ label }}</template>
		</SfButton>
	</SfTooltip>
</template>

<script setup lang="ts">
// Attributes (the popover's trigger, current, disabled, click) go to the button, not the tooltip.
defineOptions({ inheritAttrs: false })
defineProps<{
	tooltip: string
	// The words the button shows, which are its name.
	label?: string
}>()
</script>
