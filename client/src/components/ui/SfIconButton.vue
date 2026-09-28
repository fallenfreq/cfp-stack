<template>
	<SfTooltip :text="tooltip">
		<!-- An icon has no words, so the tooltip is also the button's name. -->
		<SfButton :size="size" :aria-label="tooltip" v-bind="$attrs">
			<SfIcon :name="icon" />
		</SfButton>
	</SfTooltip>
</template>

<script setup lang="ts">
import type { ButtonSize } from './SfButton.vue'
import type { IconName } from './SfIcon.vue'

// Attributes and SfButton props (loudness, disabled, …) go to the button, not the tooltip.
defineOptions({ inheritAttrs: false })
withDefaults(
	defineProps<{
		icon: IconName
		tooltip: string
		size?: ButtonSize
	}>(),
	{ size: 'xs' },
)
</script>
